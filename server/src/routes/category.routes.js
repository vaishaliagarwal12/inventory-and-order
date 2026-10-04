import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Public Read Routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Protected Admin Write Routes
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createCategory);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateCategory);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteCategory);

export default router;
