import { Router } from 'express';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.get('/reputation', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/reputation not implemented yet');
});

router.get('/reputation/:address', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/reputation/:address not implemented yet');
});

router.post('/reputation/feedback', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/reputation/feedback not implemented yet');
});

router.get('/reputation/feedback', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/reputation/feedback not implemented yet');
});

router.post('/reputation/feedback/:feedbackId/dispute', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/reputation/feedback/:feedbackId/dispute not implemented yet');
});

router.post('/reputation/feedback/:feedbackId/resolve', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/reputation/feedback/:feedbackId/resolve not implemented yet');
});

export default router;
