import 'dotenv/config';
import { logger } from '#config/logger.js';
import { startServer } from './server.js';

startServer().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});
