import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from '#config/env.js';
import { corsOptions } from '#config/cors.js';
import { logger, morganStream } from '#config/logger.js';
import { arcjetShield } from '#middleware/arcjet.middleware.js';
import { notFoundHandler } from '#middleware/notFound.middleware.js';
import { errorHandler } from '#middleware/error.middleware.js';
import { health, liveness, readiness } from '#controllers/health.controller.js';
import apiRouter from '#routes/index.js';

const app = express();

app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

if (!env.isTest) {
  app.use(morgan(':method :url :status :response-time ms - :res[content-length]', { stream: morganStream }));
}

app.use(arcjetShield);

app.get('/', (_req, res) =>
  res.json({
    success: true,
    message: 'Acquisitions API',
    data: { version: '1.0.0', docs: `${env.API_PREFIX}/health` },
  }),
);
app.get('/health', health);
app.get('/healthz', liveness);
app.get('/readyz', readiness);

app.use(env.API_PREFIX, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.stack : reason });
});

export default app;
