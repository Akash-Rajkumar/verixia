import { Router } from 'express';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.get('/receipts/:receiptId', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/receipts/:receiptId not implemented yet');
});

router.get('/receipts/:receiptId/verify', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/receipts/:receiptId/verify not implemented yet');
});

export default router;
