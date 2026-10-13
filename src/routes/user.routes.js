import { Router } from 'express';
import {
  adminDeactivateUser,
  adminGetUser,
  adminListUsers,
  adminReactivateUser,
  adminSetRole,
  deleteAccount,
  getProfile,
  getUserById,
  updateProfile,
} from '#controllers/user.controller.js';
import { authenticate } from '#middleware/auth.middleware.js';
import { authorize } from '#middleware/role.middleware.js';
import { validate } from '#middleware/validate.middleware.js';
import { uuidParamSchema } from '#validations/common.validation.js';
import { adminListUsersQuerySchema, adminSetRoleSchema, updateProfileSchema } from '#validations/user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.delete('/profile', deleteAccount);

router.get('/admin', authorize('admin'), validate(adminListUsersQuerySchema, 'query'), adminListUsers);
router.get('/admin/:id', authorize('admin'), validate(uuidParamSchema, 'params'), adminGetUser);
router.patch(
  '/admin/:id/role',
  authorize('admin'),
  validate(uuidParamSchema, 'params'),
  validate(adminSetRoleSchema),
  adminSetRole,
);
router.post('/admin/:id/deactivate', authorize('admin'), validate(uuidParamSchema, 'params'), adminDeactivateUser);
router.post('/admin/:id/reactivate', authorize('admin'), validate(uuidParamSchema, 'params'), adminReactivateUser);

router.get('/:id', validate(uuidParamSchema, 'params'), getUserById);

export default router;
