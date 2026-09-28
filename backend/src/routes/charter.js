import { Router } from 'express';
import { sendSuccess, sendError, sendNotImplemented } from '../utils/response.js';
import {
  getCharterRules,
  getCharterStatus,
  checkCharterPayment
} from '../services/chain/index.js';

const router = Router();

/**
 * GET /api/v1/charter/rules
 * Returns configured SpendingCharter rules
 */
router.get('/charter/rules', async (req, res, next) => {
  try {
    const rules = await getCharterRules();
    return sendSuccess(res, rules);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/charter/status
 * Returns current SpendingCharter window status and contract balance
 */
router.get('/charter/status', async (req, res, next) => {
  try {
    const status = await getCharterStatus();
    return sendSuccess(res, status);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/v1/charter/check
 * Performs an off-chain/read-only SpendingCharter payment check
 */
router.post('/charter/check', async (req, res, next) => {
  try {
    const { toAddress, amount } = req.body || {};

    if (!toAddress || typeof toAddress !== 'string') {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation Error: Missing or invalid "toAddress" string field',
        { requiredField: 'toAddress' }
      );
    }

    if (amount === undefined || amount === null || typeof amount !== 'string') {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation Error: Missing or invalid "amount" string field (decimal MST string expected)',
        { requiredField: 'amount' }
      );
    }

    const checkRes = await checkCharterPayment(toAddress, amount);
    return sendSuccess(res, checkRes);
  } catch (err) {
    return next(err);
  }
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
