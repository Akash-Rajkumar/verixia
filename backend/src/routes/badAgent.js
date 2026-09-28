import { Router } from 'express';
import { sendSuccess, sendError, sendNotImplemented } from '../utils/response.js';
import { getAttacks, generateAttack } from '../../../agents/bad/index.js';

const router = Router();

/**
 * GET /api/v1/bad-agent/attacks
 * Returns list of supported adversarial attack definitions
 */
router.get('/bad-agent/attacks', (req, res) => {
  const attacks = getAttacks();
  return sendSuccess(res, attacks);
});

/**
 * POST /api/v1/bad-agent/attack
 * Generates an adversarial attack payload for the requested attackType and conversationId
 */
router.post('/bad-agent/attack', (req, res) => {
  const { attackType, conversationId } = req.body || {};

  if (!attackType || typeof attackType !== 'string') {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Validation Error: Missing or invalid "attackType" field in request body',
      { requiredField: 'attackType' }
    );
  }

  if (conversationId !== undefined && typeof conversationId !== 'string' && conversationId !== null) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Validation Error: "conversationId" must be a string or null',
      { field: 'conversationId' }
    );
  }

  const attack = generateAttack(attackType, { conversationId });

  if (!attack) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      `Validation Error: Unsupported attackType "${attackType}". Supported types: urgent_pretext, prompt_injection, fake_trust_claim`,
      { supportedAttackTypes: ['urgent_pretext', 'prompt_injection', 'fake_trust_claim'] }
    );
  }

  return sendSuccess(res, attack);
});

/**
 * POST /api/v1/demo/run-attack-sequence
 * Remains 501 NOT_IMPLEMENTED for this checkpoint
 */
router.post('/demo/run-attack-sequence', (req, res) => {
  return sendNotImplemented(res, 'POST /api/v1/demo/run-attack-sequence not implemented yet');
});

export default router;
