import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '#config/database.js';
import { logger } from '#config/logger.js';
import { users } from '#models/user.model.js';
import { AppError } from '#utils/AppError.js';
import { comparePassword, hashPassword } from '#utils/password.js';
import { sanitizeUser } from '#utils/format.js';
import { getPagination } from '#utils/pagination.js';
import { logoutAllSessions } from '#services/auth.service.js';

function withoutUndefined(patch) {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

export async function getUserProfile(userId) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('User not found');
  return sanitizeUser(user);
}

export async function updateUserProfile(userId, patch) {
  const updates = withoutUndefined(patch);
  if (Object.keys(updates).length === 0) throw AppError.badRequest('Provide at least one field to update');

  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
  if (!updated) throw AppError.notFound('User not found');
  return sanitizeUser(updated);
}

export async function changeUserPassword(userId, { currentPassword, newPassword }) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('User not found');

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) throw AppError.unauthorized('Current password is incorrect');

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, userId));
  await logoutAllSessions(userId);

  logger.info('User changed password', { userId });
  return { changed: true };
}

export async function listUsers(query = {}) {
  const { page, limit, offset } = getPagination(query);
  const conditions = [];

  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(or(ilike(users.name, term), ilike(users.email, term)));
  }
  if (query.role) conditions.push(eq(users.role, query.role));
  if (query.isActive !== undefined) conditions.push(eq(users.isActive, query.isActive));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderBy =
    query.sort === 'oldest' ? asc(users.createdAt) : query.sort === 'name' ? asc(users.name) : desc(users.createdAt);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(users).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);

  return { data: rows.map(sanitizeUser), page, limit, total };
}

export async function setUserRole(userId, role) {
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
  if (!updated) throw AppError.notFound('User not found');
  logger.info('Admin updated user role', { userId, role });
  return sanitizeUser(updated);
}

export async function setUserActive(userId, isActive) {
  const [updated] = await db.update(users).set({ isActive }).where(eq(users.id, userId)).returning();
  if (!updated) throw AppError.notFound('User not found');
  if (!isActive) await logoutAllSessions(userId);
  return sanitizeUser(updated);
}

export async function deleteUser(userId) {
  const [deleted] = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
  if (!deleted) throw AppError.notFound('User not found');
  logger.info('User deleted', { userId });
  return { deleted: true };
}
