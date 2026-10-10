import { Router } from 'express';
import { getCustomers, getCustomerById } from '../controllers/user.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Protected Admin Customer Management Routes
router.get('/customers', authenticateToken, authorizeRoles('ADMIN'), getCustomers);
router.get('/customers/:id', authenticateToken, authorizeRoles('ADMIN'), getCustomerById);

export default router;
