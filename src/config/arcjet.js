import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/node';
import { env } from '#config/env.js';
import { logger } from '#config/logger.js';

const createClient = (rules) => {
  if (!env.ARCJET_KEY) {
    logger.warn('ARCJET_KEY is not set. ArcJet protection is disabled (all requests allowed).');
    return null;
  }

  try {
    return arcjet({ key: env.ARCJET_KEY, rules });
  } catch (error) {
    logger.error('Failed to initialize ArcJet client. Protection is disabled.', { error: error.message });
    return null;
  }
};

export const ajShield = createClient([
  shield({ mode: env.arcjetMode }),
  detectBot({ mode: env.arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE'] }),
]);

export const ajRateLimit = createClient([
  slidingWindow({ mode: env.arcjetMode, interval: env.ARCJET_RATE_LIMIT_INTERVAL, max: env.ARCJET_RATE_LIMIT_MAX }),
]);

export const ajAuthRateLimit = createClient([
  slidingWindow({
    mode: env.arcjetMode,
    interval: env.ARCJET_RATE_LIMIT_INTERVAL,
    max: env.ARCJET_AUTH_RATE_LIMIT_MAX,
  }),
]);
