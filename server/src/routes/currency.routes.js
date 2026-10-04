import { Router } from 'express';
import { getRates } from '../controllers/currency.controller.js';

const router = Router();

// GET /api/currency/rates (public endpoint for exchange rates)
router.get('/rates', getRates);

export default router;
