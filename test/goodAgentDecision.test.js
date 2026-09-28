const { expect } = require("chai");
const { parseModelDecision, mapCharterResult, deriveFinalDecision } = require("../backend/src/agent/decisionLogic");
const { buildGoodAgentPrompt } = require("../backend/src/agent/promptBuilder");
const { ModelParseError, ValidationError, ChainError } = require("../backend/src/agent/errors");

describe("Good Agent Pure Decision Logic & Prompt Builder", function () {
  describe("parseModelDecision", function () {
    it("parses valid DECLINE decision and maps to DECLINED_BY_AGENT", function () {
      const modelText = JSON.stringify({
        decision: "DECLINE",
        summary: "Prompt injection detected"
      });
      const result = parseModelDecision(modelText);
      expect(result.decision).to.equal("DECLINED_BY_AGENT");
      expect(result.summary).to.equal("Prompt injection detected");
    });

    it("parses valid PAYMENT_INTENT decision and maps to PAYMENT_INTENT", function () {
      const modelText = JSON.stringify({
        decision: "PAYMENT_INTENT",
        summary: "Valid payment request"
      });
      const result = parseModelDecision(modelText);
      expect(result.decision).to.equal("PAYMENT_INTENT");
      expect(result.summary).to.equal("Valid payment request");
    });

    it("throws ModelParseError when text is not JSON", function () {
      expect(() => parseModelDecision("Not JSON text")).to.throw(ModelParseError);
    });

    it("throws ModelParseError for unsupported decision values like APPROVE/REJECT/FLAG", function () {
      const modelText = JSON.stringify({ decision: "APPROVE" });
      expect(() => parseModelDecision(modelText)).to.throw(ModelParseError, /Unsupported model decision/);
    });
  });

  describe("mapCharterResult", function () {
    it("returns BLOCKED when charter allowed is false", function () {
      expect(mapCharterResult({ allowed: false, reasonCode: 1 })).to.equal("BLOCKED");
    });

    it("returns ALLOWED when charter allowed is true", function () {
      expect(mapCharterResult({ allowed: true, reasonCode: 0 })).to.equal("ALLOWED");
    });
  });

  describe("deriveFinalDecision", function () {
    it("returns BLOCKED if charter decision is BLOCKED", function () {
      const decision = deriveFinalDecision({
        modelDecision: "PAYMENT_INTENT",
        charterDecision: "BLOCKED",
        paymentResult: { executed: true }
      });
      expect(decision).to.equal("BLOCKED");
    });

    it("returns DECLINED_BY_AGENT if model decision is DECLINED_BY_AGENT", function () {
      const decision = deriveFinalDecision({
        modelDecision: "DECLINED_BY_AGENT",
        charterDecision: "ALLOWED",
        paymentResult: null
      });
      expect(decision).to.equal("DECLINED_BY_AGENT");
    });

    it("returns EXECUTED only when payment succeeds", function () {
      const decision = deriveFinalDecision({
        modelDecision: "PAYMENT_INTENT",
        charterDecision: "ALLOWED",
        paymentResult: { executed: true, reasonCode: 0 }
      });
      expect(decision).to.equal("EXECUTED");
    });

    it("does NOT return EXECUTED if payment fails", function () {
      const decision = deriveFinalDecision({
        modelDecision: "PAYMENT_INTENT",
        charterDecision: "ALLOWED",
        paymentResult: { executed: false, reasonCode: 6 }
      });
      expect(decision).to.equal("BLOCKED");
    });
  });

  describe("buildGoodAgentPrompt", function () {
    it("builds deterministic prompt containing input content and structured context", function () {
      const prompt = buildGoodAgentPrompt({
        content: "Transfer 100 Wei to Alice",
        counterparty: "0x1234567890123456789012345678901234567890",
        amountWei: "100",
        reputationScores: { competence: 80, honesty: 90, compliance: 95, reliability: 85 }
      });

      expect(prompt).to.include('Content: "Transfer 100 Wei to Alice"');
      expect(prompt).to.include("0x1234567890123456789012345678901234567890");
      expect(prompt).to.include("Amount (Wei): 100");
      expect(prompt).to.include("Competence: 80, Honesty: 90, Compliance: 95, Reliability: 85");
      expect(prompt).to.include('"DECLINE" | "PAYMENT_INTENT"');
    });
  });
});
