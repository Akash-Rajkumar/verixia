import { Router } from 'express';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.get('/agents', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/agents not implemented yet');
});

router.get('/agents/:id', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/agents/:id not implemented yet');
});

router.post('/agents', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/agents not implemented yet');
});

export default router;
