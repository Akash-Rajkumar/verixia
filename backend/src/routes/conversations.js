import { Router } from 'express';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.post('/conversations', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/conversations not implemented yet');
});

router.get('/conversations/:id/messages', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/conversations/:id/messages not implemented yet');
});

export default router;
