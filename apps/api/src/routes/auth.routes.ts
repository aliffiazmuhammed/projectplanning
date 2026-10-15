import { Router } from 'express';
import { signUp, signIn, getMe, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signUp);
router.post('/login', signIn);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

export { router as authRoutes };
