import { ethers } from "ethers";
import { createRequire } from "node:module";
import { ReasoningReceiptsAdapter } from "../agent/adapters/ReasoningReceiptsAdapter.js";

const require = createRequire(import.meta.url);
const { hashCanonical } = require("../../../shared/canonicalJson.js");

export const DEFAULT_GOOD_AGENT_ADDRESS = "0x5D7C03A79570014e8cf335DCdBc9Fb87284Fdf4B";

export function generateJuryReceiptId(caseId, personaName) {
  if (typeof caseId !== "string" || !caseId.trim()) {
    throw new TypeError("caseId must be a non-empty string");
  }
  if (typeof personaName !== "string" || !personaName.trim()) {
    throw new TypeError("personaName must be a non-empty string");
  }
  const seed = `${caseId.trim()}-${personaName.trim()}`;
  return ethers.id(seed);
}

export function generateJuryReasoningHash({ caseId, caseType, persona, vote, reasoning }) {
  const structuredData = {
    caseId: String(caseId).trim(),
    caseType: String(caseType).trim(),
    juror: String(persona).trim(),
    reasoning: String(reasoning).trim(),
    vote: String(vote).trim().toLowerCase()
  };
  return hashCanonical(structuredData);
}

export function mapVoteToDecisionCode(vote) {
  const normalized = typeof vote === "string" ? vote.trim().toLowerCase() : "";
  if (normalized === "approve") {
    return 0;
  }
  if (normalized === "reject") {
    return 1;
  }
  throw new TypeError(`Invalid Jury vote for decision mapping: '${vote}'. Must be 'approve' or 'reject'.`);
}

export async function recordJuryReceipts(juryResult, caseId, caseType, payload = {}, options = {}) {
  if (!juryResult || juryResult.status !== "COMPLETED" || !Array.isArray(juryResult.votes)) {
    return {
      receiptsStatus: "SKIPPED",
      reason: "Jury deliberation did not complete successfully with valid votes",
      receipts: []
    };
  }

  const agentAddress = options.agentAddress || process.env.GOOD_AGENT_ADDRESS || DEFAULT_GOOD_AGENT_ADDRESS;
  
  let counterparty = ethers.ZeroAddress;
  if (payload.counterparty && ethers.isAddress(payload.counterparty)) {
    counterparty = payload.counterparty;
  } else if (payload.recipient && ethers.isAddress(payload.recipient)) {
    counterparty = payload.recipient;
  } else if (payload.to && ethers.isAddress(payload.to)) {
    counterparty = payload.to;
  }

  let amountWei = 0n;
  if (payload.amountWei !== undefined && payload.amountWei !== null) {
    amountWei = payload.amountWei;
  } else if (typeof payload.amount === "string" && /^\d+$/.test(payload.amount)) {
    amountWei = BigInt(payload.amount);
  }

  const adapter = options.receiptsAdapter || new ReasoningReceiptsAdapter(options.adapterConfig || {});

  const receipts = [];
  let successCount = 0;
  let failCount = 0;

  for (const voteItem of juryResult.votes) {
    const receiptId = generateJuryReceiptId(caseId, voteItem.persona);
    const reasoningHash = generateJuryReasoningHash({
      caseId,
      caseType,
      persona: voteItem.persona,
      vote: voteItem.vote,
      reasoning: voteItem.reasoning
    });
    const decisionCode = mapVoteToDecisionCode(voteItem.vote);
    const summary = `Jury [${voteItem.persona}]: ${voteItem.vote.toUpperCase()} for ${caseType} (${caseId})`;

    try {
      const submission = await adapter.submitReceipt({
        receiptId,
        agent: agentAddress,
        counterparty,
        amountWei,
        decisionCode,
        reasoningHash,
        summary
      });

      successCount++;
      receipts.push({
        persona: voteItem.persona,
        receiptId,
        reasoningHash,
        decisionCode,
        status: "RECORDED",
        txHash: submission.txHash
      });
    } catch (err) {
      failCount++;
      receipts.push({
        persona: voteItem.persona,
        receiptId,
        reasoningHash,
        decisionCode,
        status: "FAILED",
        error: err.message || "Receipt submission failed",
        txHash: null
      });
    }
  }

  let receiptsStatus = "ALL_RECORDED";
  if (failCount > 0 && successCount > 0) {
    receiptsStatus = "PARTIAL_FAILED";
  } else if (failCount > 0 && successCount === 0) {
    receiptsStatus = "ALL_FAILED";
  }

  return {
    receiptsStatus,
    receipts
  };
}
