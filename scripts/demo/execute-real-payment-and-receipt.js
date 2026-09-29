const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { hashCanonical } = require("../../shared/canonicalJson");
const { createReasoningReceiptsAdapter } = require("../../backend/src/agent/adapters/ReasoningReceiptsAdapter");

if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile("../../backend/.env"); } catch (e) {}
}

async function main() {
  const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";
  const goodAgentKey = (process.env.GOOD_AGENT_PRIVATE_KEY || "").trim();

  if (!goodAgentKey) {
    throw new Error("GOOD_AGENT_PRIVATE_KEY missing from backend/.env");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const goodAgentWallet = new ethers.Wallet(goodAgentKey, provider);
  const goodAgentAddress = goodAgentWallet.address;

  const deploymentPath = path.resolve(__dirname, "../../shared/deployments/mst-testnet.json");
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const charterAddress = deploymentData.SpendingCharter || "0xbD4c07Adb44e8ff2030faBcf0c4543067bA95E69";
  const receiptsAddress = deploymentData.ReasoningReceipts || "0x9acDE9ACf72aE5AEc94430B357ce0531C0FFaae1";
  const counterparty = "0x9999999999999999999999999999999999999999";
  const paymentAmountWei = ethers.parseEther("0.25");

  const charterAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../shared/abi/SpendingCharter.json"), "utf8"));
  const receiptsAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../shared/abi/ReasoningReceipts.json"), "utf8"));

  const charter = new ethers.Contract(charterAddress, charterAbi, goodAgentWallet);
  const receipts = new ethers.Contract(receiptsAddress, receiptsAbi, provider);

  // STEP 1 — PREFLIGHT
  console.log("=== STEP 1: PREFLIGHT VERIFICATION ===");
  if (goodAgentAddress.toLowerCase() !== "0x5d7c03a79570014e8cf335dcdbc9fb87284fdf4b") {
    throw new Error(`Derived Good Agent address (${goodAgentAddress}) does not match expected 0x5D7C03A79570014e8cf335DCdBc9Fb87284Fdf4B`);
  }

  const charterBalBefore = await provider.getBalance(charterAddress);
  const rules = await charter.getRules();
  const configuredAgent = await charter.agent();
  const isRecorder = await receipts.getRecorderStatus(goodAgentAddress);
  const receiptsBytecode = await provider.getCode(receiptsAddress);

  console.log(`- Charter native balance: ${ethers.formatEther(charterBalBefore)} MST`);
  console.log(`- maxPerTx: ${ethers.formatEther(rules.maxPerTx)} MST`);
  console.log(`- dailyCap: ${ethers.formatEther(rules.dailyCap)} MST`);
  console.log(`- charter.agent(): ${configuredAgent}`);
  console.log(`- Good Agent is recorder: ${isRecorder}`);
  console.log(`- Receipts bytecode exists: ${receiptsBytecode.length > 2}`);

  if (charterBalBefore < paymentAmountWei) throw new Error("Charter balance < 0.25 MST");
  if (rules.maxPerTx < paymentAmountWei) throw new Error("maxPerTx < 0.25 MST");
  if (rules.dailyCap < paymentAmountWei) throw new Error("dailyCap < 0.25 MST");
  if (configuredAgent.toLowerCase() !== goodAgentAddress.toLowerCase()) throw new Error("charter.agent() != Good Agent");
  if (!isRecorder) throw new Error("Good Agent is not authorized ReasoningReceipts recorder");
  if (receiptsBytecode.length <= 2) throw new Error("ReasoningReceipts bytecode missing");

  // STEP 2 — CREATE CANONICAL PAYMENT CONTEXT
  console.log("\n=== STEP 2: CANONICAL PAYMENT CONTEXT ===");
  const rawReceiptIdString = `verixia-payment-0.25-mst-${Date.now()}`;
  const receiptId = ethers.id(rawReceiptIdString);
  const summary = "Good Agent approved a 0.25 MST payment after the Spending Charter policy check passed. The payment is below the configured 0.5 MST per-transaction limit and 1.0 MST daily cap.";

  const reasoningPayload = {
    amount: paymentAmountWei.toString(),
    counterparty: counterparty,
    decision: "EXECUTED",
    rules: {
      allowListEnabled: rules.allowListEnabled,
      dailyCap: rules.dailyCap.toString(),
      humanApprovalThreshold: rules.humanApprovalThreshold.toString(),
      maxPerTx: rules.maxPerTx.toString()
    },
    summary: summary
  };

  const reasoningHash = hashCanonical(reasoningPayload);
  console.log(`- Raw Receipt String: ${rawReceiptIdString}`);
  console.log(`- bytes32 receiptId: ${receiptId}`);
  console.log(`- Canonical reasoningHash: ${reasoningHash}`);

  // STEP 3 — CHECK CHARTER
  console.log("\n=== STEP 3: CHECK CHARTER PAYMENT ===");
  const [checkOk, reasonCode] = await charter.checkPayment(counterparty, paymentAmountWei);
  console.log(`- checkPayment result: ok=${checkOk}, reasonCode=${reasonCode}`);
  if (!checkOk) {
    throw new Error(`checkPayment failed with reasonCode ${reasonCode}`);
  }

  // STEP 4 — EXECUTE REAL PAYMENT
  console.log("\n=== STEP 4: EXECUTE REAL PAYMENT ===");
  const goodAgentBalBefore = await provider.getBalance(goodAgentAddress);
  const recipientBalBefore = await provider.getBalance(counterparty);

  console.log(`Sending attemptPayment(${counterparty}, 0.25 MST, receiptId)...`);
  const paymentTx = await charter.attemptPayment(counterparty, paymentAmountWei, receiptId);
  console.log(`- Payment TX Hash: ${paymentTx.hash}`);

  const paymentReceipt = await paymentTx.wait(1);
  console.log(`- Payment confirmed in block ${paymentReceipt.blockNumber}`);

  let paymentExecutedEventFound = false;
  for (const log of paymentReceipt.logs) {
    try {
      const parsed = charter.interface.parseLog(log);
      if (parsed && parsed.name === "PaymentExecuted") {
        paymentExecutedEventFound = true;
        console.log("  [EVENT LOG] PaymentExecuted emitted:", {
          receiptId: parsed.args.receiptId,
          to: parsed.args.to,
          amount: ethers.formatEther(parsed.args.amount) + " MST",
          spentInWindow: ethers.formatEther(parsed.args.spentInWindow) + " MST"
        });
        if (parsed.args.receiptId !== receiptId) throw new Error("Event receiptId mismatch");
        if (parsed.args.to.toLowerCase() !== counterparty.toLowerCase()) throw new Error("Event to mismatch");
        if (parsed.args.amount !== paymentAmountWei) throw new Error("Event amount mismatch");
      }
    } catch (e) {
      if (e.message.includes("mismatch")) throw e;
    }
  }

  if (!paymentExecutedEventFound) {
    throw new Error("PaymentExecuted event was NOT emitted in transaction receipt!");
  }

  // STEP 5 — RECORD M8 REASONING RECEIPT
  console.log("\n=== STEP 5: RECORD M8 REASONING RECEIPT ===");
  const adapter = createReasoningReceiptsAdapter({
    contractAddress: receiptsAddress,
    rpcUrl: rpcUrl
  }, {
    signer: goodAgentWallet
  });

  const recordResult = await adapter.submitReceipt({
    receiptId: receiptId,
    agent: goodAgentAddress,
    counterparty: counterparty,
    amountWei: paymentAmountWei,
    decisionCode: 0, // 0 = EXECUTED / APPROVED
    reasoningHash: reasoningHash,
    summary: summary
  });

  console.log(`- Reasoning receipt recorded. TX Hash: ${recordResult.txHash}`);

  const receiptTxReceipt = await provider.getTransactionReceipt(recordResult.txHash);
  console.log(`- Receipt recorded in block ${receiptTxReceipt.blockNumber}`);

  // STEP 6 — VERIFY RECEIPT ON-CHAIN
  console.log("\n=== STEP 6: VERIFY RECEIPT ON-CHAIN ===");
  const onChainReceipt = await adapter.getReceipt(receiptId);
  const onChainHash = await adapter.getReceiptHash(receiptId);

  console.log("On-Chain Receipt Data:", onChainReceipt);
  console.log("On-Chain Hash:", onChainHash);

  if (!onChainReceipt.exists) throw new Error("Receipt exists is false");
  if (onChainReceipt.receiptId !== receiptId) throw new Error("Receipt ID mismatch");
  if (onChainReceipt.agent.toLowerCase() !== goodAgentAddress.toLowerCase()) throw new Error("Agent address mismatch");
  if (onChainReceipt.counterparty.toLowerCase() !== counterparty.toLowerCase()) throw new Error("Counterparty mismatch");
  if (onChainReceipt.amount !== paymentAmountWei.toString()) throw new Error("Amount mismatch");
  if (onChainReceipt.decision !== 0) throw new Error("Decision mismatch");
  if (onChainReceipt.reasoningHash.toLowerCase() !== reasoningHash.toLowerCase()) throw new Error("Reasoning hash mismatch");
  if (onChainHash.toLowerCase() !== reasoningHash.toLowerCase()) throw new Error("getReceiptHash mismatch");

  // STEP 7 & 8 — CHARTER & WALLET BALANCES VERIFICATION
  console.log("\n=== STEP 7 & 8: CHARTER & WALLET BALANCES ===");
  const charterBalAfter = await provider.getBalance(charterAddress);
  const statusAfter = await charter.getStatus();
  const goodAgentBalAfter = await provider.getBalance(goodAgentAddress);
  const recipientBalAfter = await provider.getBalance(counterparty);

  console.log(`Charter Balance Before: ${ethers.formatEther(charterBalBefore)} MST`);
  console.log(`Charter Balance After:  ${ethers.formatEther(charterBalAfter)} MST`);
  console.log(`Charter spentInWindow:  ${ethers.formatEther(statusAfter.spentInWindow)} MST`);
  console.log(`Charter remaining:      ${ethers.formatEther(statusAfter.remainingInWindow)} MST`);

  console.log(`Good Agent Balance Before: ${ethers.formatEther(goodAgentBalBefore)} MST`);
  console.log(`Good Agent Balance After:  ${ethers.formatEther(goodAgentBalAfter)} MST`);
  console.log(`Recipient Balance Before:  ${ethers.formatEther(recipientBalBefore)} MST`);
  console.log(`Recipient Balance After:   ${ethers.formatEther(recipientBalAfter)} MST`);

  if (recipientBalAfter - recipientBalBefore !== paymentAmountWei) {
    throw new Error(`Recipient did not receive exactly 0.25 MST! Received: ${ethers.formatEther(recipientBalAfter - recipientBalBefore)} MST`);
  }

  console.log("\n================ ALL CHECKS PASSED ================");
  console.log(`Payment TX Hash: ${paymentTx.hash}`);
  console.log(`Receipt TX Hash: ${recordResult.txHash}`);
}

main().catch((err) => {
  console.error("Execution failed:", err.message);
  process.exitCode = 1;
});
