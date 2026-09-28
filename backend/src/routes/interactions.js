import { Router } from 'express';
import { sendSuccess, sendError, sendNotImplemented } from '../utils/response.js';
import { getDefaultAgentRuntime } from '../agent/createAgentRuntime.js';
import { ValidationError } from '../agent/errors.js';

const router = Router();

router.post('/counterparty/offer', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/counterparty/offer not implemented yet');
});

/**
 * POST /api/v1/good-agent/respond
 * Processes an incoming interaction prompt through GoodAgentPipeline
 */
router.post('/good-agent/respond', async (req, res, next) => {
  try {
    const { id, sender, content, counterparty, amountWei, contextHistory } = req.body || {};

    if (!content || typeof content !== 'string' || !content.trim()) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation Error: Missing or invalid "content" string field',
        { requiredField: 'content' }
      );
    }

    const eventId = id && typeof id === 'string'
      ? id
      : `0x${Date.now().toString(16).padStart(64, '0')}`;

    const eventSender = sender && typeof sender === 'string' ? sender : 'user';

    const event = {
      id: eventId,
      sender: eventSender,
      content: content.trim(),
      counterparty: counterparty && typeof counterparty === 'string' ? counterparty.trim() : undefined,
      amountWei: amountWei !== undefined && amountWei !== null ? String(amountWei) : undefined,
      contextHistory: Array.isArray(contextHistory) ? contextHistory : undefined
    };

    const runtime = req.app.locals.agentRuntime || getDefaultAgentRuntime();
    const turnResult = await runtime.processTurn(event);

    return sendSuccess(res, turnResult);
  } catch (err) {
    if (err instanceof ValidationError) {
      return sendError(res, 400, 'VALIDATION_ERROR', err.message, err.details || {});
    }
    return next(err);
  }
});

export default router;
