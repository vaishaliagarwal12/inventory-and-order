import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All Order Endpoints Require Authentication
router.use(authenticateToken);

// POST /api/orders (create new order for authenticated user)
router.post('/', createOrder);

// GET /api/orders (list orders: customer sees own orders, admin sees all/filtered)
router.get('/', getOrders);

// GET /api/orders/:id (get order by ID: customer sees own, admin sees any)
router.get('/:id', getOrderById);

// PATCH /api/orders/:id/status (update status: admin can update any, customer can cancel own)
router.patch('/:id/status', updateOrderStatus);

export default router;
