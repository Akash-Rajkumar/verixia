const { ethers } = require("ethers");
const { ValidationError } = require("../errors");

const CANONICAL_AXES = ["competence", "honesty", "compliance", "reliability"];

function validateAddress(address, paramName = "counterparty") {
  if (typeof address !== "string" || !address.trim() || !ethers.isAddress(address.trim())) {
    throw new ValidationError(`Invalid Ethereum address for ${paramName}: '${address}'`);
  }
  return address.trim();
}

function normalizeReputation(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  for (const axis of CANONICAL_AXES) {
    const val = raw[axis];
    if (val === undefined || val === null || typeof val !== "number" || !Number.isFinite(val)) {
      return null;
    }
  }

  return {
    competence: raw.competence,
    honesty: raw.honesty,
    compliance: raw.compliance,
    reliability: raw.reliability
  };
}

class ReputationAdapter {
  constructor(options = {}) {
    if (typeof options === "function") {
      this.provider = options;
    } else if (options && typeof options === "object") {
      this.provider = options.provider || options.reputationProvider || null;
    } else {
      this.provider = null;
    }
  }

  async getReputation(counterparty) {
    const validAddress = validateAddress(counterparty, "counterparty");

    if (!this.provider) {
      return null;
    }

    let rawResult;
    try {
      if (typeof this.provider === "function") {
        rawResult = await this.provider(validAddress);
      } else if (typeof this.provider.getReputation === "function") {
        rawResult = await this.provider.getReputation(validAddress);
      } else if (typeof this.provider.fetchReputation === "function") {
        rawResult = await this.provider.fetchReputation(validAddress);
      } else {
        return null;
      }
    } catch (_) {
      return null;
    }

    return normalizeReputation(rawResult);
  }
}

function createReputationAdapter(options = {}) {
  return new ReputationAdapter(options);
}

module.exports = {
  ReputationAdapter,
  createReputationAdapter,
  normalizeReputation
};
