const { expect } = require("chai");
const { ReputationAdapter, createReputationAdapter, normalizeReputation } = require("../backend/src/agent/adapters/ReputationAdapter");
const { ValidationError } = require("../backend/src/agent/errors");

describe("ReputationAdapter Unit Tests (M6 Shell)", function () {
  const validAddress = "0x1234567890123456789012345678901234567890";
  const validScores = {
    competence: 85,
    honesty: 90,
    compliance: 95,
    reliability: 88
  };

  it("1. valid address + provider returns four scores -> returns exact scores", async function () {
    const provider = async (addr) => {
      expect(addr).to.equal(validAddress);
      return validScores;
    };
    const adapter = new ReputationAdapter({ provider });
    const result = await adapter.getReputation(validAddress);

    expect(result).to.deep.equal(validScores);
    expect(result).to.have.all.keys("competence", "honesty", "compliance", "reliability");
  });

  it("2. valid address + provider returns null -> returns null", async function () {
    const provider = async () => null;
    const adapter = new ReputationAdapter({ provider });
    const result = await adapter.getReputation(validAddress);

    expect(result).to.be.null;
  });

  it("3. no provider configured -> returns null", async function () {
    const adapter = new ReputationAdapter();
    const result = await adapter.getReputation(validAddress);

    expect(result).to.be.null;

    const adapter2 = createReputationAdapter({});
    expect(await adapter2.getReputation(validAddress)).to.be.null;
  });

  it("4. provider throws -> returns null (fails soft for M2 compatibility)", async function () {
    const provider = async () => {
      throw new Error("RPC error or timeout");
    };
    const adapter = new ReputationAdapter({ provider });
    const result = await adapter.getReputation(validAddress);

    expect(result).to.be.null;
  });

  it("5. invalid counterparty address -> throws ValidationError", async function () {
    const provider = async () => validScores;
    const adapter = new ReputationAdapter({ provider });

    const invalidAddresses = [
      "not-an-address",
      "0x123",
      "",
      "   ",
      12345,
      null,
      undefined,
      "0xZZZZ567890123456789012345678901234567890"
    ];

    for (const invalidAddr of invalidAddresses) {
      try {
        await adapter.getReputation(invalidAddr);
        expect.fail(`Should have thrown ValidationError for '${invalidAddr}'`);
      } catch (err) {
        expect(err).to.be.an.instanceOf(ValidationError);
      }
    }
  });

  it("6. incomplete reputation object -> returns null", async function () {
    const incompleteObjects = [
      { competence: 80, honesty: 90, compliance: 95 }, // missing reliability
      { competence: 80, honesty: 90 }, // missing compliance & reliability
      { honesty: 90, compliance: 95, reliability: 88 }, // missing competence
      {}
    ];

    for (const incomplete of incompleteObjects) {
      const adapter = new ReputationAdapter({ provider: async () => incomplete });
      const result = await adapter.getReputation(validAddress);
      expect(result).to.be.null;
    }
  });

  it("7. non-numeric score -> returns null", async function () {
    const invalidTypeObjects = [
      { competence: "85", honesty: 90, compliance: 95, reliability: 88 }, // string
      { competence: 85, honesty: null, compliance: 95, reliability: 88 }, // null
      { competence: 85, honesty: 90, compliance: undefined, reliability: 88 }, // undefined
      { competence: 85, honesty: 90, compliance: NaN, reliability: 88 }, // NaN
      { competence: 85, honesty: 90, compliance: 95, reliability: Infinity } // Infinity
    ];

    for (const invalidObj of invalidTypeObjects) {
      const adapter = new ReputationAdapter({ provider: async () => invalidObj });
      const result = await adapter.getReputation(validAddress);
      expect(result).to.be.null;
    }
  });

  it("8. all four canonical axes preserved exactly", async function () {
    const rawWithExtra = {
      competence: 70,
      honesty: 80,
      compliance: 90,
      reliability: 100,
      extraField: "ignored",
      score: 999
    };

    const adapter = new ReputationAdapter({ provider: async () => rawWithExtra });
    const result = await adapter.getReputation(validAddress);

    expect(result).to.deep.equal({
      competence: 70,
      honesty: 80,
      compliance: 90,
      reliability: 100
    });
    expect(Object.keys(result)).to.deep.equal(["competence", "honesty", "compliance", "reliability"]);
  });

  it("9. no default scores are invented when provider returns null/invalid", async function () {
    const adapter1 = new ReputationAdapter({ provider: async () => null });
    const adapter2 = new ReputationAdapter({ provider: async () => ({}) });

    expect(await adapter1.getReputation(validAddress)).to.be.null;
    expect(await adapter2.getReputation(validAddress)).to.be.null;
  });

  it("10. no score scaling or clamping occurs", async function () {
    const rawUnscaled = {
      competence: 85.45,
      honesty: -10,
      compliance: 0,
      reliability: 10000
    };

    const adapter = new ReputationAdapter({ provider: async () => rawUnscaled });
    const result = await adapter.getReputation(validAddress);

    expect(result.competence).to.equal(85.45);
    expect(result.honesty).to.equal(-10);
    expect(result.compliance).to.equal(0);
    expect(result.reliability).to.equal(10000);
  });

  it("11. supports provider object with getReputation or fetchReputation methods", async function () {
    const providerObj = {
      getReputation: async (addr) => ({ competence: 1, honesty: 2, compliance: 3, reliability: 4 })
    };
    const adapterObj = new ReputationAdapter({ provider: providerObj });
    expect(await adapterObj.getReputation(validAddress)).to.deep.equal({
      competence: 1,
      honesty: 2,
      compliance: 3,
      reliability: 4
    });

    const fetchObj = {
      fetchReputation: async (addr) => ({ competence: 5, honesty: 6, compliance: 7, reliability: 8 })
    };
    const adapterFetch = new ReputationAdapter({ provider: fetchObj });
    expect(await adapterFetch.getReputation(validAddress)).to.deep.equal({
      competence: 5,
      honesty: 6,
      compliance: 7,
      reliability: 8
    });
  });
});
