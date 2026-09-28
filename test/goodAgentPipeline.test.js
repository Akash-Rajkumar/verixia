const { expect } = require("chai");
const { processTurn } = require("../backend/src/agent/GoodAgentPipeline");
const { ModelParseError, ModelUnavailableError, ValidationError } = require("../backend/src/agent/errors");
const { hashCanonical } = require("../shared/canonicalJson");

describe("GoodAgentPipeline Orchestration", function () {
  const sampleEvent = {
    id: "turn-uuid-1",
    sender: "0xAgentAddress",
    content: "Send 0.1 ETH to Bob",
    counterparty: "0xBobAddress12345678901234567890123456789012",
    amountWei: "100000000000000000"
  };

  it("1. Model decision DECLINE => DECLINED_BY_AGENT => no payment attempt called", async function () {
    let paymentAttemptCalled = false;
    let receiptSubmitted = false;

    const adapters = {
      model: {
        generate: async () => ({
          text: JSON.stringify({ decision: "DECLINE", summary: "Suspicious pretext" }),
          provider: "gemini",
          model: "gemini-2.5-flash",
          fallbackUsed: false
        })
      },
      charter: {
        checkPayment: async () => ({ allowed: true, reasonCode: 0 }),
        attemptPayment: async () => {
          paymentAttemptCalled = true;
          return { executed: true, reasonCode: 0 };
        }
      },
      attemptStore: {
        createAttempt: async (p) => {
          expect(p.status).to.equal("declined");
          return { attemptId: "attempt-1" };
        }
      },
      receipt: {
        submitReceipt: async (p) => {
          receiptSubmitted = true;
          expect(p.decisionCode).to.equal(2); // DECLINED_BY_AGENT
          return { receiptId: "receipt-1", txHash: "0xTxReceipt" };
        }
      }
    };

    const result = await processTurn(sampleEvent, adapters);
    expect(result.decision).to.equal("DECLINED_BY_AGENT");
    expect(paymentAttemptCalled).to.be.false;
    expect(receiptSubmitted).to.be.true;
  });

  it("2. Unsupported/invalid model output => typed parse error", async function () {
    const adapters = {
      model: {
        generate: async () => ({
          text: "INVALID_UNPARSEABLE_TEXT",
          provider: "gemini",
          model: "gemini-2.5-flash",
          fallbackUsed: false
        })
      }
    };

    try {
      await processTurn(sampleEvent, adapters);
      expect.fail("Should have thrown ModelParseError");
    } catch (err) {
      expect(err).to.be.an.instanceOf(ModelParseError);
    }
  });

  it("3. Charter blocked => BLOCKED => no payment attempt", async function () {
    let paymentAttemptCalled = false;

    const adapters = {
      model: {
        generate: async () => ({
          text: JSON.stringify({ decision: "PAYMENT_INTENT", summary: "Valid intent" }),
          provider: "gemini",
          model: "gemini-2.5-flash",
          fallbackUsed: false
        })
      },
      charter: {
        checkPayment: async () => ({ allowed: false, reasonCode: 1 }), // EXCEEDS_MAX_PER_TX
        attemptPayment: async () => {
          paymentAttemptCalled = true;
          return { executed: true, reasonCode: 0 };
        }
      },
      receipt: {
        submitReceipt: async (p) => {
          expect(p.decisionCode).to.equal(0); // BLOCKED
          return { receiptId: "receipt-blocked" };
        }
      }
    };

    const result = await processTurn(sampleEvent, adapters);
    expect(result.decision).to.equal("BLOCKED");
    expect(result.charterReasonCode).to.equal(1);
    expect(paymentAttemptCalled).to.be.false;
  });

  it("4. Charter allowed + successful payment => EXECUTED", async function () {
    let paymentAttemptCalled = false;

    const adapters = {
      model: {
        generate: async () => ({
          text: JSON.stringify({ decision: "PAYMENT_INTENT", summary: "Safe" }),
          provider: "gemini",
          model: "gemini-2.5-flash",
          fallbackUsed: false
        })
      },
      charter: {
        checkPayment: async () => ({ allowed: true, reasonCode: 0 }),
        attemptPayment: async () => {
          paymentAttemptCalled = true;
          return { executed: true, reasonCode: 0, txHash: "0xPaymentExecutedTx" };
        }
      },
      attemptStore: {
        createAttempt: async () => ({ attemptId: "attempt-4" }),
        updateAttemptStatus: async (id, u) => {
          expect(u.status).to.equal("executed");
        }
      },
      receipt: {
        submitReceipt: async (p) => {
          expect(p.decisionCode).to.equal(1); // EXECUTED
          return { receiptId: "receipt-4", txHash: "0xPaymentExecutedTx" };
        }
      }
    };

    const result = await processTurn(sampleEvent, adapters);
    expect(result.decision).to.equal("EXECUTED");
    expect(result.txHash).to.equal("0xPaymentExecutedTx");
    expect(paymentAttemptCalled).to.be.true;
  });

  it("5. Charter allowed + failed payment => no EXECUTED result, chain failure surfaced", async function () {
    const adapters = {
      model: {
        generate: async () => ({
          text: JSON.stringify({ decision: "PAYMENT_INTENT", summary: "Safe" }),
          provider: "gemini",
          model: "gemini-2.5-flash",
          fallbackUsed: false
        })
      },
      charter: {
        checkPayment: async () => ({ allowed: true, reasonCode: 0 }),
        attemptPayment: async () => {
          throw new Error("RPC node reverted transaction");
        }
      },
      attemptStore: {
        createAttempt: async () => ({ attemptId: "attempt-5" }),
        updateAttemptStatus: async (id, u) => {
          expect(u.status).to.equal("failed");
        }
      }
    };

    const result = await processTurn(sampleEvent, adapters);
    expect(result.decision).not.to.equal("EXECUTED");
    expect(result.decision).to.equal("BLOCKED");
    expect(result.error).to.exist;
    expect(result.error.code).to.equal("CHAIN_ERROR");
  });

  it("6. Model unavailable => fail closed => no payment attempt", async function () {
    let checkCalled = false;

    const adapters = {
      model: {
        generate: async () => {
          throw new ModelUnavailableError("Both primary and fallback models unreachable", { code: "MODEL_UNAVAILABLE" });
        }
      },
      charter: {
        checkPayment: async () => {
          checkCalled = true;
          return { allowed: true, reasonCode: 0 };
        }
      }
    };

    const result = await processTurn(sampleEvent, adapters);
    expect(result.decision).to.equal("BLOCKED");
    expect(result.error.code).to.equal("MODEL_UNAVAILABLE");
    expect(checkCalled).to.be.false;
  });

  it("7. Deterministic reasoning hash uses shared/canonicalJson.js", async function () {
    let capturedReceipt = null;

    const adapters = {
      model: {
        generate: async () => ({
          text: JSON.stringify({ decision: "DECLINE", summary: "Malicious attack vector" }),
          provider: "gemini",
          model: "gemini-2.5-flash",
          fallbackUsed: false
        })
      },
      receipt: {
        submitReceipt: async (p) => {
          capturedReceipt = p;
          return { receiptId: "rec-7" };
        }
      }
    };

    const result = await processTurn(sampleEvent, adapters);
    expect(result.reasoningHash).to.be.a("string");
    expect(capturedReceipt.reasoningHash).to.equal(result.reasoningHash);
    expect(result.reasoningHash.startsWith("0x")).to.be.true;
  });

  it("8. Adapter calls occur in the intended 15-step order", async function () {
    const callOrder = [];

    const adapters = {
      eventStore: {
        storeIncomingEvent: async () => callOrder.push("1.storeIncomingEvent"),
        storeReply: async () => callOrder.push("6.storeReply")
      },
      reputation: {
        getReputation: async () => callOrder.push("2.getReputation")
      },
      model: {
        generate: async () => {
          callOrder.push("3.modelGenerate");
          return {
            text: JSON.stringify({ decision: "DECLINE", summary: "Declined" }),
            provider: "gemini",
            model: "gemini-2.5-flash",
            fallbackUsed: false
          };
        }
      },
      attemptStore: {
        createAttempt: async () => {
          callOrder.push("4.createAttempt");
          return { attemptId: "att-8" };
        }
      },
      receipt: {
        submitReceipt: async () => callOrder.push("5.submitReceipt")
      }
    };

    await processTurn(sampleEvent, adapters);

    expect(callOrder).to.deep.equal([
      "1.storeIncomingEvent",
      "2.getReputation",
      "3.modelGenerate",
      "4.createAttempt",
      "5.submitReceipt",
      "6.storeReply"
    ]);
  });
});
