import { Router } from 'express';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.post('/admin/reset-demo', requireAdminAuth, (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/admin/reset-demo not implemented yet');
});

export default router;
