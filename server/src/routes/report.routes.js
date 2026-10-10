import { Router } from 'express';
import { getReportSummary } from '../controllers/report.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Protected Admin Operational Report Route
router.get('/dashboard', authenticateToken, authorizeRoles('ADMIN'), getReportSummary);

export default router;
