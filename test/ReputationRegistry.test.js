const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationRegistry", function () {
  let owner;
  let author;
  let secondAuthor;
  let subject;
  let secondSubject;
  let outsider;
  let registry;

  const metadataURI = "ipfs://agent-metadata";
  const evidenceHash = ethers.id("feedback-evidence");

  async function register(agent, registrar = owner, uri = metadataURI) {
    return registry.connect(registrar).registerAgent(agent.address, uri);
  }

  async function submit(
    authorSigner,
    subjectAddress,
    scores = [10, 20, 30, 40],
    hash = evidenceHash,
    value = 0n
  ) {
    return registry.connect(authorSigner).submitFeedback(
      subjectAddress,
      ...scores,
      hash,
      { value }
    );
  }

  async function nextId(authorSigner, subjectAddress, scores, hash, value = 0n) {
    return registry.connect(authorSigner).submitFeedback.staticCall(
      subjectAddress,
      ...scores,
      hash,
      { value }
    );
  }

  beforeEach(async function () {
    [owner, author, secondAuthor, subject, secondSubject, outsider] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("ReputationRegistry");
    registry = await factory.deploy(owner.address);
    await registry.waitForDeployment();
    await register(subject);
    await register(secondSubject);
  });

  it("deploys with an unregistered address reporting false", async function () {
    expect(await registry.isRegistered(author.address)).to.equal(false);
    expect(await registry.getReputation(outsider.address)).to.deep.equal([
      false,
      0n,
      0n,
      0n,
      0n,
      0n
    ]);
  });

  it("allows the owner to register another agent and emits the exact event", async function () {
    const event = registry.interface.getEvent("AgentRegistered");
    expect(event.format("sighash")).to.equal("AgentRegistered(address,string)");
    expect(event.inputs.map((input) => input.indexed)).to.deep.equal([true, false]);

    await expect(register(author))
      .to.emit(registry, "AgentRegistered")
      .withArgs(author.address, metadataURI);
    expect(await registry.isRegistered(author.address)).to.equal(true);
  });

  it("allows an agent to register itself", async function () {
    await expect(register(author, author, metadataURI))
      .to.emit(registry, "AgentRegistered")
      .withArgs(author.address, metadataURI);
    expect(await registry.isRegistered(author.address)).to.equal(true);
  });

  it("rejects duplicate registration by either the owner or the agent", async function () {
    await register(author);
    await expect(register(author)).to.be.revertedWithCustomError(registry, "AlreadyRegistered");
    await expect(register(author, author)).to.be.revertedWithCustomError(registry, "AlreadyRegistered");
  });

  it("rejects registering the zero address", async function () {
    await expect(registry.connect(owner).registerAgent(ethers.ZeroAddress, metadataURI))
      .to.be.revertedWithCustomError(registry, "InvalidAgent");
  });

  it("does not allow an unrelated caller to register another address", async function () {
    await expect(register(author, outsider)).to.be.reverted;
  });

  it("rejects feedback from an unregistered author", async function () {
    await expect(submit(author, subject.address)).to.be.reverted;
  });

  it("allows feedback about an unregistered subject", async function () {
    await register(author);
    expect(await registry.isRegistered(outsider.address)).to.equal(false);

    const id = await nextId(author, outsider.address, [10, 20, 30, 40], evidenceHash);
    await submit(author, outsider.address, [10, 20, 30, 40]);

    expect((await registry.getFeedback(id)).subject).to.equal(outsider.address);
    expect(await registry.getReputation(outsider.address)).to.deep.equal([
      false,
      0n,
      0n,
      0n,
      0n,
      0n
    ]);

    await register(outsider);
    expect(await registry.getReputation(outsider.address)).to.deep.equal([
      true,
      1n,
      10n,
      20n,
      30n,
      40n
    ]);
  });

  it("rejects self-feedback from a registered author", async function () {
    await register(author);
    await expect(submit(author, author.address)).to.be.reverted;
  });

  it("rejects feedback for the zero address", async function () {
    await register(author);
    await expect(submit(author, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(registry, "InvalidSubject");
  });

  it("accepts zero scores and zero stake when minStake is zero", async function () {
    await register(author);
    const id = await nextId(author, subject.address, [0, 0, 0, 0], evidenceHash);
    expect(id).to.equal(1n);

    await submit(author, subject.address, [0, 0, 0, 0]);
    const feedback = await registry.getFeedback(id);
    expect(feedback.competence).to.equal(0);
    expect(feedback.honesty).to.equal(0);
    expect(feedback.compliance).to.equal(0);
    expect(feedback.reliability).to.equal(0);
    expect(feedback.stake).to.equal(0n);
  });

  it("accepts scores of 100 on all four axes", async function () {
    await register(author);
    const id = await nextId(author, subject.address, [100, 100, 100, 100], evidenceHash);
    await submit(author, subject.address, [100, 100, 100, 100]);

    const feedback = await registry.getFeedback(id);
    expect([
      feedback.competence,
      feedback.honesty,
      feedback.compliance,
      feedback.reliability
    ]).to.deep.equal([100, 100, 100, 100]);
  });

  it("rejects values above 100 for each score axis", async function () {
    await register(author);
    for (let axis = 0; axis < 4; axis += 1) {
      const scores = [10, 20, 30, 40];
      scores[axis] = 101;
      await expect(submit(author, subject.address, scores)).to.be.reverted;
    }
  });

  it("creates feedback with sequential global ID and all specified fields", async function () {
    await register(author);
    const scores = [11, 22, 33, 44];
    const stake = 0n;
    const id = await nextId(author, subject.address, scores, evidenceHash, stake);
    expect(id).to.equal(1n);

    const tx = await submit(author, subject.address, scores, evidenceHash, stake);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const feedback = await registry.getFeedback(id);

    expect([
      feedback.author,
      feedback.subject,
      feedback.competence,
      feedback.honesty,
      feedback.compliance,
      feedback.reliability,
      feedback.evidenceHash,
      feedback.stake,
      feedback.status,
      feedback.createdAt
    ]).to.deep.equal([
      author.address,
      subject.address,
      ...scores,
      evidenceHash,
      stake,
      0,
      BigInt(block.timestamp)
    ]);
  });

  it("reverts when reading an unknown feedback ID", async function () {
    await expect(registry.getFeedback(0n))
      .to.be.revertedWithCustomError(registry, "FeedbackNotFound");
    await expect(registry.getFeedback(1n))
      .to.be.revertedWithCustomError(registry, "FeedbackNotFound");
  });

  it("allows duplicate feedback submissions by the same author for the same subject", async function () {
    await register(author);
    const scores = [10, 20, 30, 40];
    const firstId = await nextId(author, subject.address, scores, evidenceHash);
    await submit(author, subject.address, scores, evidenceHash);
    const secondId = await nextId(author, subject.address, scores, evidenceHash);
    await submit(author, subject.address, scores, evidenceHash);

    expect(firstId).to.equal(1n);
    expect(secondId).to.equal(2n);
    expect(await registry.getReputation(subject.address)).to.deep.equal([
      true,
      2n,
      20n,
      40n,
      60n,
      80n
    ]);
  });

  it("enforces owner-only minimum stake and accepts equal or greater stake", async function () {
    await expect(registry.connect(outsider).setMinStake(5n)).to.be.reverted;
    await registry.connect(owner).setMinStake(5n);
    await register(author);

    await expect(submit(author, subject.address, [10, 20, 30, 40], evidenceHash, 4n))
      .to.be.revertedWithCustomError(registry, "StakeBelowMinimum");
    expect(await nextId(author, subject.address, [10, 20, 30, 40], evidenceHash, 5n)).to.equal(1n);

    await submit(author, subject.address, [10, 20, 30, 40], evidenceHash, 5n);
    await submit(author, secondSubject.address, [20, 30, 40, 50], evidenceHash, 8n);
    await registry.connect(owner).setMinStake(20n);

    expect((await registry.getFeedback(1n)).stake).to.equal(5n);
    expect((await registry.getFeedback(2n)).stake).to.equal(8n);
  });

  it("requires the exact recorded stake as dispute bond and records the disputer", async function () {
    await registry.connect(owner).setMinStake(10n);
    await register(author);
    await submit(author, subject.address, [10, 20, 30, 40], evidenceHash, 10n);

    await expect(registry.connect(outsider).disputeFeedback(1n, evidenceHash, { value: 9n }))
      .to.be.revertedWithCustomError(registry, "IncorrectDisputeBond");
    await expect(registry.connect(outsider).disputeFeedback(1n, evidenceHash, { value: 11n }))
      .to.be.revertedWithCustomError(registry, "IncorrectDisputeBond");

    const event = registry.interface.getEvent("FeedbackDisputed");
    expect(event.format("sighash")).to.equal("FeedbackDisputed(uint256,address,bytes32)");
    expect(event.inputs.map((input) => input.indexed)).to.deep.equal([true, true, false]);

    await expect(registry.connect(outsider).disputeFeedback(1n, ethers.ZeroHash, { value: 10n }))
      .to.emit(registry, "FeedbackDisputed")
      .withArgs(1n, outsider.address, ethers.ZeroHash);
    expect((await registry.getFeedback(1n)).status).to.equal(1);
  });

  it("rejects a duplicate dispute without changing contract balance or feedback state", async function () {
    await registry.connect(owner).setMinStake(5n);
    await register(author);
    await submit(author, subject.address, [10, 20, 30, 40], evidenceHash, 5n);
    await registry.connect(outsider).disputeFeedback(1n, evidenceHash, { value: 5n });

    const balanceBefore = await ethers.provider.getBalance(await registry.getAddress());
    const feedbackBefore = await registry.getFeedback(1n);
    const reputationBefore = await registry.getReputation(subject.address);

    await expect(registry.connect(secondAuthor).disputeFeedback(1n, evidenceHash, { value: 5n }))
      .to.be.revertedWithCustomError(registry, "InvalidFeedbackStatus");

    expect(await ethers.provider.getBalance(await registry.getAddress())).to.equal(balanceBefore);
    expect(await registry.getFeedback(1n)).to.deep.equal(feedbackBefore);
    expect(await registry.getReputation(subject.address)).to.deep.equal(reputationBefore);
  });

  it("rejects direct resolution of active feedback without changing state", async function () {
    await registry.connect(owner).setMinStake(5n);
    await register(author);
    await submit(author, subject.address, [10, 20, 30, 40], evidenceHash, 5n);

    const balanceBefore = await ethers.provider.getBalance(await registry.getAddress());
    const reputationBefore = await registry.getReputation(subject.address);

    await expect(registry.connect(owner).resolveDispute(1n, true))
      .to.be.revertedWithCustomError(registry, "InvalidFeedbackStatus");

    expect((await registry.getFeedback(1n)).status).to.equal(0);
    expect(await registry.getReputation(subject.address)).to.deep.equal(reputationBefore);
    expect(await ethers.provider.getBalance(await registry.getAddress())).to.equal(balanceBefore);
  });

  it("rejects unknown feedback IDs in dispute, resolution, and release calls", async function () {
    await expect(registry.connect(outsider).disputeFeedback(999n, evidenceHash))
      .to.be.revertedWithCustomError(registry, "FeedbackNotFound");
    await expect(registry.connect(owner).resolveDispute(999n, false))
      .to.be.revertedWithCustomError(registry, "FeedbackNotFound");
    await expect(registry.connect(author).releaseStake(999n)).to.be.reverted;
  });

  it("declares the required StakeReleased event signature and indexed fields", async function () {
    const event = registry.interface.getEvent("StakeReleased");
    expect(event.format("sighash")).to.equal("StakeReleased(uint256,address,uint256)");
    expect(event.inputs.map((input) => input.indexed)).to.deep.equal([true, true, false]);
  });

  it("keeps the releaseStake TODO state- and balance-neutral", async function () {
    await registry.connect(owner).setMinStake(5n);
    await register(author);
    await submit(author, subject.address, [10, 20, 30, 40], evidenceHash, 5n);

    const balanceBefore = await ethers.provider.getBalance(await registry.getAddress());
    const feedbackBefore = await registry.getFeedback(1n);
    const reputationBefore = await registry.getReputation(subject.address);

    await expect(registry.connect(author).releaseStake(1n)).to.be.reverted;

    expect(await registry.getFeedback(1n)).to.deep.equal(feedbackBefore);
    expect(await registry.getReputation(subject.address)).to.deep.equal(reputationBefore);
    expect(await ethers.provider.getBalance(await registry.getAddress())).to.equal(balanceBefore);
  });

  it("resolves upheld feedback to status 2 and returns both stakes to the author", async function () {
    await registry.connect(owner).setMinStake(10n);
    await register(author);
    await submit(author, subject.address, [10, 20, 30, 40], evidenceHash, 10n);
    await registry.connect(outsider).disputeFeedback(1n, evidenceHash, { value: 10n });

    const contractBefore = await ethers.provider.getBalance(await registry.getAddress());
    const authorBefore = await ethers.provider.getBalance(author.address);
    const disputerBefore = await ethers.provider.getBalance(outsider.address);
    const reputationBefore = await registry.getReputation(subject.address);

    const event = registry.interface.getEvent("DisputeResolved");
    expect(event.format("sighash")).to.equal("DisputeResolved(uint256,bool)");
    expect(event.inputs.map((input) => input.indexed)).to.deep.equal([true, false]);

    await expect(registry.connect(owner).resolveDispute(1n, false))
      .to.emit(registry, "DisputeResolved")
      .withArgs(1n, false);

    expect((await registry.getFeedback(1n)).status).to.equal(2);
    expect(await ethers.provider.getBalance(await registry.getAddress())).to.equal(contractBefore - 20n);
    expect(await ethers.provider.getBalance(author.address)).to.equal(authorBefore + 20n);
    expect(await ethers.provider.getBalance(outsider.address)).to.equal(disputerBefore);
    expect(await registry.getReputation(subject.address)).to.deep.equal(reputationBefore);
  });

  it("allows only the owner to resolve a disputed feedback", async function () {
    await registry.connect(owner).setMinStake(5n);
    await register(author);
    await submit(author, subject.address, [1, 2, 3, 4], evidenceHash, 5n);
    await registry.connect(outsider).disputeFeedback(1n, evidenceHash, { value: 5n });

    await expect(registry.connect(secondAuthor).resolveDispute(1n, true)).to.be.reverted;
    expect((await registry.getFeedback(1n)).status).to.equal(1);
  });

  it("slashes exactly one aggregate contribution and transfers both stakes to the disputer", async function () {
    await registry.connect(owner).setMinStake(5n);
    await register(author);
    await register(secondAuthor);
    await submit(author, subject.address, [1, 2, 3, 4], evidenceHash, 5n);
    await submit(secondAuthor, subject.address, [10, 20, 30, 40], evidenceHash, 7n);
    await registry.connect(outsider).disputeFeedback(1n, evidenceHash, { value: 5n });

    const contractBefore = await ethers.provider.getBalance(await registry.getAddress());
    const authorBefore = await ethers.provider.getBalance(author.address);
    const disputerBefore = await ethers.provider.getBalance(outsider.address);

    await expect(registry.connect(owner).resolveDispute(1n, true))
      .to.emit(registry, "DisputeResolved")
      .withArgs(1n, true);

    expect(await registry.getReputation(subject.address)).to.deep.equal([
      true,
      1n,
      10n,
      20n,
      30n,
      40n
    ]);
    expect(await ethers.provider.getBalance(await registry.getAddress())).to.equal(contractBefore - 10n);
    expect(await ethers.provider.getBalance(author.address)).to.equal(authorBefore);
    expect(await ethers.provider.getBalance(outsider.address)).to.equal(disputerBefore + 10n);

    const slashedFeedback = await registry.getFeedback(1n);
    expect(slashedFeedback.status).to.equal(3);
    expect(slashedFeedback.author).to.equal(author.address);
    expect(slashedFeedback.stake).to.equal(5n);
    expect((await registry.getFeedback(2n)).status).to.equal(0);

    const nextFeedbackId = await nextId(author, secondSubject.address, [1, 1, 1, 1], evidenceHash, 5n);
    expect(nextFeedbackId).to.equal(3n);
  });

  it("reverts a failed payout and leaves dispute, record, and aggregates unchanged", async function () {
    await registry.connect(owner).setMinStake(5n);
    await register(author);
    await submit(author, subject.address, [1, 2, 3, 4], evidenceHash, 5n);
    await registry.connect(outsider).disputeFeedback(1n, evidenceHash, { value: 5n });
    const balanceBefore = await ethers.provider.getBalance(await registry.getAddress());
    await ethers.provider.send("hardhat_setCode", [outsider.address, "0x60006000fd"]);

    await expect(registry.connect(owner).resolveDispute(1n, true))
      .to.be.revertedWithCustomError(registry, "NativeTransferFailed");

    expect((await registry.getFeedback(1n)).status).to.equal(1);
    expect(await registry.getReputation(subject.address)).to.deep.equal([
      true,
      1n,
      1n,
      2n,
      3n,
      4n
    ]);
    expect(await ethers.provider.getBalance(await registry.getAddress())).to.equal(balanceBefore);
    await ethers.provider.send("hardhat_setCode", [outsider.address, "0x"]);
  });

  it("emits FeedbackSubmitted with the exact signature, indexed fields, and values", async function () {
    await register(author);
    const event = registry.interface.getEvent("FeedbackSubmitted");
    expect(event.format("sighash")).to.equal(
      "FeedbackSubmitted(uint256,address,address,uint8,uint8,uint8,uint8,uint256)"
    );
    expect(event.inputs.map((input) => input.indexed)).to.deep.equal([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false
    ]);

    const scores = [1, 2, 3, 4];
    const stake = 0n;
    const id = await nextId(author, subject.address, scores, evidenceHash, stake);
    await expect(submit(author, subject.address, scores, evidenceHash, stake))
      .to.emit(registry, "FeedbackSubmitted")
      .withArgs(id, author.address, subject.address, ...scores, stake);
  });

  it("assigns global IDs sequentially across different subjects", async function () {
    await register(author);
    await register(secondAuthor);

    expect(await nextId(author, subject.address, [1, 2, 3, 4], evidenceHash)).to.equal(1n);
    await submit(author, subject.address, [1, 2, 3, 4]);
    expect(await nextId(secondAuthor, secondSubject.address, [5, 6, 7, 8], evidenceHash))
      .to.equal(2n);
    await submit(secondAuthor, secondSubject.address, [5, 6, 7, 8]);
    expect(await nextId(author, secondSubject.address, [9, 10, 11, 12], evidenceHash))
      .to.equal(3n);
  });

  it("aggregates feedback count and axis sums independently per subject", async function () {
    await register(author);
    await register(secondAuthor);

    await submit(author, subject.address, [10, 20, 30, 40]);
    await submit(secondAuthor, subject.address, [1, 2, 3, 4]);
    await submit(author, secondSubject.address, [7, 8, 9, 10]);

    expect(await registry.getReputation(subject.address)).to.deep.equal([
      true,
      2n,
      11n,
      22n,
      33n,
      44n
    ]);
    expect(await registry.getReputation(secondSubject.address)).to.deep.equal([
      true,
      1n,
      7n,
      8n,
      9n,
      10n
    ]);
  });

  it("reports registration with the aggregated reputation values", async function () {
    await register(author);
    await submit(author, subject.address, [13, 14, 15, 16]);

    expect(await registry.getReputation(subject.address)).to.deep.equal([
      true,
      1n,
      13n,
      14n,
      15n,
      16n
    ]);
  });
});