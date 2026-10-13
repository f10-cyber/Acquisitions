import { env } from '#config/env.js';
import { logger } from '#config/logger.js';
import { AppError } from '#utils/AppError.js';

function normalizeError(error) {
  if (error instanceof AppError) return error;

  if (error?.code === '23505' || /duplicate key value/i.test(error?.message ?? '')) {
    return AppError.conflict('A resource with these unique values already exists');
  }

  if (error?.code === '23503' || /violates foreign key constraint/i.test(error?.message ?? '')) {
    return AppError.badRequest('Referenced resource does not exist');
  }

  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    return AppError.unauthorized('Authentication token is invalid or expired');
  }

  if (error?.type === 'entity.parse.failed' || error?.name === 'SyntaxError') {
    return AppError.badRequest(env.isProd ? 'Malformed JSON in request body' : (error?.message ?? 'Malformed JSON'));
  }

  const status = error?.status ?? error?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 600) {
    return new AppError(
      status,
      env.isProd && status >= 500 ? 'Internal server error' : (error?.message ?? 'Request failed'),
    );
  }

  return new AppError(500, env.isProd ? 'Internal server error' : (error?.message ?? 'Internal server error'));
}

export const errorHandler = (error, req, res, _next) => {
  const normalized = normalizeError(error);

  if (normalized.statusCode >= 500) {
    logger.error(normalized.message, {
      path: req.path,
      method: req.method,
      stack: error?.stack,
    });
  } else {
    logger.warn(normalized.message, {
      path: req.path,
      method: req.method,
      code: normalized.code,
    });
  }

  const body = { success: false, message: normalized.message, code: normalized.code };
  if (normalized.details !== undefined) body.details = normalized.details;
  if (!env.isProd && normalized.statusCode >= 500 && error?.stack) body.stack = error.stack;

  return res.status(normalized.statusCode).json(body);
};
