import { AppError } from '#utils/AppError.js';
import { verifyAccessToken } from '#utils/jwt.js';
import { ACCESS_TOKEN_COOKIE } from '#utils/cookies.js';

export const authenticate = (req, _res, next) => {
  const fromCookie = req.cookies?.[ACCESS_TOKEN_COOKIE];
  const fromHeader = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined;
  const token = fromCookie || fromHeader;

  if (!token) return next(AppError.unauthorized('Access token is missing'));

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(AppError.unauthorized('Access token is invalid or expired'));
  }
};

export const optionalAuthenticate = (req, _res, next) => {
  const fromCookie = req.cookies?.[ACCESS_TOKEN_COOKIE];
  const fromHeader = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined;
  const token = fromCookie || fromHeader;

  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    req.user = undefined;
  }
  return next();
};
