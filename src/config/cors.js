import { env } from '#config/env.js';

export const corsOptions = {
  origin: env.cookieOrigins.length > 0 ? env.cookieOrigins : false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};
