import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
} from '../controllers/product.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Public Read Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected Admin Write Routes
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createProduct);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateProduct);
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN'), updateProductStatus);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteProduct);

export default router;
