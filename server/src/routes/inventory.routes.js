import { Router } from 'express';
import {
  getInventory,
  getInventoryById,
  getInventoryByProductId,
  createInventory,
  updateInventoryQuantity,
  adjustInventoryQuantity,
  getInventoryMovements,
  getInventoryMovementsByProductId,
} from '../controllers/inventory.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Protected Admin Audit Log Routes (MUST be registered before parameterized /:id routes)
router.get('/movements', authenticateToken, authorizeRoles('ADMIN'), getInventoryMovements);
router.get('/movements/product/:productId', authenticateToken, authorizeRoles('ADMIN'), getInventoryMovementsByProductId);

// Public / Authenticated Read Routes
router.get('/', getInventory);
router.get('/product/:productId', getInventoryByProductId);
router.get('/:id', getInventoryById);

// Protected Admin Write Routes
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createInventory);
router.put('/product/:productId', authenticateToken, authorizeRoles('ADMIN'), updateInventoryQuantity);
router.patch('/product/:productId/adjust', authenticateToken, authorizeRoles('ADMIN'), adjustInventoryQuantity);

export default router;
