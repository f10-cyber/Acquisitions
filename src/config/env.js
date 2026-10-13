import { z } from 'zod';

const boolFromString = (fallback) =>
  z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === '' ? fallback : value.toLowerCase() === 'true'));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),

  DATABASE_URL: z.string().default('postgres://neon:npg@localhost:5432/neondb'),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  NEON_PROXY_URL: z.string().optional(),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  COOKIE_SECURE: boolFromString(false),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  ARCJET_KEY: z.string().optional(),
  ARCJET_ENV: z.string().default('development'),
  ARCJET_RATE_LIMIT_INTERVAL: z.coerce.number().int().positive().default(60),
  ARCJET_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  ARCJET_AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('debug'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

const data = parsed.data;

export const env = {
  ...data,
  DATABASE_URL_UNPOOLED: data.DATABASE_URL_UNPOOLED || data.DATABASE_URL,
  isProd: data.NODE_ENV === 'production',
  isDev: data.NODE_ENV === 'development',
  isTest: data.NODE_ENV === 'test',
  arcjetMode: data.NODE_ENV === 'production' ? 'LIVE' : 'DRY_RUN',
  cookieOrigins: data.CLIENT_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
