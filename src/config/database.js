import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { env } from '#config/env.js';
import { logger } from '#config/logger.js';
import { schema } from '#models/index.js';

if (env.NEON_PROXY_URL) {
  neonConfig.fetchEndpoint = env.NEON_PROXY_URL;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
  logger.info(`Neon Local proxy enabled: ${env.NEON_PROXY_URL}`);
}

const client = neon(env.DATABASE_URL);

export const db = drizzle(client, { schema });

export async function checkDatabaseHealth(timeoutMs = 3000) {
  const probe = neon(env.DATABASE_URL, {
    fetchOptions: { signal: AbortSignal.timeout(timeoutMs) },
  });
  const started = Date.now();
  await probe`SELECT 1`;
  return { latencyMs: Date.now() - started };
}

export { sql };
