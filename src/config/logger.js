import winston from 'winston';
import { env } from '#config/env.js';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const devFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize(),
  printf(({ level, message, timestamp: ts, stack, service, ...meta }) => {
    const rest = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const trace = stack ? `\n${stack}` : '';
    return `${ts} [${level}] ${service ?? 'acquisitions-api'}: ${message}${rest}${trace}`;
  }),
);

const prodFormat = combine(errors({ stack: true }), timestamp(), json());

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: 'acquisitions-api' },
  format: env.isProd ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

export const morganStream = {
  write: (message) => logger.http(message.trim()),
};
