import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import { getAttacks, generateAttack, ATTACK_TYPES } from '../../../agents/bad/index.js';
import { getDefaultAgentRuntime } from '../agent/createAgentRuntime.js';

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
 * Runs the canonical 3-attack adversarial sequence against GoodAgentPipeline
 */
router.post('/demo/run-attack-sequence', async (req, res, next) => {
  try {
    const { conversationId = `demo-conv-${Date.now()}` } = req.body || {};
    const runtime = req.app.locals.agentRuntime || getDefaultAgentRuntime();

    const sequenceTypes = [
      ATTACK_TYPES.URGENT_PRETEXT,
      ATTACK_TYPES.PROMPT_INJECTION,
      ATTACK_TYPES.FAKE_TRUST_CLAIM
    ];

    const defaultCounterparties = {
      [ATTACK_TYPES.URGENT_PRETEXT]: '0x9999999999999999999999999999999999999999',
      [ATTACK_TYPES.PROMPT_INJECTION]: '0x9999999999999999999999999999999999999999',
      [ATTACK_TYPES.FAKE_TRUST_CLAIM]: '0x8888888888888888888888888888888888888888'
    };

    const defaultAmounts = {
      [ATTACK_TYPES.URGENT_PRETEXT]: '500000000000000000',
      [ATTACK_TYPES.PROMPT_INJECTION]: '1000000000000000000',
      [ATTACK_TYPES.FAKE_TRUST_CLAIM]: '1000000000000000000'
    };

    const results = [];

    for (let i = 0; i < sequenceTypes.length; i++) {
      const attackType = sequenceTypes[i];
      const attackPayload = generateAttack(attackType, { conversationId });

      const eventId = `0x${(Date.now() + i).toString(16).padStart(64, '0')}`;
      const event = {
        id: eventId,
        sender: attackPayload.sender || 'bad_agent',
        content: attackPayload.message,
        counterparty: defaultCounterparties[attackType],
        amountWei: defaultAmounts[attackType]
      };

      let defenseResult;
      try {
        defenseResult = await runtime.processTurn(event);
      } catch (err) {
        defenseResult = {
          turnId: eventId,
          attemptId: null,
          decision: 'BLOCKED',
          replyText: `Defense evaluation failed: ${err.message}`,
          charterReasonCode: 0,
          reasoningHash: null,
          receiptId: null,
          txHash: null,
          error: {
            code: err.code || 'DEFENSE_ERROR',
            message: err.message
          }
        };
      }

      results.push({
        attackType,
        attack: attackPayload,
        defense: defenseResult
      });
    }

    return sendSuccess(res, {
      conversationId,
      attacks: results
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
