import { createHash } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '#config/database.js';
import { logger } from '#config/logger.js';
import { users } from '#models/user.model.js';
import { refreshTokens } from '#models/refreshToken.model.js';
import { AppError } from '#utils/AppError.js';
import { comparePassword, hashPassword } from '#utils/password.js';
import { decodeToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '#utils/jwt.js';
import { sanitizeUser } from '#utils/format.js';

const hashRefreshToken = (token) => createHash('sha256').update(token).digest('hex');

async function issueSession(user, { userAgent, ipAddress }) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  const decoded = decodeToken(refreshToken);
  const expiresAt = new Date((decoded?.exp ?? Math.floor(Date.now() / 1000) + 7 * 24 * 3600) * 1000);

  await db.insert(refreshTokens).values({
    tokenHash: hashRefreshToken(refreshToken),
    userId: user.id,
    userAgent: userAgent ?? null,
    ipAddress: ipAddress ?? null,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

async function findActiveSession(tokenHash) {
  const [session] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return session ?? null;
}

export async function registerUser({ name, email, password, role }, context = {}) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw AppError.conflict('An account with this email already exists');

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: role ?? 'user' })
    .returning();

  logger.info('User registered', { userId: user.id, email: user.email });
  const tokens = await issueSession(user, context);
  return { user: sanitizeUser(user), tokens };
}

export async function loginUser({ email, password }, context = {}) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.isActive) throw AppError.unauthorized('Invalid email or password');

  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) throw AppError.unauthorized('Invalid email or password');

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const tokens = await issueSession(user, context);
  logger.info('User logged in', { userId: user.id });
  return { user: sanitizeUser(user), tokens };
}

export async function refreshSession({ refreshToken }, context = {}) {
  if (!refreshToken) throw AppError.unauthorized('Refresh token is missing');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Refresh token is invalid or expired');
  }

  const session = await findActiveSession(hashRefreshToken(refreshToken));
  if (!session || session.userId !== payload.sub) throw AppError.unauthorized('Refresh token is invalid or expired');

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (!user || !user.isActive) throw AppError.unauthorized('Account is no longer available');

  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, session.id));

  const tokens = await issueSession(user, context);
  return { user: sanitizeUser(user), tokens };
}

export async function logoutUser({ refreshToken }) {
  if (!refreshToken) return { revoked: false };
  const [result] = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, hashRefreshToken(refreshToken)), isNull(refreshTokens.revokedAt)))
    .returning({ id: refreshTokens.id });
  return { revoked: Boolean(result) };
}

export async function logoutAllSessions(userId) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  return { revoked: true };
}
