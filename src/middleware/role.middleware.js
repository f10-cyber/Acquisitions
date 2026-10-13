import { AppError } from '#utils/AppError.js';

export const authorize =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized('Authentication required'));

    const roles = allowedRoles.flat();
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
