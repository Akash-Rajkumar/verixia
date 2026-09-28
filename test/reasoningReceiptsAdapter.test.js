const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  ReasoningReceiptsAdapter,
  createReasoningReceiptsAdapter,
  normalizeReceiptId
} = require("../backend/src/agent/adapters/ReasoningReceiptsAdapter");
const { ValidationError, ChainError } = require("../backend/src/agent/errors");

describe("ReasoningReceiptsAdapter", function () {
  let owner, recorder, agent, counterparty, unauthorized;
  let contract;
  let adapter;

  const sampleReceiptId = "turn-receipt-uuid-1234-5678";
  const validReasoningHash = "0x" + "a".repeat(64);
  const sampleSummary = "Agent decided to execute payment";

  beforeEach(async function () {
    [owner, recorder, agent, counterparty, unauthorized] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ReasoningReceipts");
    contract = await Factory.deploy(owner.address);
    await contract.waitForDeployment();

    // Enable recorder signer
    await contract.connect(owner).setRecorder(recorder.address, true);

    adapter = createReasoningReceiptsAdapter(
      { contractAddress: await contract.getAddress() },
      { contract: contract.connect(recorder), signer: recorder }
    );
  });

  describe("1. Receipt ID Conversion & Determinism", function () {
    it("deterministically converts string/UUID receiptId to bytes32", function () {
      const hash1 = normalizeReceiptId(sampleReceiptId);
      const hash2 = normalizeReceiptId(sampleReceiptId);

      expect(hash1).to.be.a("string");
      expect(hash1).to.match(/^0x[0-9a-fA-F]{64}$/);
      expect(hash1).to.equal(hash2);
      expect(hash1).to.equal(ethers.id(sampleReceiptId));
    });

    it("rejects empty or non-string receiptId", function () {
      expect(() => normalizeReceiptId("")).to.throw(ValidationError, "receiptId must be a non-empty string");
      expect(() => normalizeReceiptId("   ")).to.throw(ValidationError, "receiptId must be a non-empty string");
      expect(() => normalizeReceiptId(null)).to.throw(ValidationError, "receiptId must be a non-empty string");
    });
  });

  describe("2. Input Validation", function () {
    describe("Address Validation", function () {
      it("rejects invalid agent address", async function () {
        await expect(
          adapter.submitReceipt({
            receiptId: sampleReceiptId,
            agent: "invalid-agent",
            counterparty: counterparty.address,
            amountWei: "1000",
            decisionCode: 1,
            reasoningHash: validReasoningHash,
            summary: sampleSummary
          })
        ).to.be.rejectedWith(ValidationError, "Invalid Ethereum address for agent");
      });

      it("rejects invalid counterparty address when provided", async function () {
        await expect(
          adapter.submitReceipt({
            receiptId: sampleReceiptId,
            agent: agent.address,
            counterparty: "not-an-address",
            amountWei: "1000",
            decisionCode: 1,
            reasoningHash: validReasoningHash,
            summary: sampleSummary
          })
        ).to.be.rejectedWith(ValidationError, "Invalid Ethereum address for counterparty");
      });
    });

    describe("Amount Validation", function () {
      it("rejects JS number amountWei", async function () {
        await expect(
          adapter.submitReceipt({
            receiptId: sampleReceiptId,
            agent: agent.address,
            counterparty: counterparty.address,
            amountWei: 1000,
            decisionCode: 1,
            reasoningHash: validReasoningHash,
            summary: sampleSummary
          })
        ).to.be.rejectedWith(ValidationError, "JavaScript numbers are rejected");
      });

      it("rejects negative amount strings and negative BigInts", async function () {
        await expect(
          adapter.submitReceipt({
            receiptId: sampleReceiptId,
            agent: agent.address,
            counterparty: counterparty.address,
            amountWei: "-100",
            decisionCode: 1,
            reasoningHash: validReasoningHash,
            summary: sampleSummary
          })
        ).to.be.rejectedWith(ValidationError, "Invalid amountWei string");

        await expect(
          adapter.submitReceipt({
            receiptId: sampleReceiptId,
            agent: agent.address,
            counterparty: counterparty.address,
            amountWei: -100n,
            decisionCode: 1,
            reasoningHash: validReasoningHash,
            summary: sampleSummary
          })
        ).to.be.rejectedWith(ValidationError, "amountWei cannot be negative");
      });

      it("rejects float / non-digit decimal strings", async function () {
        await expect(
          adapter.submitReceipt({
            receiptId: sampleReceiptId,
            agent: agent.address,
            counterparty: counterparty.address,
            amountWei: "10.5",
            decisionCode: 1,
            reasoningHash: validReasoningHash,
            summary: sampleSummary
          })
        ).to.be.rejectedWith(ValidationError, "Invalid amountWei string");
      });

      it("accepts valid decimal string and BigInt amounts", async function () {
        const result = await adapter.submitReceipt({
          receiptId: sampleReceiptId,
          agent: agent.address,
          counterparty: counterparty.address,
          amountWei: "500000000000000000",
          decisionCode: 1,
          reasoningHash: validReasoningHash,
          summary: sampleSummary
        });

        expect(result.receiptId).to.equal(sampleReceiptId);
        expect(result.txHash).to.be.a("string");
      });
    });

    describe("Decision Validation", function () {
      it("rejects decision codes other than 0, 1, or 2", async function () {
        await expect(
          adapter.submitReceipt({
            receiptId: sampleReceiptId,
            agent: agent.address,
            counterparty: counterparty.address,
            amountWei: "1000",
            decisionCode: 3,
            reasoningHash: validReasoningHash,
            summary: sampleSummary
          })
        ).to.be.rejectedWith(ValidationError, "Invalid decisionCode");
      });
    });

    describe("ReasoningHash Validation", function () {
      it("rejects non-bytes32 reasoningHash", async function () {
        await expect(
          adapter.submitReceipt({
            receiptId: sampleReceiptId,
            agent: agent.address,
            counterparty: counterparty.address,
            amountWei: "1000",
            decisionCode: 1,
            reasoningHash: "not-bytes32",
            summary: sampleSummary
          })
        ).to.be.rejectedWith(ValidationError, "Invalid bytes32 reasoningHash");
      });

      it("rejects zero bytes32 reasoningHash", async function () {
        await expect(
          adapter.submitReceipt({
            receiptId: sampleReceiptId,
            agent: agent.address,
            counterparty: counterparty.address,
            amountWei: "1000",
            decisionCode: 1,
            reasoningHash: ethers.ZeroHash,
            summary: sampleSummary
          })
        ).to.be.rejectedWith(ValidationError, "reasoningHash cannot be non-zero bytes32(0)");
      });
    });
  });

  describe("3. Missing Value Mapping", function () {
    it("maps missing counterparty to ZeroAddress and missing amount to 0", async function () {
      const receiptId = "receipt-missing-fields-1";
      const res = await adapter.submitReceipt({
        receiptId,
        agent: agent.address,
        decisionCode: 0,
        reasoningHash: validReasoningHash,
        summary: "Blocked turn without counterparty or amount"
      });

      expect(res.receiptId).to.equal(receiptId);

      const stored = await adapter.getReceipt(receiptId);
      expect(stored.counterparty).to.equal(ethers.ZeroAddress);
      expect(stored.amount).to.equal("0");
    });
  });

  describe("4. Transaction Handling & Argument Mapping", function () {
    it("calls recordReceipt with mapped arguments, waits for 1 confirmation, and returns txHash and original receiptId", async function () {
      const receiptId = "receipt-tx-handling-test";
      const amountWei = "1000000000000000000";

      const res = await adapter.submitReceipt({
        receiptId,
        agent: agent.address,
        counterparty: counterparty.address,
        amountWei,
        decisionCode: 1,
        reasoningHash: validReasoningHash,
        summary: sampleSummary
      });

      expect(res.receiptId).to.equal(receiptId);
      expect(res.txHash).to.be.a("string");
      expect(res.txHash).to.match(/^0x[0-9a-fA-F]{64}$/);

      // Verify confirmed on-chain
      const stored = await adapter.getReceipt(receiptId);
      expect(stored.agent).to.equal(agent.address);
      expect(stored.counterparty).to.equal(counterparty.address);
      expect(stored.amount).to.equal(amountWei);
      expect(stored.decision).to.equal(1);
      expect(stored.reasoningHash).to.equal(validReasoningHash);
      expect(stored.summary).to.equal(sampleSummary);
    });

    it("surfaces unauthorized recorder revert as ChainError", async function () {
      const unauthAdapter = createReasoningReceiptsAdapter(
        { contractAddress: await contract.getAddress() },
        { contract: contract.connect(unauthorized), signer: unauthorized }
      );

      await expect(
        unauthAdapter.submitReceipt({
          receiptId: "unauth-receipt-1",
          agent: agent.address,
          counterparty: counterparty.address,
          amountWei: "1000",
          decisionCode: 1,
          reasoningHash: validReasoningHash,
          summary: sampleSummary
        })
      ).to.be.rejectedWith(ChainError, "Caller is not an authorized recorder");
    });

    it("surfaces duplicate receiptId revert as ChainError", async function () {
      const duplicateId = "duplicate-receipt-id-test";

      await adapter.submitReceipt({
        receiptId: duplicateId,
        agent: agent.address,
        counterparty: counterparty.address,
        amountWei: "1000",
        decisionCode: 1,
        reasoningHash: validReasoningHash,
        summary: sampleSummary
      });

      await expect(
        adapter.submitReceipt({
          receiptId: duplicateId,
          agent: agent.address,
          counterparty: counterparty.address,
          amountWei: "1000",
          decisionCode: 1,
          reasoningHash: validReasoningHash,
          summary: sampleSummary
        })
      ).to.be.rejectedWith(ChainError, "Duplicate receipt ID");
    });
  });

  describe("5. End-to-End Adapter <-> Contract Integration", function () {
    it("consistently queries adapter-generated bytes32 receipt ID and reasoningHash from contract", async function () {
      const receiptId = "integration-receipt-uuid-9999";
      const expectedBytes32 = ethers.id(receiptId);

      const submitRes = await adapter.submitReceipt({
        receiptId,
        agent: agent.address,
        counterparty: counterparty.address,
        amountWei: "250000",
        decisionCode: 2, // DECLINED_BY_AGENT
        reasoningHash: validReasoningHash,
        summary: "Declined by agent policy"
      });

      expect(submitRes.receiptId).to.equal(receiptId);

      // 1. Query using adapter's string receiptId
      const storedByAdapter = await adapter.getReceipt(receiptId);
      expect(storedByAdapter.receiptId).to.equal(expectedBytes32);
      expect(storedByAdapter.decision).to.equal(2);
      expect(storedByAdapter.reasoningHash).to.equal(validReasoningHash);

      // 2. Query contract directly using generated bytes32 receipt ID
      const directContractReceipt = await contract.getReceipt(expectedBytes32);
      expect(directContractReceipt.receiptId).to.equal(expectedBytes32);
      expect(directContractReceipt.agent).to.equal(agent.address);
      expect(directContractReceipt.counterparty).to.equal(counterparty.address);
      expect(directContractReceipt.amount).to.equal(250000n);
      expect(directContractReceipt.decision).to.equal(2);
      expect(directContractReceipt.summary).to.equal("Declined by agent policy");

      // 3. Query contract directly getReceiptHash
      const directHash = await contract.getReceiptHash(expectedBytes32);
      expect(directHash).to.equal(validReasoningHash);

      // 4. Query adapter getReceiptHash using string receiptId
      const adapterHash = await adapter.getReceiptHash(receiptId);
      expect(adapterHash).to.equal(validReasoningHash);
    });
  });
});
