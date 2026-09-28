import { ethers } from "ethers";
import { ValidationError, ChainError } from "../errors.js";
import {
  checkCharterPayment as defaultCheckCharterPayment,
  attemptCharterPayment as defaultAttemptCharterPayment,
  getCharterRules as defaultGetCharterRules,
  getCharterStatus as defaultGetCharterStatus
} from "../../services/chain/index.js";

function validateAddress(address) {
  if (typeof address !== "string" || !address.trim() || !ethers.isAddress(address.trim())) {
    throw new ValidationError(`Invalid Ethereum address: '${address}'`);
  }
  return address.trim();
}

function validateAndConvertAmountWei(amountWei) {
  if (typeof amountWei === "number") {
    throw new ValidationError(
      "JavaScript numbers are rejected for amountWei to prevent precision loss. Use a decimal string or BigInt."
    );
  }
  let weiBigInt;
  if (typeof amountWei === "bigint") {
    if (amountWei < 0n) {
      throw new ValidationError("amountWei cannot be negative");
    }
    weiBigInt = amountWei;
  } else if (typeof amountWei === "string") {
    const trimmed = amountWei.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      throw new ValidationError(
        `Invalid amountWei string: '${amountWei}'. Must contain only decimal digits.`
      );
    }
    weiBigInt = BigInt(trimmed);
  } else {
    throw new ValidationError("amountWei must be a decimal string or BigInt");
  }

  return ethers.formatUnits(weiBigInt, 18);
}

function validateReceiptId(receiptId) {
  if (typeof receiptId !== "string" || !receiptId.trim()) {
    throw new ValidationError("receiptId must be a non-empty string");
  }
  const trimmed = receiptId.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new ValidationError(
      `Invalid bytes32 receiptId: '${receiptId}'. Must be a 0x-prefixed 64-character hexadecimal string.`
    );
  }
  return trimmed;
}

export class SpendingCharterAdapter {
  constructor(config = {}, options = {}) {
    this.config = config;
    this.options = options;
    const injected = options.chainService || {};
    this.chainService = {
      checkCharterPayment: injected.checkCharterPayment || defaultCheckCharterPayment,
      attemptCharterPayment: injected.attemptCharterPayment || defaultAttemptCharterPayment,
      getCharterRules: injected.getCharterRules || defaultGetCharterRules,
      getCharterStatus: injected.getCharterStatus || defaultGetCharterStatus
    };
  }

  async checkPayment(to, amountWei) {
    const validAddress = validateAddress(to);
    const amountStr = validateAndConvertAmountWei(amountWei);

    try {
      const res = await this.chainService.checkCharterPayment(validAddress, amountStr);
      return {
        allowed: Boolean(res.ok),
        reasonCode: Number(res.reasonCode)
      };
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      throw err;
    }
  }

  async attemptPayment(to, amountWei, receiptId) {
    const validAddress = validateAddress(to);
    const amountStr = validateAndConvertAmountWei(amountWei);
    const validReceiptId = validateReceiptId(receiptId);

    try {
      const res = await this.chainService.attemptCharterPayment(validAddress, amountStr, validReceiptId, this.options);
      return {
        executed: Boolean(res.executed),
        reasonCode: Number(res.reasonCode),
        txHash: res.txHash || null
      };
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      throw err;
    }
  }

  async getRules() {
    const rules = await this.chainService.getCharterRules();
    return {
      maxPerTx: rules.maxPerTx,
      dailyCap: rules.dailyCap,
      humanApprovalThreshold: rules.humanApprovalThreshold,
      allowListEnabled: Boolean(rules.allowListEnabled)
    };
  }

  async getStatus() {
    const status = await this.chainService.getStatus ? await this.chainService.getStatus() : await this.chainService.getCharterStatus();
    return {
      windowStart: Number(status.windowStart),
      spentInWindow: status.spentInWindow,
      remainingInWindow: status.remainingInWindow,
      balance: status.balance
    };
  }
}

export function createSpendingCharterAdapter(config = {}, options = {}) {
  return new SpendingCharterAdapter(config, options);
}
