const { expect } = require("chai");
const { canonicalize, hashCanonical } = require("../shared/canonicalJson");
const constants = require("../shared/constants.json");

describe("canonical JSON", function () {
  it("produces identical canonical text and keccak256 hashes for equivalent objects", function () {
    const first = {
      z: 3,
      nested: { second: "value", first: true },
      array: ["one", { y: 2, x: 1 }]
    };
    const reordered = {
      array: ["one", { x: 1, y: 2 }],
      nested: { first: true, second: "value" },
      z: 3
    };

    expect(canonicalize(first)).to.equal(canonicalize(reordered));
    expect(hashCanonical(first)).to.equal(hashCanonical(reordered));
  });

  it("preserves array order", function () {
    expect(canonicalize(["first", "second"])).not.to.equal(
      canonicalize(["second", "first"])
    );
  });

  it("rejects values that are not representable in JSON", function () {
    expect(() => canonicalize({ amount: 1n })).to.throw(TypeError);
    expect(() => canonicalize({ amount: Number.NaN })).to.throw(TypeError);
  });
});

describe("shared constants", function () {
  it("contains only the specified canonical enum values", function () {
    expect(constants).to.deep.equal({
      reasonCodes: {
        OK: 0,
        EXCEEDS_MAX_PER_TX: 1,
        EXCEEDS_DAILY_CAP: 2,
        COUNTERPARTY_DENIED: 3,
        COUNTERPARTY_NOT_ALLOWED: 4,
        REQUIRES_HUMAN_APPROVAL: 5,
        INSUFFICIENT_BALANCE: 6
      },
      decisions: {
        BLOCKED: 0,
        EXECUTED: 1,
        DECLINED_BY_AGENT: 2
      },
      attemptStatuses: ["proposed", "executed", "blocked", "declined", "failed"],
      attackTypes: ["urgent_pretext", "prompt_injection", "fake_trust_claim"],
      agentRoles: ["good", "bad", "counterparty"],
      reputationAxes: ["competence", "honesty", "compliance", "reliability"],
      counterpartyStatuses: { allowed: 0, denied: 1 },
      spendingWindowSeconds: 86400
    });
  });
});