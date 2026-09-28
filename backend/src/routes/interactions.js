import { Router } from 'express';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.post('/counterparty/offer', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/counterparty/offer not implemented yet');
});

router.post('/good-agent/respond', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/good-agent/respond not implemented yet');
});

export default router;
