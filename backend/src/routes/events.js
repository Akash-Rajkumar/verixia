import { Router } from 'express';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.get('/events', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/events not implemented yet');
});

export default router;
