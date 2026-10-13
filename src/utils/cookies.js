import { env } from '#config/env.js';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export function accessCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd || env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.isProd ? env.COOKIE_DOMAIN : undefined,
    path: '/',
    maxAge: 15 * 60 * 1000,
  };
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd || env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.isProd ? env.COOKIE_DOMAIN : undefined,
    path: '/api',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function expiredCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd || env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: '/api',
    maxAge: 0,
  };
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions());
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...accessCookieOptions(), path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, expiredCookieOptions());
}
