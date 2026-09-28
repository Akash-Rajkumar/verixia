const { ethers } = require("ethers");
const { M2Error, ValidationError, ChainError } = require("../errors");

const MAX_UINT256 = 2n ** 256n - 1n;
const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

function normalizeReceiptId(receiptId) {
  if (typeof receiptId !== "string" || !receiptId.trim()) {
    throw new ValidationError("receiptId must be a non-empty string");
  }
  return ethers.id(receiptId.trim());
}

function validateAddress(address, paramName = "address") {
  if (typeof address !== "string" || !address.trim() || !ethers.isAddress(address.trim())) {
    throw new ValidationError(`Invalid Ethereum address for ${paramName}: '${address}'`);
  }
  return address.trim();
}

function validateAmountWei(amountWei) {
  if (amountWei === undefined || amountWei === null) {
    return 0n;
  }
  if (typeof amountWei === "number") {
    throw new ValidationError("JavaScript numbers are rejected for amountWei to prevent precision loss. Use a decimal string or BigInt.");
  }
  if (typeof amountWei === "bigint") {
    if (amountWei < 0n) {
      throw new ValidationError("amountWei cannot be negative");
    }
    if (amountWei > MAX_UINT256) {
      throw new ValidationError("amountWei exceeds uint256 maximum value");
    }
    return amountWei;
  }
  if (typeof amountWei === "string") {
    const trimmed = amountWei.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      throw new ValidationError(`Invalid amountWei string: '${amountWei}'. Must contain only decimal digits.`);
    }
    const val = BigInt(trimmed);
    if (val > MAX_UINT256) {
      throw new ValidationError("amountWei exceeds uint256 maximum value");
    }
    return val;
  }
  throw new ValidationError("amountWei must be a decimal string or BigInt");
}

function validateDecisionCode(decisionCode) {
  if (typeof decisionCode !== "number" || !Number.isInteger(decisionCode) || decisionCode < 0 || decisionCode > 2) {
    throw new ValidationError(`Invalid decisionCode: '${decisionCode}'. Must be 0, 1, or 2.`);
  }
  return decisionCode;
}

function validateReasoningHash(reasoningHash) {
  if (typeof reasoningHash !== "string") {
    throw new ValidationError("reasoningHash must be a string");
  }
  const trimmed = reasoningHash.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new ValidationError(`Invalid bytes32 reasoningHash: '${reasoningHash}'. Must be a 0x-prefixed 64-character hexadecimal string.`);
  }
  if (trimmed.toLowerCase() === ZERO_BYTES32) {
    throw new ValidationError("reasoningHash cannot be non-zero bytes32(0)");
  }
  return trimmed;
}

function validateSummary(summary) {
  if (summary === undefined || summary === null) {
    return "";
  }
  if (typeof summary !== "string") {
    throw new ValidationError("summary must be a string");
  }
  return summary;
}

class ReasoningReceiptsAdapter {
  constructor(config = {}, options = {}) {
    const abi = options.abi || config.abi || require("../../../../shared/abi/ReasoningReceipts.json");
    const contractAddress = config.contractAddress || process.env.REASONING_RECEIPTS_ADDRESS;
    const rpcUrl = config.rpcUrl || process.env.RPC_URL;
    const privateKey = config.privateKey || process.env.RECORDER_PRIVATE_KEY || process.env.AGENT_PRIVATE_KEY;

    if (options.contract) {
      this.contract = options.contract;
    } else {
      const provider = options.provider || (rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : null);
      const signer = options.signer || (privateKey && provider ? new ethers.Wallet(privateKey, provider) : null);
      const runner = signer || provider;

      if (contractAddress && runner) {
        this.contract = new ethers.Contract(contractAddress, abi, runner);
      } else {
        this.contract = null;
      }
    }
  }

  _getContract() {
    if (!this.contract) {
      throw new ChainError("ReasoningReceipts contract instance is not configured");
    }
    return this.contract;
  }

  async submitReceipt({
    receiptId,
    agent,
    counterparty,
    amountWei,
    decisionCode,
    reasoningHash,
    summary
  }) {
    const bytes32ReceiptId = normalizeReceiptId(receiptId);
    const validAgent = validateAddress(agent, "agent");
    const validCounterparty = (counterparty !== undefined && counterparty !== null && counterparty !== "")
      ? validateAddress(counterparty, "counterparty")
      : ethers.ZeroAddress;
    const validAmountWei = validateAmountWei(amountWei);
    const validDecision = validateDecisionCode(decisionCode);
    const validReasoningHash = validateReasoningHash(reasoningHash);
    const validSummary = validateSummary(summary);

    const contract = this._getContract();

    if (!contract.runner || typeof contract.runner.sendTransaction !== "function") {
      throw new ChainError("Recorder signer is required to submit receipt");
    }

    let tx;
    try {
      tx = await contract.recordReceipt(
        bytes32ReceiptId,
        validAgent,
        validCounterparty,
        validAmountWei,
        validDecision,
        validReasoningHash,
        validSummary
      );
    } catch (err) {
      this._handleRevertError(err);
    }

    let receipt;
    try {
      receipt = await tx.wait(1);
    } catch (err) {
      throw new ChainError(`Transaction receipt confirmation failed: ${err.message}`, { cause: err });
    }

    if (!receipt || receipt.status !== 1) {
      throw new ChainError(`Transaction ${tx.hash} failed on-chain`);
    }

    return {
      receiptId,
      txHash: tx.hash
    };
  }

  async getReceipt(receiptId) {
    const bytes32ReceiptId = typeof receiptId === "string" && /^0x[0-9a-fA-F]{64}$/.test(receiptId.trim())
      ? receiptId.trim()
      : normalizeReceiptId(receiptId);

    const contract = this._getContract();

    try {
      const receipt = await contract.getReceipt(bytes32ReceiptId);
      return {
        receiptId: receipt.receiptId,
        agent: receipt.agent,
        counterparty: receipt.counterparty,
        amount: receipt.amount.toString(),
        decision: Number(receipt.decision),
        reasoningHash: receipt.reasoningHash,
        summary: receipt.summary,
        exists: Boolean(receipt.exists)
      };
    } catch (err) {
      this._handleRevertError(err);
    }
  }

  async getReceiptHash(receiptId) {
    const bytes32ReceiptId = typeof receiptId === "string" && /^0x[0-9a-fA-F]{64}$/.test(receiptId.trim())
      ? receiptId.trim()
      : normalizeReceiptId(receiptId);

    const contract = this._getContract();

    try {
      return await contract.getReceiptHash(bytes32ReceiptId);
    } catch (err) {
      this._handleRevertError(err);
    }
  }

  _handleRevertError(err) {
    if (err instanceof M2Error) {
      throw err;
    }

    const errMsg = err && err.message ? err.message : String(err);

    if (errMsg.includes("OnlyRecorder")) {
      throw new ChainError("Contract reverted: Caller is not an authorized recorder", {
        details: { contractError: "OnlyRecorder" },
        cause: err
      });
    }

    if (errMsg.includes("DuplicateReceiptId")) {
      throw new ChainError("Contract reverted: Duplicate receipt ID", {
        details: { contractError: "DuplicateReceiptId" },
        cause: err
      });
    }

    if (errMsg.includes("InvalidReceiptId")) {
      throw new ChainError("Contract reverted: Invalid receipt ID", {
        details: { contractError: "InvalidReceiptId" },
        cause: err
      });
    }

    if (errMsg.includes("InvalidReasoningHash")) {
      throw new ChainError("Contract reverted: Invalid reasoning hash", {
        details: { contractError: "InvalidReasoningHash" },
        cause: err
      });
    }

    if (errMsg.includes("InvalidDecisionCode")) {
      throw new ChainError("Contract reverted: Invalid decision code", {
        details: { contractError: "InvalidDecisionCode" },
        cause: err
      });
    }

    if (errMsg.includes("InvalidAddress")) {
      throw new ChainError("Contract reverted: Invalid address", {
        details: { contractError: "InvalidAddress" },
        cause: err
      });
    }

    if (errMsg.includes("ReceiptNotFound")) {
      throw new ChainError("Contract reverted: Receipt not found", {
        details: { contractError: "ReceiptNotFound" },
        cause: err
      });
    }

    throw new ChainError(`ReasoningReceipts contract execution error: ${errMsg}`, { cause: err });
  }
}

function createReasoningReceiptsAdapter(config = {}, options = {}) {
  return new ReasoningReceiptsAdapter(config, options);
}

module.exports = {
  ReasoningReceiptsAdapter,
  createReasoningReceiptsAdapter,
  normalizeReceiptId
};
