import { ajAuthRateLimit, ajRateLimit, ajShield } from '#config/arcjet.js';
import { logger } from '#config/logger.js';
import { AppError } from '#utils/AppError.js';

const runProtection = (client, context) => async (req, _res, next) => {
  if (!client) return next();

  try {
    const decision = await client.protect(req);

    if (decision.isDenied()) {
      logger.warn(`ArcJet denied request (${context})`, {
        path: req.path,
        ip: decision.ip?.country,
        conclusion: decision.conclusion,
      });

      if (decision.reason.isRateLimit()) {
        return next(AppError.tooManyRequests());
      }
      if (decision.reason.isBot()) {
        return next(AppError.forbidden('Automated clients are not allowed'));
      }
      return next(AppError.forbidden('Request blocked by security policy'));
    }

    if (decision.isErrored()) {
      logger.warn(`ArcJet errored (${context}); failing open`, {
        path: req.path,
        results: decision.results.map((result) => result.reason.message ?? result.conclusion),
      });
    }

    return next();
  } catch (error) {
    logger.error(`ArcJet middleware failure (${context}); failing open`, { error: error.message });
    return next();
  }
};

export const arcjetShield = runProtection(ajShield, 'shield');
export const arcjetRateLimit = runProtection(ajRateLimit, 'rate-limit');
export const arcjetAuthRateLimit = runProtection(ajAuthRateLimit, 'auth-rate-limit');
