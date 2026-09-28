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

    expect(await charter.checkPayment.staticCall(recipient.address, MAX_PER_TX))
      .to.deep.equal([false, constants.reasonCodes.REQUIRES_HUMAN_APPROVAL]);
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

  it("returns REQUIRES_HUMAN_APPROVAL after the max-per-transaction check", async function () {
    expect(await charter.checkPayment.staticCall(recipient.address, MAX_PER_TX))
      .to.deep.equal([false, constants.reasonCodes.REQUIRES_HUMAN_APPROVAL]);
  });

  it("returns EXCEEDS_DAILY_CAP when the amount exceeds the remaining cap", async function () {
    await setRules({ maxPerTx: 200n, dailyCap: 150n });

    expect(await charter.checkPayment.staticCall(recipient.address, DAILY_CAP + 1n))
      .to.deep.equal([false, constants.reasonCodes.EXCEEDS_DAILY_CAP]);
  });

  it("returns REQUIRES_HUMAN_APPROVAL after the daily-cap check", async function () {
    await setRules({ maxPerTx: 200n });
    expect(await charter.checkPayment.staticCall(recipient.address, DAILY_CAP))
      .to.deep.equal([false, constants.reasonCodes.REQUIRES_HUMAN_APPROVAL]);
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

  it("returns reason 5 above the threshold even with sufficient balance", async function () {
    await charter.connect(owner).fund({ value: 100n });
    expect(await charter.checkPayment.staticCall(recipient.address, HUMAN_THRESHOLD + 1n))
      .to.deep.equal([false, constants.reasonCodes.REQUIRES_HUMAN_APPROVAL]);
  });

  it("returns reason 5 above the threshold before insufficient balance", async function () {
    expect(await charter.checkPayment.staticCall(recipient.address, HUMAN_THRESHOLD + 1n))
      .to.deep.equal([false, constants.reasonCodes.REQUIRES_HUMAN_APPROVAL]);
  });

  it("checks insufficient balance at the exact human-approval threshold", async function () {
    expect(await charter.checkPayment.staticCall(recipient.address, HUMAN_THRESHOLD))
      .to.deep.equal([false, constants.reasonCodes.INSUFFICIENT_BALANCE]);
  });

  it("checks insufficient balance below the human-approval threshold", async function () {
    expect(await charter.checkPayment.staticCall(recipient.address, HUMAN_THRESHOLD - 1n))
      .to.deep.equal([false, constants.reasonCodes.INSUFFICIENT_BALANCE]);
  });

  it("allows an at-threshold payment when balance is sufficient", async function () {
    await charter.connect(owner).fund({ value: HUMAN_THRESHOLD });
    expect(await charter.checkPayment.staticCall(recipient.address, HUMAN_THRESHOLD))
      .to.deep.equal([true, constants.reasonCodes.OK]);

    const receiptId = ethers.id("at-threshold-payment");
    await expect(charter.connect(agent).attemptPayment(recipient.address, HUMAN_THRESHOLD, receiptId))
      .to.emit(charter, "PaymentExecuted")
      .withArgs(receiptId, recipient.address, HUMAN_THRESHOLD, HUMAN_THRESHOLD);
    expect(await charter.getBalance()).to.equal(0n);
    expect(await charter.getDailySpent()).to.equal(HUMAN_THRESHOLD);
  });

  it("executes an eligible payment and updates balance and spending", async function () {
    const paymentAmount = 20n;
    const receiptId = ethers.id("eligible-payment");
    await charter.connect(owner).fund({ value: 100n });
    const contractBalanceBefore = await charter.getBalance();
    const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);

    await expect(charter.connect(agent).attemptPayment(recipient.address, paymentAmount, receiptId))
      .to.emit(charter, "PaymentExecuted")
      .withArgs(receiptId, recipient.address, paymentAmount, paymentAmount);

    expect(await charter.getBalance()).to.equal(contractBalanceBefore - paymentAmount);
    expect(await ethers.provider.getBalance(recipient.address)).to.equal(
      recipientBalanceBefore + paymentAmount
    );
    expect(await charter.getDailySpent()).to.equal(paymentAmount);
  });

  it("does not transfer funds or increase spending for a reason-5 blocked payment", async function () {
    const paymentAmount = HUMAN_THRESHOLD + 1n;
    const receiptId = ethers.id("threshold-blocked-payment");
    await charter.connect(owner).fund({ value: 100n });
    const contractBalanceBefore = await charter.getBalance();
    const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);

    expect(await charter.connect(agent).attemptPayment.staticCall(
      recipient.address,
      paymentAmount,
      receiptId
    )).to.deep.equal([false, constants.reasonCodes.REQUIRES_HUMAN_APPROVAL]);

    await expect(charter.connect(agent).attemptPayment(recipient.address, paymentAmount, receiptId))
      .to.emit(charter, "PaymentBlocked")
      .withArgs(receiptId, recipient.address, paymentAmount, constants.reasonCodes.REQUIRES_HUMAN_APPROVAL);

    expect(await charter.getBalance()).to.equal(contractBalanceBefore);
    expect(await ethers.provider.getBalance(recipient.address)).to.equal(recipientBalanceBefore);
    expect(await charter.getDailySpent()).to.equal(0n);
  });

  it("resets the logical spending window after 24 hours and starts a fresh window on payment", async function () {
    const firstAmount = 20n;
    await charter.connect(owner).fund({ value: 100n });
    await charter.connect(agent).attemptPayment(
      recipient.address,
      firstAmount,
      ethers.id("before-window-expiry")
    );

    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    expect(await charter.getDailySpent()).to.equal(0n);
    expect(await charter.getDailyRemaining()).to.equal(DAILY_CAP);
    const expiredStatus = await charter.getStatus();
    expect(expiredStatus.windowStart).to.equal(0n);
    expect(expiredStatus.spentInWindow).to.equal(0n);

    const nextAmount = 10n;
    const tx = await charter.connect(agent).attemptPayment(
      recipient.address,
      nextAmount,
      ethers.id("after-window-expiry")
    );
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);

    expect(await charter.getDailySpent()).to.equal(nextAmount);
    expect((await charter.getStatus()).windowStart).to.equal(BigInt(block.timestamp));
  });
});