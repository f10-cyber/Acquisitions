import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '#config/env.js';

const ISSUER = 'acquisitions-api';

export function signAccessToken({ sub, email, role }) {
  return jwt.sign({ email, role }, env.JWT_SECRET, {
    subject: sub,
    issuer: ISSUER,
    audience: 'access',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken({ sub }) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: sub,
    issuer: ISSUER,
    audience: 'refresh',
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    jwtid: randomUUID(),
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER, audience: 'access' });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER, audience: 'refresh' });
}

export function decodeToken(token) {
  return jwt.decode(token);
}
