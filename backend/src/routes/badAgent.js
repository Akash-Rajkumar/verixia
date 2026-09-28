import { Router } from 'express';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.get('/bad-agent/attacks', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/bad-agent/attacks not implemented yet');
});

router.post('/bad-agent/attack', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/bad-agent/attack not implemented yet');
});

router.post('/demo/run-attack-sequence', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/demo/run-attack-sequence not implemented yet');
});

export default router;
