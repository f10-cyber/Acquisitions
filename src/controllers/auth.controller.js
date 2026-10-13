import { loginUser, logoutUser, refreshSession, registerUser } from '#services/auth.service.js';
import { changeUserPassword, getUserProfile } from '#services/user.service.js';
import { clearAuthCookies, REFRESH_TOKEN_COOKIE, setAuthCookies } from '#utils/cookies.js';
import { sendSuccess } from '#utils/format.js';
import { asyncHandler } from '#utils/asyncHandler.js';

const requestContext = (req) => ({
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip,
});

export const register = asyncHandler(async (req, res) => {
  const { user, tokens } = await registerUser(req.body, requestContext(req));
  setAuthCookies(res, tokens);
  return sendSuccess(res, { data: { user }, message: 'Account created successfully', statusCode: 201 });
});

export const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await loginUser(req.body, requestContext(req));
  setAuthCookies(res, tokens);
  return sendSuccess(res, { data: { user }, message: 'Logged in successfully' });
});

export const refresh = asyncHandler(async (req, res) => {
  const { user, tokens } = await refreshSession(
    { refreshToken: req.cookies?.[REFRESH_TOKEN_COOKIE] },
    requestContext(req),
  );
  setAuthCookies(res, tokens);
  return sendSuccess(res, { data: { user }, message: 'Session refreshed' });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser({ refreshToken: req.cookies?.[REFRESH_TOKEN_COOKIE] });
  clearAuthCookies(res);
  return sendSuccess(res, { message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.user.id);
  return sendSuccess(res, { data: { user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await changeUserPassword(req.user.id, req.body);
  return sendSuccess(res, { data: result, message: 'Password changed successfully. All sessions were revoked.' });
});
