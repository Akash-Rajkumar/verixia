const { expect } = require("chai");
const { ethers } = require("hardhat");
const { SpendingCharterAdapter, createSpendingCharterAdapter } = require("../backend/src/agent/adapters/SpendingCharterAdapter");
const { ValidationError, ChainError } = require("../backend/src/agent/errors");
const { processTurn } = require("../backend/src/agent/GoodAgentPipeline");

describe("SpendingCharterAdapter Integration", function () {
  let owner, agent, counterparty, unlistedCounterparty, unauthorizedSigner;
  let contract;
  let adapter;
  const validReceiptId = "0x" + "1".repeat(64); // Valid bytes32 hex string

  beforeEach(async function () {
    [owner, agent, counterparty, unlistedCounterparty, unauthorizedSigner] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SpendingCharter");
    contract = await Factory.deploy(owner.address, agent.address);
    await contract.waitForDeployment();

    // Fund the contract with ETH
    await owner.sendTransaction({
      to: await contract.getAddress(),
      value: ethers.parseEther("10.0")
    });

    // Default rules: maxPerTx = 0.5 ETH, dailyCap = 1.5 ETH, humanApprovalThreshold = 10 ETH, allowList = true
    await contract.connect(owner).setRules(
      ethers.parseEther("0.5"),
      ethers.parseEther("1.5"),
      ethers.parseEther("10.0"),
      true
    );

    // Set counterparty as allowed (status = 0)
    await contract.connect(owner).setCounterpartyStatus(counterparty.address, 0);

    adapter = createSpendingCharterAdapter(
      { contractAddress: await contract.getAddress() },
      { contract: contract.connect(agent), signer: agent }
    );
  });

  describe("A. Validation Rules", function () {
    it("rejects invalid Ethereum address", async function () {
      try {
        await adapter.checkPayment("invalid_address", "1000");
        expect.fail("Should have thrown ValidationError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ValidationError);
        expect(err.message).to.include("Invalid Ethereum address");
      }
    });

    it("rejects JavaScript numbers for amountWei", async function () {
      try {
        await adapter.checkPayment(counterparty.address, 1000);
        expect.fail("Should have thrown ValidationError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ValidationError);
        expect(err.message).to.include("JavaScript numbers are rejected");
      }
    });

    it("rejects negative amount strings", async function () {
      try {
        await adapter.checkPayment(counterparty.address, "-100");
        expect.fail("Should have thrown ValidationError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ValidationError);
      }
    });

    it("rejects decimal amount strings", async function () {
      try {
        await adapter.checkPayment(counterparty.address, "10.5");
        expect.fail("Should have thrown ValidationError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ValidationError);
      }
    });

    it("rejects non-numeric and hex amount strings", async function () {
      try {
        await adapter.checkPayment(counterparty.address, "0x10");
        expect.fail("Should have thrown ValidationError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ValidationError);
      }
    });

    it("rejects invalid receiptId strings and arbitrary UUIDs", async function () {
      try {
        await adapter.attemptPayment(counterparty.address, "1000", "not-a-valid-bytes32-hex");
        expect.fail("Should have thrown ValidationError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ValidationError);
        expect(err.message).to.include("Invalid bytes32 receiptId");
      }
    });
  });

  describe("B. checkPayment Reason Code Mapping", function () {
    it("returns reasonCode 1 (EXCEEDS_MAX_PER_TX) when amount exceeds maxPerTx", async function () {
      const result = await adapter.checkPayment(counterparty.address, ethers.parseEther("0.6").toString());
      expect(result).to.deep.equal({ allowed: false, reasonCode: 1 });
    });

    it("returns reasonCode 2 (EXCEEDS_DAILY_CAP) when amount exceeds dailyCap", async function () {
      // Set maxPerTx high (2.0 ETH) so dailyCap (1.5 ETH) is triggered first when requesting 1.6 ETH
      await contract.connect(owner).setRules(
        ethers.parseEther("2.0"),
        ethers.parseEther("1.5"),
        ethers.parseEther("10.0"),
        true
      );

      const result = await adapter.checkPayment(counterparty.address, ethers.parseEther("1.6").toString());
      expect(result).to.deep.equal({ allowed: false, reasonCode: 2 });
    });

    it("returns reasonCode 3 (COUNTERPARTY_DENIED) when counterparty is explicitly denied", async function () {
      const deniedUser = unlistedCounterparty.address;
      await contract.connect(owner).setCounterpartyStatus(deniedUser, 1); // 1 = denied

      const result = await adapter.checkPayment(deniedUser, ethers.parseEther("0.1").toString());
      expect(result).to.deep.equal({ allowed: false, reasonCode: 3 });
    });

    it("returns reasonCode 4 (COUNTERPARTY_NOT_ALLOWED) when allowList is enabled and counterparty is unlisted", async function () {
      const result = await adapter.checkPayment(unlistedCounterparty.address, ethers.parseEther("0.1").toString());
      expect(result).to.deep.equal({ allowed: false, reasonCode: 4 });
    });
  });

  describe("C. Human Approval Boundary", function () {
    it("surfaces HumanApprovalSemanticsUnspecified contract revert as ChainError with reasonCode 5", async function () {
      // Payment of 0.1 ETH passes checks 1-4 and hits line 212 (HumanApprovalSemanticsUnspecified)
      try {
        await adapter.checkPayment(counterparty.address, ethers.parseEther("0.1").toString());
        expect.fail("Should have thrown ChainError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ChainError);
        expect(err.details).to.exist;
        expect(err.details.reasonCode).to.equal(5);
        expect(err.details.contractError).to.equal("HumanApprovalSemanticsUnspecified");
      }
    });
  });

  describe("D. attemptPayment Execution & Events", function () {
    it("returns executed=false and correct reasonCode when payment is blocked on-chain", async function () {
      const amountStr = ethers.parseEther("0.8").toString(); // Exceeds maxPerTx of 0.5 ETH

      const result = await adapter.attemptPayment(counterparty.address, amountStr, validReceiptId);

      expect(result.executed).to.be.false;
      expect(result.reasonCode).to.equal(1); // EXCEEDS_MAX_PER_TX
      expect(result.txHash).to.be.a("string");
    });

    it("surfaces HumanApprovalSemanticsUnspecified as ChainError with reasonCode 5 during attemptPayment", async function () {
      // Payment of 0.1 ETH passes checks 1-4 and hits HumanApprovalSemanticsUnspecified revert
      try {
        await adapter.attemptPayment(counterparty.address, ethers.parseEther("0.1").toString(), validReceiptId);
        expect.fail("Should have thrown ChainError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ChainError);
        expect(err.details).to.exist;
        expect(err.details.reasonCode).to.equal(5);
        expect(err.details.contractError).to.equal("HumanApprovalSemanticsUnspecified");
      }
    });

    it("surfaces OnlyAgent revert as ChainError when caller is unauthorized", async function () {
      const badAdapter = createSpendingCharterAdapter(
        {},
        { contract: contract.connect(unauthorizedSigner), signer: unauthorizedSigner }
      );

      try {
        await badAdapter.attemptPayment(counterparty.address, ethers.parseEther("0.1").toString(), validReceiptId);
        expect.fail("Should have thrown ChainError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ChainError);
        expect(err.message).to.include("Caller is not the authorized agent");
      }
    });
  });

  describe("E. Event Integrity", function () {
    it("throws ChainError if transaction confirmed but neither PaymentExecuted nor PaymentBlocked event was present", async function () {
      const mockContract = {
        runner: { sendTransaction: async () => {} },
        interface: { parseLog: () => null },
        attemptPayment: async () => ({
          hash: "0xMockTxHash",
          wait: async () => ({ logs: [] })
        })
      };

      const mockAdapter = createSpendingCharterAdapter({}, { contract: mockContract, signer: agent });

      try {
        await mockAdapter.attemptPayment(counterparty.address, "1000", validReceiptId);
        expect.fail("Should have thrown ChainError");
      } catch (err) {
        expect(err).to.be.an.instanceOf(ChainError);
        expect(err.message).to.include("neither PaymentExecuted nor PaymentBlocked event was emitted");
      }
    });
  });

  describe("F. GoodAgentPipeline Integration Compatibility", function () {
    it("integrates seamlessly with processTurn in GoodAgentPipeline when charter blocks", async function () {
      const event = {
        id: "turn-integration-1",
        sender: agent.address,
        content: "Transfer 0.8 ETH to counterparty",
        counterparty: counterparty.address,
        amountWei: ethers.parseEther("0.8").toString() // Exceeds maxPerTx of 0.5 ETH
      };

      const validReceiptIdHex = "0x" + "2".repeat(64);

      const pipelineAdapters = {
        model: {
          generate: async () => ({
            text: JSON.stringify({ decision: "PAYMENT_INTENT", summary: "Approved payment" }),
            provider: "gemini",
            model: "gemini-2.5-flash",
            fallbackUsed: false
          })
        },
        charter: adapter,
        receipt: {
          submitReceipt: async () => ({ receiptId: validReceiptIdHex, txHash: "0xReceiptTx" })
        },
        attemptStore: {
          createAttempt: async () => ({ attemptId: validReceiptIdHex }),
          updateAttemptStatus: async () => {}
        }
      };

      const turnResult = await processTurn(event, pipelineAdapters);

      expect(turnResult.decision).to.equal("BLOCKED");
      expect(turnResult.charterReasonCode).to.equal(1); // EXCEEDS_MAX_PER_TX
    });
  });
});
