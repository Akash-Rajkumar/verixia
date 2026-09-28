import { Router } from 'express';
import { sendNotImplemented } from '../utils/response.js';

const router = Router();

router.get('/charter/rules', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/charter/rules not implemented yet');
});

router.get('/charter/status', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/charter/status not implemented yet');
});

router.post('/charter/check', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/charter/check not implemented yet');
});

router.put('/charter/rules', (req, res) => {
  return sendNotImplemented(res, 'PUT /api/v1/charter/rules not implemented yet');
});

router.get('/charter/counterparties', (req, res) => {
  return sendNotImplemented(res, 'GET /api/v1/charter/counterparties not implemented yet');
});

router.put('/charter/counterparties/:address', (req, res) => {
  return sendNotImplemented(res, 'PUT /api/v1/charter/counterparties/:address not implemented yet');
});

export default router;
