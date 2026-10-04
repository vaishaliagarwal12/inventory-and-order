import { Router } from 'express';
import { register, login, getMe, getUsers } from '../controllers/auth.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/register (public)
router.post('/register', register);

// POST /api/auth/login (public)
router.post('/login', login);

// GET /api/auth/me (authenticated user profile)
router.get('/me', authenticateToken, getMe);

// GET /api/auth/users (admin only user listing)
router.get('/users', authenticateToken, authorizeRoles('ADMIN'), getUsers);

export default router;

