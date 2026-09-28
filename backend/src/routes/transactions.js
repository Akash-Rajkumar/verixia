import { Router } from 'express';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.get('/transactions', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/transactions not implemented yet');
});

router.get('/transactions/:id', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/transactions/:id not implemented yet');
});

export default router;
