const { ValidationError, ModelUnavailableError, ChainError } = require("./errors");
const { parseModelDecision, mapCharterResult, deriveFinalDecision } = require("./decisionLogic");
const { buildGoodAgentPrompt } = require("./promptBuilder");
const { hashCanonical } = require("../../../shared/canonicalJson");

async function processTurn(event, adapters = {}) {
  if (!event || typeof event !== "object") {
    throw new ValidationError("Event is required and must be an object");
  }
  if (!event.id || typeof event.id !== "string") {
    throw new ValidationError("Event must contain a valid string 'id'");
  }
  if (!event.sender || typeof event.sender !== "string") {
    throw new ValidationError("Event must contain a valid string 'sender'");
  }
  if (!event.content || typeof event.content !== "string") {
    throw new ValidationError("Event must contain a valid string 'content'");
  }
  if (!adapters || !adapters.model || typeof adapters.model.generate !== "function") {
    throw new ValidationError("Adapters must include a valid 'model' adapter with generate()");
  }

  // 1. Store incoming event
  if (adapters.eventStore && typeof adapters.eventStore.storeIncomingEvent === "function") {
    await adapters.eventStore.storeIncomingEvent(event);
  }

  // 2. Optionally fetch reputation
  let reputationScores = null;
  if (event.counterparty && adapters.reputation && typeof adapters.reputation.getReputation === "function") {
    try {
      reputationScores = await adapters.reputation.getReputation(event.counterparty);
    } catch (_) {
      reputationScores = null;
    }
  }

  // 3. Build model prompt
  const prompt = buildGoodAgentPrompt({
    content: event.content,
    counterparty: event.counterparty,
    amountWei: event.amountWei,
    reputationScores,
    contextHistory: event.contextHistory
  });

  // 4. Call model client
  let modelOutput;
  try {
    modelOutput = await adapters.model.generate({ prompt });
  } catch (modelErr) {
    const turnId = event.id;
    const result = {
      turnId,
      attemptId: null,
      decision: "BLOCKED",
      replyText: "Model unavailable. Operation blocked for safety.",
      charterReasonCode: 0,
      reasoningHash: null,
      receiptId: null,
      txHash: null,
      error: {
        code: modelErr.code || "MODEL_UNAVAILABLE",
        message: modelErr.message
      }
    };
    if (adapters.eventStore && typeof adapters.eventStore.storeReply === "function") {
      await adapters.eventStore.storeReply(turnId, result);
    }
    return result;
  }

  // 5. Parse model decision
  const parsedModel = parseModelDecision(modelOutput.text);

  // 6. Handle DECLINED_BY_AGENT
  if (parsedModel.decision === "DECLINED_BY_AGENT") {
    let attemptId = null;
    if (adapters.attemptStore && typeof adapters.attemptStore.createAttempt === "function") {
      const attemptRes = await adapters.attemptStore.createAttempt({
        agent: event.sender,
        counterparty: event.counterparty,
        amountWei: event.amountWei ? String(event.amountWei) : undefined,
        status: "declined"
      });
      attemptId = attemptRes && attemptRes.attemptId ? attemptRes.attemptId : null;
    }

    const reasoning_full = {
      version: "1.0",
      agentId: event.sender,
      attemptId: attemptId || event.id,
      timestamp: Date.now(),
      intent: event.content,
      counterparty: event.counterparty || null,
      amountWei: event.amountWei ? String(event.amountWei) : null,
      charterCheck: { allowed: true, reasonCode: 0 },
      reputationContext: reputationScores,
      modelEvaluation: {
        provider: modelOutput.provider,
        model: modelOutput.model,
        fallbackUsed: modelOutput.fallbackUsed,
        rawText: modelOutput.text
      },
      decision: "DECLINED_BY_AGENT"
    };

    const reasoningHash = hashCanonical(reasoning_full);

    let receiptRes = null;
    if (adapters.receipt && typeof adapters.receipt.submitReceipt === "function") {
      receiptRes = await adapters.receipt.submitReceipt({
        receiptId: attemptId || event.id,
        agent: event.sender,
        counterparty: event.counterparty,
        amountWei: event.amountWei ? String(event.amountWei) : undefined,
        decisionCode: 2, // DECLINED_BY_AGENT
        reasoningHash,
        summary: parsedModel.summary
      });
    }

    const result = {
      turnId: event.id,
      attemptId,
      decision: "DECLINED_BY_AGENT",
      replyText: parsedModel.summary || "Declined by agent.",
      charterReasonCode: 0,
      reasoningHash,
      receiptId: receiptRes && receiptRes.receiptId ? receiptRes.receiptId : null,
      txHash: receiptRes && receiptRes.txHash ? receiptRes.txHash : null,
      error: null
    };

    if (adapters.eventStore && typeof adapters.eventStore.storeReply === "function") {
      await adapters.eventStore.storeReply(event.id, result);
    }

    return result;
  }

  // 7. Handle PAYMENT_INTENT
  if (!event.counterparty || event.amountWei === undefined || event.amountWei === null) {
    throw new ValidationError("Payment intent requires 'counterparty' and 'amountWei' fields");
  }

  const amountWeiStr = String(event.amountWei);

  let charterRes = { allowed: true, reasonCode: 0 };
  if (adapters.charter && typeof adapters.charter.checkPayment === "function") {
    charterRes = await adapters.charter.checkPayment(event.counterparty, amountWeiStr);
  }

  const charterDecision = mapCharterResult(charterRes);

  // 8. If charter blocks
  if (charterDecision === "BLOCKED") {
    let attemptId = null;
    if (adapters.attemptStore && typeof adapters.attemptStore.createAttempt === "function") {
      const attemptRes = await adapters.attemptStore.createAttempt({
        agent: event.sender,
        counterparty: event.counterparty,
        amountWei: amountWeiStr,
        status: "blocked"
      });
      attemptId = attemptRes && attemptRes.attemptId ? attemptRes.attemptId : null;
    }

    const reasoning_full = {
      version: "1.0",
      agentId: event.sender,
      attemptId: attemptId || event.id,
      timestamp: Date.now(),
      intent: event.content,
      counterparty: event.counterparty,
      amountWei: amountWeiStr,
      charterCheck: charterRes,
      reputationContext: reputationScores,
      modelEvaluation: {
        provider: modelOutput.provider,
        model: modelOutput.model,
        fallbackUsed: modelOutput.fallbackUsed,
        rawText: modelOutput.text
      },
      decision: "BLOCKED"
    };

    const reasoningHash = hashCanonical(reasoning_full);

    let receiptRes = null;
    if (adapters.receipt && typeof adapters.receipt.submitReceipt === "function") {
      receiptRes = await adapters.receipt.submitReceipt({
        receiptId: attemptId || event.id,
        agent: event.sender,
        counterparty: event.counterparty,
        amountWei: amountWeiStr,
        decisionCode: 0, // BLOCKED
        reasoningHash,
        summary: `Blocked by Spending Charter (reason code ${charterRes.reasonCode})`
      });
    }

    const result = {
      turnId: event.id,
      attemptId,
      decision: "BLOCKED",
      replyText: `Payment blocked by Spending Charter (reason code ${charterRes.reasonCode}).`,
      charterReasonCode: charterRes.reasonCode,
      reasoningHash,
      receiptId: receiptRes && receiptRes.receiptId ? receiptRes.receiptId : null,
      txHash: receiptRes && receiptRes.txHash ? receiptRes.txHash : null,
      error: null
    };

    if (adapters.eventStore && typeof adapters.eventStore.storeReply === "function") {
      await adapters.eventStore.storeReply(event.id, result);
    }

    return result;
  }

  // 9. Charter allows -> create transaction attempt
  let attemptId = null;
  if (adapters.attemptStore && typeof adapters.attemptStore.createAttempt === "function") {
    const attemptRes = await adapters.attemptStore.createAttempt({
      agent: event.sender,
      counterparty: event.counterparty,
      amountWei: amountWeiStr,
      status: "proposed"
    });
    attemptId = attemptRes && attemptRes.attemptId ? attemptRes.attemptId : null;
  }

  // 10. Call attemptPayment
  let paymentRes = { executed: false, reasonCode: 0 };
  let chainErr = null;
  if (adapters.charter && typeof adapters.charter.attemptPayment === "function") {
    try {
      paymentRes = await adapters.charter.attemptPayment(event.counterparty, amountWeiStr, attemptId || event.id);
    } catch (err) {
      chainErr = err;
      paymentRes = { executed: false, reasonCode: 0 };
    }
  }

  // 11 & 12. Evaluate final decision
  const finalDecision = deriveFinalDecision({
    modelDecision: "PAYMENT_INTENT",
    charterDecision: "ALLOWED",
    paymentResult: paymentRes
  });

  const isExecuted = finalDecision === "EXECUTED";

  if (adapters.attemptStore && typeof adapters.attemptStore.updateAttemptStatus === "function" && attemptId) {
    await adapters.attemptStore.updateAttemptStatus(attemptId, {
      status: isExecuted ? "executed" : "failed",
      txHash: paymentRes.txHash,
      reasonCode: paymentRes.reasonCode
    });
  }

  const reasoning_full = {
    version: "1.0",
    agentId: event.sender,
    attemptId: attemptId || event.id,
    timestamp: Date.now(),
    intent: event.content,
    counterparty: event.counterparty,
    amountWei: amountWeiStr,
    charterCheck: charterRes,
    reputationContext: reputationScores,
    modelEvaluation: {
      provider: modelOutput.provider,
      model: modelOutput.model,
      fallbackUsed: modelOutput.fallbackUsed,
      rawText: modelOutput.text
    },
    decision: finalDecision
  };

  const reasoningHash = hashCanonical(reasoning_full);

  let receiptRes = null;
  if (adapters.receipt && typeof adapters.receipt.submitReceipt === "function") {
    receiptRes = await adapters.receipt.submitReceipt({
      receiptId: attemptId || event.id,
      agent: event.sender,
      counterparty: event.counterparty,
      amountWei: amountWeiStr,
      decisionCode: isExecuted ? 1 : 0,
      reasoningHash,
      summary: isExecuted ? "Payment executed successfully." : "Payment execution failed."
    });
  }

  const result = {
    turnId: event.id,
    attemptId,
    decision: finalDecision,
    replyText: isExecuted
      ? "Payment executed successfully."
      : (chainErr ? `Payment execution failed: ${chainErr.message}` : "Payment execution failed."),
    charterReasonCode: paymentRes.reasonCode || 0,
    reasoningHash,
    receiptId: receiptRes && receiptRes.receiptId ? receiptRes.receiptId : null,
    txHash: paymentRes.txHash || (receiptRes && receiptRes.txHash ? receiptRes.txHash : null),
    error: isExecuted
      ? null
      : { code: "CHAIN_ERROR", message: chainErr ? chainErr.message : "Payment execution failed" }
  };

  if (adapters.eventStore && typeof adapters.eventStore.storeReply === "function") {
    await adapters.eventStore.storeReply(event.id, result);
  }

  return result;
}

module.exports = {
  processTurn
};
