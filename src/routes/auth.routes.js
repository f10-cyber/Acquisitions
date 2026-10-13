import { Router } from 'express';
import { changePassword, login, logout, me, refresh, register } from '#controllers/auth.controller.js';
import { authenticate } from '#middleware/auth.middleware.js';
import { arcjetAuthRateLimit } from '#middleware/arcjet.middleware.js';
import { validate } from '#middleware/validate.middleware.js';
import { changePasswordSchema, loginSchema, registerSchema } from '#validations/auth.validation.js';

const router = Router();

router.post('/register', arcjetAuthRateLimit, validate(registerSchema), register);
router.post('/login', arcjetAuthRateLimit, validate(loginSchema), login);
router.post('/refresh', arcjetAuthRateLimit, refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
