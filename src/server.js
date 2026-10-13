import http from 'node:http';
import app from './app.js';
import { env } from '#config/env.js';
import { logger } from '#config/logger.js';
import { checkDatabaseHealth } from '#config/database.js';

export const server = http.createServer(app);

async function waitForDatabase(attempts = 5, delayMs = 1000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { latencyMs } = await checkDatabaseHealth();
      logger.info(`Database is reachable (${latencyMs}ms)`);
      return true;
    } catch (error) {
      logger.warn(`Database not reachable yet (attempt ${attempt}/${attempts}): ${error.message}`);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

export async function startServer() {
  await waitForDatabase();
  return new Promise((resolve) => {
    server.listen(env.PORT, () => {
      logger.info(`Acquisitions API listening on port ${env.PORT} (${env.NODE_ENV})`);
      resolve(server);
    });
  });
}

function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
