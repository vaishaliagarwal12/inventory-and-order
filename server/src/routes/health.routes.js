import { Router } from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = Router();

// GET /api/health
router.get('/health', checkHealth);

export default router;
