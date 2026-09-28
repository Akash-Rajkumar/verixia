const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("../shared/constants.json");

describe("SpendingCharter", function () {
  const MAX_PER_TX = 50n;
  const DAILY_CAP = 150n;
  const HUMAN_THRESHOLD = 30n;

  let owner;
  let agent;
  let outsider;
  let recipient;
  let charter;

  async function setRules(overrides = {}) {
    await charter.connect(owner).setRules(
      overrides.maxPerTx ?? MAX_PER_TX,
      overrides.dailyCap ?? DAILY_CAP,
      overrides.humanApprovalThreshold ?? HUMAN_THRESHOLD,
      overrides.allowListEnabled ?? false
    );
  }

  async function deployCharter() {
    [owner, agent, outsider, recipient] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("SpendingCharter");
    charter = await factory.deploy(owner.address, agent.address);
    await charter.waitForDeployment();
  }

  beforeEach(async function () {
    await deployCharter();
    await setRules();
  });

  it("sets the constructor owner and agent", async function () {
    expect(await charter.owner()).to.equal(owner.address);
    expect(await charter.agent()).to.equal(agent.address);
  });

  it("rejects a zero agent at deployment and configuration", async function () {
    const factory = await ethers.getContractFactory("SpendingCharter");
    await expect(factory.deploy(owner.address, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(charter, "InvalidAgent");
    await expect(charter.connect(owner).setAgent(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(charter, "InvalidAgent");
  });

  it("allows only the owner to update rules and emits the exact rule event", async function () {
    await expect(charter.connect(outsider).setRules(1, 2, 3, true))
      .to.be.revertedWith("Ownable: caller is not the owner");

    await expect(charter.connect(owner).setRules(60, 180, 40, true))
      .to.emit(charter, "RulesUpdated")
      .withArgs(60, 180, 40, true);
    expect(await charter.getRules()).to.deep.equal([60n, 180n, 40n, true]);
  });

  it("allows only the owner to change the agent", async function () {
    await expect(charter.connect(outsider).setAgent(recipient.address))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await charter.connect(owner).setAgent(recipient.address);
    expect(await charter.agent()).to.equal(recipient.address);
  });

  it("allows only the owner to set counterparty status and emits the exact event", async function () {
    await expect(charter.connect(outsider).setCounterpartyStatus(recipient.address, 1))
      .to.be.revertedWith("Ownable: caller is not the owner");

    await expect(charter.connect(owner).setCounterpartyStatus(recipient.address, 1))
      .to.emit(charter, "CounterpartyStatusSet")
      .withArgs(recipient.address, 1);
    expect(await charter.getCounterpartyStatus(recipient.address)).to.equal(1);
  });

  it("rejects counterparty status values outside the specified 0 and 1", async function () {
    await expect(charter.connect(owner).setCounterpartyStatus(recipient.address, 2))
      .to.be.revertedWithCustomError(charter, "InvalidCounterpartyStatus");
  });

  it("treats the default and explicitly allowed counterparty status as allowed", async function () {
    expect(await charter.getCounterpartyStatus(recipient.address)).to.equal(0);
    await charter.connect(owner).setCounterpartyStatus(recipient.address, 0);
    expect(await charter.getCounterpartyStatus(recipient.address)).to.equal(0);

    await expect(charter.checkPayment(recipient.address, MAX_PER_TX))
      .to.be.revertedWithCustomError(charter, "HumanApprovalSemanticsUnspecified");
  });

  it("returns COUNTERPARTY_DENIED before any later applicable rule", async function () {
    await charter.connect(owner).setCounterpartyStatus(recipient.address, 1);

    expect(await charter.checkPayment.staticCall(recipient.address, MAX_PER_TX + 1n))
      .to.deep.equal([false, constants.reasonCodes.COUNTERPARTY_DENIED]);
  });

  it("returns COUNTERPARTY_NOT_ALLOWED before the max-per-transaction check", async function () {
    await setRules({ allowListEnabled: true });

    expect(await charter.checkPayment.staticCall(recipient.address, MAX_PER_TX + 1n))
      .to.deep.equal([false, constants.reasonCodes.COUNTERPARTY_NOT_ALLOWED]);
  });

  it("does not deny an unlisted counterparty when allow-list mode is disabled", async function () {
    expect(await charter.checkPayment.staticCall(recipient.address, MAX_PER_TX + 1n))
      .to.deep.equal([false, constants.reasonCodes.EXCEEDS_MAX_PER_TX]);
  });

  it("returns EXCEEDS_MAX_PER_TX when amount is above the maximum", async function () {
    expect(await charter.checkPayment.staticCall(recipient.address, MAX_PER_TX + 1n))
      .to.deep.equal([false, constants.reasonCodes.EXCEEDS_MAX_PER_TX]);
  });

  it("does not fail the max-per-transaction boundary before the unresolved decision", async function () {
    await expect(charter.checkPayment(recipient.address, MAX_PER_TX))
      .to.be.revertedWithCustomError(charter, "HumanApprovalSemanticsUnspecified");
  });

  it("returns EXCEEDS_DAILY_CAP when the amount exceeds the remaining cap", async function () {
    await setRules({ maxPerTx: 200n, dailyCap: 150n });

    expect(await charter.checkPayment.staticCall(recipient.address, DAILY_CAP + 1n))
      .to.deep.equal([false, constants.reasonCodes.EXCEEDS_DAILY_CAP]);
  });

  it("does not fail the daily-cap boundary before the unresolved decision", async function () {
    await setRules({ maxPerTx: 200n });
    await expect(charter.checkPayment(recipient.address, DAILY_CAP))
      .to.be.revertedWithCustomError(charter, "HumanApprovalSemanticsUnspecified");
  });

  it("returns max-per-transaction before daily-cap when both limits fail", async function () {
    await setRules({ maxPerTx: 40n, dailyCap: 100n });

    expect(await charter.checkPayment.staticCall(recipient.address, 101n))
      .to.deep.equal([false, constants.reasonCodes.EXCEEDS_MAX_PER_TX]);
  });

  it("does not transfer or change the balance for a blocked payment and records its receipt", async function () {
    const receiptId = ethers.id("blocked-denied-payment");
    await charter.connect(owner).setCounterpartyStatus(recipient.address, 1);
    await charter.connect(owner).fund({ value: 100n });
    const charterBalanceBefore = await ethers.provider.getBalance(await charter.getAddress());
    const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);

    await expect(charter.connect(agent).attemptPayment(recipient.address, 10n, receiptId))
      .to.emit(charter, "PaymentBlocked")
      .withArgs(receiptId, recipient.address, 10n, constants.reasonCodes.COUNTERPARTY_DENIED);

    expect(await ethers.provider.getBalance(await charter.getAddress())).to.equal(charterBalanceBefore);
    expect(await ethers.provider.getBalance(recipient.address)).to.equal(recipientBalanceBefore);
    expect(await charter.getDailySpent()).to.equal(0n);
  });

  it("rejects payment attempts from callers other than the agent", async function () {
    await expect(charter.connect(outsider).attemptPayment(recipient.address, 1n, ethers.ZeroHash))
      .to.be.revertedWithCustomError(charter, "OnlyAgent");
  });

  it("accepts funds through fund() and receive()", async function () {
    await charter.connect(owner).fund({ value: 10n });
    await owner.sendTransaction({ to: await charter.getAddress(), value: 5n });
    expect(await charter.getBalance()).to.equal(15n);
  });

  it("exposes the specified fixed reason-code values", async function () {
    expect(constants.reasonCodes).to.deep.equal({
      OK: 0,
      EXCEEDS_MAX_PER_TX: 1,
      EXCEEDS_DAILY_CAP: 2,
      COUNTERPARTY_DENIED: 3,
      COUNTERPARTY_NOT_ALLOWED: 4,
      REQUIRES_HUMAN_APPROVAL: 5,
      INSUFFICIENT_BALANCE: 6
    });
  });

  it("reports zero initial spending and the configured remaining cap", async function () {
    expect(await charter.getDailySpent()).to.equal(0n);
    expect(await charter.getDailyRemaining()).to.equal(DAILY_CAP);
    expect(await charter.getStatus()).to.deep.equal([0n, 0n, DAILY_CAP, 0n]);
  });

  it.skip("human approval semantics pending specification", async function () {});

  it.skip("successful payments, insufficient-balance precedence, and 24-hour rollover pending human-approval semantics", async function () {
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
  });
});