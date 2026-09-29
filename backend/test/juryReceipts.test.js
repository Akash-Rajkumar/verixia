import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  generateJuryReceiptId,
  generateJuryReasoningHash,
  mapVoteToDecisionCode,
  recordJuryReceipts
} from "../src/jury/JuryReceipts.js";
import { runJury } from "../src/jury/JuryEngine.js";

describe("AI Jury ReasoningReceipts Integration (Checkpoint 1.5)", () => {

  it("1. generateJuryReceiptId produces deterministic keccak256 hash for caseId + persona", () => {
    const caseId = "CASE-2026-001";
    const persona = "skeptical";
    const receiptId1 = generateJuryReceiptId(caseId, persona);
    const receiptId2 = generateJuryReceiptId(caseId, persona);

    assert.equal(receiptId1, receiptId2);
    assert.equal(receiptId1, ethers.id(`${caseId}-${persona}`));
    assert.match(receiptId1, /^0x[0-9a-fA-F]{64}$/);
  });

  it("2. different personas produce different receipt IDs for the same caseId", () => {
    const caseId = "CASE-2026-001";
    const idSkeptical = generateJuryReceiptId(caseId, "skeptical");
    const idRiskAverse = generateJuryReceiptId(caseId, "risk-averse");
    const idPragmatic = generateJuryReceiptId(caseId, "pragmatic");

    assert.notEqual(idSkeptical, idRiskAverse);
    assert.notEqual(idRiskAverse, idPragmatic);
    assert.notEqual(idSkeptical, idPragmatic);
  });

  it("3. generateJuryReasoningHash uses canonical JSON keccak256 hashing", () => {
    const data = {
      caseId: "CASE-2026-001",
      caseType: "payment_approval",
      persona: "skeptical",
      vote: "approve",
      reasoning: "Valid transaction structure."
    };

    const hash1 = generateJuryReasoningHash(data);
    const hash2 = generateJuryReasoningHash(data);

    assert.equal(hash1, hash2);
    assert.match(hash1, /^0x[0-9a-fA-F]{64}$/);
  });

  it("4. mapVoteToDecisionCode correctly maps approve -> 0 and reject -> 1", () => {
    assert.equal(mapVoteToDecisionCode("approve"), 0);
    assert.equal(mapVoteToDecisionCode("APPROVE"), 0);
    assert.equal(mapVoteToDecisionCode("reject"), 1);
    assert.equal(mapVoteToDecisionCode("REJECT"), 1);

    assert.throws(() => mapVoteToDecisionCode("invalid"), /Invalid Jury vote for decision mapping/);
  });

  it("5. all three jurors produce valid receipt payloads and call adapter submitReceipt", async () => {
    const mockJuryResult = {
      verdict: "approve",
      status: "COMPLETED",
      votes: [
        { persona: "skeptical", vote: "approve", reasoning: "Passed." },
        { persona: "risk-averse", vote: "reject", reasoning: "High risk." },
        { persona: "pragmatic", vote: "approve", reasoning: "Good counterparty." }
      ]
    };

    const submitted = [];
    const mockAdapter = {
      async submitReceipt(params) {
        submitted.push(params);
        return {
          receiptId: params.receiptId,
          txHash: `0xtx_${params.receiptId.substring(2, 10)}`
        };
      }
    };

    const recordResult = await recordJuryReceipts(
      mockJuryResult,
      "CASE-100",
      "payment_approval",
      { recipient: "0x5D7C03A79570014e8cf335DCdBc9Fb87284Fdf4B", amount: "100" },
      { receiptsAdapter: mockAdapter }
    );

    assert.equal(recordResult.receiptsStatus, "ALL_RECORDED");
    assert.equal(submitted.length, 3);
    assert.equal(recordResult.receipts.length, 3);

    assert.equal(submitted[0].decisionCode, 0); // approve -> 0
    assert.equal(submitted[1].decisionCode, 1); // reject -> 1
    assert.equal(submitted[2].decisionCode, 0); // approve -> 0

    assert.ok(recordResult.receipts[0].txHash.startsWith("0xtx_"));
  });

  it("6. receipt recording failure returns status FAILED without fabricating txHash or status", async () => {
    const mockJuryResult = {
      verdict: "approve",
      status: "COMPLETED",
      votes: [
        { persona: "skeptical", vote: "approve", reasoning: "Passed." },
        { persona: "risk-averse", vote: "approve", reasoning: "Passed." },
        { persona: "pragmatic", vote: "approve", reasoning: "Passed." }
      ]
    };

    const mockAdapter = {
      async submitReceipt() {
        throw new Error("RPC provider connection timeout");
      }
    };

    const recordResult = await recordJuryReceipts(
      mockJuryResult,
      "CASE-FAIL",
      "payment_approval",
      {},
      { receiptsAdapter: mockAdapter }
    );

    assert.equal(recordResult.receiptsStatus, "ALL_FAILED");
    assert.equal(recordResult.receipts.length, 3);
    for (const r of recordResult.receipts) {
      assert.equal(r.status, "FAILED");
      assert.equal(r.txHash, null);
      assert.ok(r.error.includes("RPC provider connection timeout"));
    }
  });

  it("7. partial receipt failure is properly identified as PARTIAL_FAILED", async () => {
    const mockJuryResult = {
      verdict: "approve",
      status: "COMPLETED",
      votes: [
        { persona: "skeptical", vote: "approve", reasoning: "Passed." },
        { persona: "risk-averse", vote: "approve", reasoning: "Passed." },
        { persona: "pragmatic", vote: "approve", reasoning: "Passed." }
      ]
    };

    let callCount = 0;
    const mockAdapter = {
      async submitReceipt(params) {
        callCount++;
        if (callCount === 2) {
          throw new Error("Nonce too low");
        }
        return { receiptId: params.receiptId, txHash: "0xoktx" };
      }
    };

    const recordResult = await recordJuryReceipts(
      mockJuryResult,
      "CASE-PARTIAL",
      "payment_approval",
      {},
      { receiptsAdapter: mockAdapter }
    );

    assert.equal(recordResult.receiptsStatus, "PARTIAL_FAILED");
    assert.equal(recordResult.receipts[0].status, "RECORDED");
    assert.equal(recordResult.receipts[1].status, "FAILED");
    assert.equal(recordResult.receipts[1].txHash, null);
    assert.equal(recordResult.receipts[2].status, "RECORDED");
  });
});
