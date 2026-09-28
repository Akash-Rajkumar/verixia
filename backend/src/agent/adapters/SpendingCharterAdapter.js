const { ethers } = require("ethers");
const { ValidationError, ChainError } = require("../errors");

function validateAddress(address) {
  if (typeof address !== "string" || !address.trim() || !ethers.isAddress(address.trim())) {
    throw new ValidationError(`Invalid Ethereum address: '${address}'`);
  }
  return address.trim();
}

function validateAmountWei(amountWei) {
  if (typeof amountWei === "number") {
    throw new ValidationError("JavaScript numbers are rejected for amountWei to prevent precision loss. Use a decimal string or BigInt.");
  }
  if (typeof amountWei === "bigint") {
    if (amountWei < 0n) {
      throw new ValidationError("amountWei cannot be negative");
    }
    return amountWei;
  }
  if (typeof amountWei === "string") {
    const trimmed = amountWei.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      throw new ValidationError(`Invalid amountWei string: '${amountWei}'. Must contain only decimal digits.`);
    }
    return BigInt(trimmed);
  }
  throw new ValidationError("amountWei must be a decimal string or BigInt");
}

function validateReceiptId(receiptId) {
  if (typeof receiptId !== "string" || !receiptId.trim()) {
    throw new ValidationError("receiptId must be a non-empty string");
  }
  const trimmed = receiptId.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new ValidationError(`Invalid bytes32 receiptId: '${receiptId}'. Must be a 0x-prefixed 64-character hexadecimal string.`);
  }
  return trimmed;
}

class SpendingCharterAdapter {
  constructor(config = {}, options = {}) {
    const abi = options.abi || config.abi || require("../../../../shared/abi/SpendingCharter.json");
    const contractAddress = config.contractAddress || process.env.SPENDING_CHARTER_ADDRESS;
    const rpcUrl = config.rpcUrl || process.env.RPC_URL;
    const privateKey = config.privateKey || process.env.AGENT_PRIVATE_KEY;

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
      throw new ChainError("SpendingCharter contract instance is not configured");
    }
    return this.contract;
  }

  async checkPayment(to, amountWei) {
    const validAddress = validateAddress(to);
    const validAmountWei = validateAmountWei(amountWei);
    const contract = this._getContract();

    try {
      const [ok, reasonCode] = await contract.checkPayment(validAddress, validAmountWei);
      return {
        allowed: Boolean(ok),
        reasonCode: Number(reasonCode)
      };
    } catch (err) {
      this._handleRevertError(err);
    }
  }

  async attemptPayment(to, amountWei, receiptId) {
    const validAddress = validateAddress(to);
    const validAmountWei = validateAmountWei(amountWei);
    const validReceiptId = validateReceiptId(receiptId);
    const contract = this._getContract();

    if (!contract.runner || typeof contract.runner.sendTransaction !== "function") {
      throw new ChainError("Agent signer is required to execute attemptPayment");
    }

    let tx;
    try {
      tx = await contract.attemptPayment(validAddress, validAmountWei, validReceiptId);
    } catch (err) {
      this._handleRevertError(err);
    }

    let receipt;
    try {
      receipt = await tx.wait(1);
    } catch (err) {
      throw new ChainError(`Transaction receipt confirmation failed: ${err.message}`, { cause: err });
    }

    let executedEvent = null;
    let blockedEvent = null;

    if (receipt && Array.isArray(receipt.logs)) {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed) {
            if (parsed.name === "PaymentExecuted") executedEvent = parsed;
            if (parsed.name === "PaymentBlocked") blockedEvent = parsed;
          }
        } catch (_) {
          // Ignore logs from other contracts or unparseable logs
        }
      }
    }

    if (executedEvent) {
      return {
        executed: true,
        reasonCode: 0,
        txHash: tx.hash
      };
    }

    if (blockedEvent) {
      return {
        executed: false,
        reasonCode: Number(blockedEvent.args.reasonCode),
        txHash: tx.hash
      };
    }

    throw new ChainError(`Transaction ${tx.hash} confirmed but neither PaymentExecuted nor PaymentBlocked event was emitted`);
  }

  async getRules() {
    const contract = this._getContract();
    const [maxPerTx, dailyCap, humanApprovalThreshold, allowListEnabled] = await contract.getRules();
    return {
      maxPerTx: maxPerTx.toString(),
      dailyCap: dailyCap.toString(),
      humanApprovalThreshold: humanApprovalThreshold.toString(),
      allowListEnabled: Boolean(allowListEnabled)
    };
  }

  async getStatus() {
    const contract = this._getContract();
    const [windowStart, spentInWindow, remainingInWindow, balance] = await contract.getStatus();
    return {
      windowStart: Number(windowStart),
      spentInWindow: spentInWindow.toString(),
      remainingInWindow: remainingInWindow.toString(),
      balance: balance.toString()
    };
  }

  _handleRevertError(err) {
    const errMsg = err && err.message ? err.message : String(err);

    if (errMsg.includes("HumanApprovalSemanticsUnspecified")) {
      throw new ChainError("Contract reverted: Human approval semantics unspecified", {
        details: { reasonCode: 5, contractError: "HumanApprovalSemanticsUnspecified" },
        cause: err
      });
    }

    if (errMsg.includes("OnlyAgent")) {
      throw new ChainError("Contract reverted: Caller is not the authorized agent", {
        details: { contractError: "OnlyAgent" },
        cause: err
      });
    }

    if (errMsg.includes("InvalidAgent")) {
      throw new ChainError("Contract reverted: Invalid agent address", {
        details: { contractError: "InvalidAgent" },
        cause: err
      });
    }

    if (errMsg.includes("InvalidCounterpartyStatus")) {
      throw new ChainError("Contract reverted: Invalid counterparty status", {
        details: { contractError: "InvalidCounterpartyStatus" },
        cause: err
      });
    }

    throw new ChainError(`SpendingCharter contract execution error: ${errMsg}`, { cause: err });
  }
}

function createSpendingCharterAdapter(config = {}, options = {}) {
  return new SpendingCharterAdapter(config, options);
}

module.exports = {
  SpendingCharterAdapter,
  createSpendingCharterAdapter
};
