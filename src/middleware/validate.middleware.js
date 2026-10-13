import { AppError } from '#utils/AppError.js';

function assignValidated(req, source, data) {
  Object.defineProperty(req, source, { value: data, writable: true, configurable: true, enumerable: true });
}

export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const raw = source === 'params' ? req.params : source === 'query' ? req.query : req.body;
    const result = schema.safeParse(raw);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      return next(AppError.unprocessable('Validation failed', details));
    }

    assignValidated(req, source, result.data);
    return next();
  };
