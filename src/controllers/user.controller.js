import {
  deleteUser,
  getUserProfile,
  listUsers,
  setUserActive,
  setUserRole,
  updateUserProfile,
} from '#services/user.service.js';
import { sendPaginated, sendSuccess } from '#utils/format.js';
import { asyncHandler } from '#utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.user.id);
  return sendSuccess(res, { data: { user } });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.params.id);
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    const { email: _email, ...publicProfile } = user;
    return sendSuccess(res, { data: { user: publicProfile } });
  }
  return sendSuccess(res, { data: { user } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateUserProfile(req.user.id, req.body);
  return sendSuccess(res, { data: { user }, message: 'Profile updated successfully' });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const result = await deleteUser(req.user.id);
  return sendSuccess(res, { data: result, message: 'Account deleted successfully' });
});

export const adminListUsers = asyncHandler(async (req, res) => {
  const { data, page, limit, total } = await listUsers(req.query);
  return sendPaginated(res, { data, page, limit, total });
});

export const adminGetUser = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.params.id);
  return sendSuccess(res, { data: { user } });
});

export const adminSetRole = asyncHandler(async (req, res) => {
  const user = await setUserRole(req.params.id, req.body.role);
  return sendSuccess(res, { data: { user }, message: 'User role updated successfully' });
});

export const adminDeactivateUser = asyncHandler(async (req, res) => {
  const user = await setUserActive(req.params.id, false);
  return sendSuccess(res, { data: { user }, message: 'User deactivated successfully' });
});

export const adminReactivateUser = asyncHandler(async (req, res) => {
  const user = await setUserActive(req.params.id, true);
  return sendSuccess(res, { data: { user }, message: 'User reactivated successfully' });
});
