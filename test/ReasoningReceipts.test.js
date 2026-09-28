const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReasoningReceipts Contract", function () {
  let owner, recorder, agent, counterparty, unauthorized;
  let contract;

  const validReceiptId = ethers.id("test-receipt-1");
  const validReasoningHash = ethers.id("reasoning-hash-1");
  const validSummary = "Payment authorized by agent";

  beforeEach(async function () {
    [owner, recorder, agent, counterparty, unauthorized] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ReasoningReceipts");
    contract = await Factory.deploy(owner.address);
    await contract.waitForDeployment();
  });

  describe("1. Deployment and Owner", function () {
    it("sets the correct owner upon deployment", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("owner is NOT automatically an authorized recorder", async function () {
      expect(await contract.getRecorderStatus(owner.address)).to.be.false;
    });
  });

  describe("2. Recorder Authorization", function () {
    it("owner can enable and disable recorder status", async function () {
      await expect(contract.connect(owner).setRecorder(recorder.address, true))
        .to.emit(contract, "RecorderStatusSet")
        .withArgs(recorder.address, true);

      expect(await contract.getRecorderStatus(recorder.address)).to.be.true;

      await expect(contract.connect(owner).setRecorder(recorder.address, false))
        .to.emit(contract, "RecorderStatusSet")
        .withArgs(recorder.address, false);

      expect(await contract.getRecorderStatus(recorder.address)).to.be.false;
    });

    it("reverts with InvalidAddress when setting recorder to address(0)", async function () {
      await expect(
        contract.connect(owner).setRecorder(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(contract, "InvalidAddress");
    });
  });

  describe("3. Unauthorized setRecorder", function () {
    it("reverts when non-owner attempts setRecorder", async function () {
      await expect(
        contract.connect(unauthorized).setRecorder(recorder.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("4. Successful Receipt Recording & 5. ReceiptRecorded Event", function () {
    beforeEach(async function () {
      await contract.connect(owner).setRecorder(recorder.address, true);
    });

    it("allows authorized recorder to record receipt and emits ReceiptRecorded event", async function () {
      const amount = ethers.parseEther("1.5");
      const decision = 1; // EXECUTED

      await expect(
        contract.connect(recorder).recordReceipt(
          validReceiptId,
          agent.address,
          counterparty.address,
          amount,
          decision,
          validReasoningHash,
          validSummary
        )
      )
        .to.emit(contract, "ReceiptRecorded")
        .withArgs(
          validReceiptId,
          agent.address,
          counterparty.address,
          amount,
          decision,
          validReasoningHash,
          validSummary
        );
    });
  });

  describe("6. Duplicate Receipt Rejection", function () {
    beforeEach(async function () {
      await contract.connect(owner).setRecorder(recorder.address, true);
      await contract.connect(recorder).recordReceipt(
        validReceiptId,
        agent.address,
        counterparty.address,
        1000n,
        1,
        validReasoningHash,
        validSummary
      );
    });

    it("reverts with DuplicateReceiptId when recording same receiptId twice", async function () {
      await expect(
        contract.connect(recorder).recordReceipt(
          validReceiptId,
          agent.address,
          counterparty.address,
          2000n,
          1,
          validReasoningHash,
          "another summary"
        )
      ).to.be.revertedWithCustomError(contract, "DuplicateReceiptId");
    });
  });

  describe("7. Unauthorized recordReceipt Rejection", function () {
    it("reverts with OnlyRecorder when caller is not an authorized recorder", async function () {
      await expect(
        contract.connect(unauthorized).recordReceipt(
          validReceiptId,
          agent.address,
          counterparty.address,
          1000n,
          1,
          validReasoningHash,
          validSummary
        )
      ).to.be.revertedWithCustomError(contract, "OnlyRecorder");
    });

    it("reverts with OnlyRecorder when owner attempts recordReceipt without being explicit recorder", async function () {
      await expect(
        contract.connect(owner).recordReceipt(
          validReceiptId,
          agent.address,
          counterparty.address,
          1000n,
          1,
          validReasoningHash,
          validSummary
        )
      ).to.be.revertedWithCustomError(contract, "OnlyRecorder");
    });
  });

  describe("8. Decision > 2 Rejection", function () {
    beforeEach(async function () {
      await contract.connect(owner).setRecorder(recorder.address, true);
    });

    it("reverts with InvalidDecisionCode when decision > 2", async function () {
      await expect(
        contract.connect(recorder).recordReceipt(
          validReceiptId,
          agent.address,
          counterparty.address,
          1000n,
          3, // Invalid decision code
          validReasoningHash,
          validSummary
        )
      ).to.be.revertedWithCustomError(contract, "InvalidDecisionCode");
    });

    it("accepts valid decision codes 0, 1, and 2", async function () {
      const id0 = ethers.id("receipt-0");
      const id1 = ethers.id("receipt-1");
      const id2 = ethers.id("receipt-2");

      await contract.connect(recorder).recordReceipt(id0, agent.address, counterparty.address, 0n, 0, validReasoningHash, "BLOCKED");
      await contract.connect(recorder).recordReceipt(id1, agent.address, counterparty.address, 0n, 1, validReasoningHash, "EXECUTED");
      await contract.connect(recorder).recordReceipt(id2, agent.address, counterparty.address, 0n, 2, validReasoningHash, "DECLINED_BY_AGENT");

      expect((await contract.getReceipt(id0)).decision).to.equal(0);
      expect((await contract.getReceipt(id1)).decision).to.equal(1);
      expect((await contract.getReceipt(id2)).decision).to.equal(2);
    });
  });

  describe("9. Zero receiptId Rejection", function () {
    beforeEach(async function () {
      await contract.connect(owner).setRecorder(recorder.address, true);
    });

    it("reverts with InvalidReceiptId when receiptId is bytes32(0)", async function () {
      await expect(
        contract.connect(recorder).recordReceipt(
          ethers.ZeroHash,
          agent.address,
          counterparty.address,
          1000n,
          1,
          validReasoningHash,
          validSummary
        )
      ).to.be.revertedWithCustomError(contract, "InvalidReceiptId");
    });
  });

  describe("10. Zero reasoningHash Rejection", function () {
    beforeEach(async function () {
      await contract.connect(owner).setRecorder(recorder.address, true);
    });

    it("reverts with InvalidReasoningHash when reasoningHash is bytes32(0)", async function () {
      await expect(
        contract.connect(recorder).recordReceipt(
          validReceiptId,
          agent.address,
          counterparty.address,
          1000n,
          1,
          ethers.ZeroHash,
          validSummary
        )
      ).to.be.revertedWithCustomError(contract, "InvalidReasoningHash");
    });
  });

  describe("11. getReceipt Fidelity & 12. getReceiptHash Fidelity", function () {
    beforeEach(async function () {
      await contract.connect(owner).setRecorder(recorder.address, true);
    });

    it("getReceipt returns the exact stored Receipt struct", async function () {
      const amount = ethers.parseEther("2.5");
      await contract.connect(recorder).recordReceipt(
        validReceiptId,
        agent.address,
        counterparty.address,
        amount,
        1,
        validReasoningHash,
        validSummary
      );

      const receipt = await contract.getReceipt(validReceiptId);
      expect(receipt.receiptId).to.equal(validReceiptId);
      expect(receipt.agent).to.equal(agent.address);
      expect(receipt.counterparty).to.equal(counterparty.address);
      expect(receipt.amount).to.equal(amount);
      expect(receipt.decision).to.equal(1);
      expect(receipt.reasoningHash).to.equal(validReasoningHash);
      expect(receipt.summary).to.equal(validSummary);
      expect(receipt.exists).to.be.true;
    });

    it("getReceiptHash returns exactly the stored reasoningHash", async function () {
      await contract.connect(recorder).recordReceipt(
        validReceiptId,
        agent.address,
        counterparty.address,
        1000n,
        0,
        validReasoningHash,
        validSummary
      );

      const hash = await contract.getReceiptHash(validReceiptId);
      expect(hash).to.equal(validReasoningHash);
    });

    it("getReceipt and getReceiptHash revert with ReceiptNotFound for non-existent receipt IDs", async function () {
      const nonExistentId = ethers.id("non-existent");

      await expect(
        contract.getReceipt(nonExistentId)
      ).to.be.revertedWithCustomError(contract, "ReceiptNotFound");

      await expect(
        contract.getReceiptHash(nonExistentId)
      ).to.be.revertedWithCustomError(contract, "ReceiptNotFound");
    });
  });

  describe("13. Zero Counterparty Storage & 14. Zero Amount Storage", function () {
    beforeEach(async function () {
      await contract.connect(owner).setRecorder(recorder.address, true);
    });

    it("stores address(0) counterparty and 0 amount without special errors", async function () {
      await contract.connect(recorder).recordReceipt(
        validReceiptId,
        agent.address,
        ethers.ZeroAddress,
        0n,
        0,
        validReasoningHash,
        "Blocked receipt with no counterparty or amount"
      );

      const receipt = await contract.getReceipt(validReceiptId);
      expect(receipt.counterparty).to.equal(ethers.ZeroAddress);
      expect(receipt.amount).to.equal(0n);
    });
  });
});
