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
    throw new Error("GOOD_AGENT_PRIVATE_KEY missing");
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

  // Exact receiptId from confirmed payment TX 0x87bc83e88b7c6807c7b62e658c548c66d923f716b5ebad071a3a5ce503d7aff2
  const receiptId = "0x36ec27aa567746e912d9cfb8e3c2c6f8c0ddfd9456e095888ab48fb222078b43";
  const paymentTxHash = "0x87bc83e88b7c6807c7b62e658c548c66d923f716b5ebad071a3a5ce503d7aff2";
  const paymentBlockNumber = 5799957;

  const summary = "Good Agent approved a 0.25 MST payment after the Spending Charter policy check passed. The payment is below the configured 0.5 MST per-transaction limit and 1.0 MST daily cap.";

  const charterAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../shared/abi/SpendingCharter.json"), "utf8"));
  const receiptsAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../shared/abi/ReasoningReceipts.json"), "utf8"));

  const charter = new ethers.Contract(charterAddress, charterAbi, provider);
  const receipts = new ethers.Contract(receiptsAddress, receiptsAbi, provider);

  const rules = await charter.getRules();

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
  console.log(`- Exact Receipt ID: ${receiptId}`);
  console.log(`- Canonical Reasoning Hash: ${reasoningHash}`);

  // RECORD RECEIPT ON-CHAIN
  const adapter = createReasoningReceiptsAdapter({
    contractAddress: receiptsAddress,
    rpcUrl: rpcUrl
  }, {
    signer: goodAgentWallet
  });

  console.log("Submitting receipt for exact payment receiptId...");
  const recordResult = await adapter.submitReceipt({
    receiptId: receiptId,
    agent: goodAgentAddress,
    counterparty: counterparty,
    amountWei: paymentAmountWei,
    decisionCode: 0, // 0 = EXECUTED / APPROVED
    reasoningHash: reasoningHash,
    summary: summary
  });

  console.log(`- Receipt TX Hash: ${recordResult.txHash}`);
  const receiptTxReceipt = await provider.getTransactionReceipt(recordResult.txHash);
  console.log(`- Receipt TX Confirmed in Block: ${receiptTxReceipt.blockNumber}`);

  // VERIFY RECEIPT ON-CHAIN
  console.log("\n=== ON-CHAIN RECEIPT VERIFICATION ===");
  const onChainReceipt = await adapter.getReceipt(receiptId);
  const onChainHash = await adapter.getReceiptHash(receiptId);

  console.log("On-Chain Receipt:", onChainReceipt);
  console.log("On-Chain Hash:", onChainHash);

  if (!onChainReceipt.exists) throw new Error("Receipt does not exist!");
  if (onChainReceipt.receiptId !== receiptId) throw new Error("Receipt ID mismatch!");
  if (onChainReceipt.agent.toLowerCase() !== goodAgentAddress.toLowerCase()) throw new Error("Agent mismatch!");
  if (onChainReceipt.counterparty.toLowerCase() !== counterparty.toLowerCase()) throw new Error("Counterparty mismatch!");
  if (onChainReceipt.amount !== paymentAmountWei.toString()) throw new Error("Amount mismatch!");
  if (onChainReceipt.decision !== 0) throw new Error("Decision code mismatch!");
  if (onChainReceipt.reasoningHash.toLowerCase() !== reasoningHash.toLowerCase()) throw new Error("Reasoning hash mismatch!");
  if (onChainHash.toLowerCase() !== reasoningHash.toLowerCase()) throw new Error("getReceiptHash mismatch!");

  // VERIFY CHARTER STATE & BALANCES
  console.log("\n=== CHARTER & WALLET VERIFICATION ===");
  const charterStatus = await charter.getStatus();
  const charterBal = await provider.getBalance(charterAddress);
  const goodAgentBal = await provider.getBalance(goodAgentAddress);
  const recipientBal = await provider.getBalance(counterparty);

  console.log(`- Charter Current Balance: ${ethers.formatEther(charterBal)} MST (Expected: ~0.25 MST)`);
  console.log(`- Charter spentInWindow: ${ethers.formatEther(charterStatus.spentInWindow)} MST (Expected: 0.25 MST)`);
  console.log(`- Charter remainingInWindow: ${ethers.formatEther(charterStatus.remainingInWindow)} MST`);
  console.log(`- Good Agent Balance: ${ethers.formatEther(goodAgentBal)} MST`);
  console.log(`- Recipient Balance: ${ethers.formatEther(recipientBal)} MST (Expected: 0.25 MST)`);

  console.log("\n================ ALL CHECKS PASSED ================");
  console.log(`Payment TX Hash: ${paymentTxHash}`);
  console.log(`Payment Block: ${paymentBlockNumber}`);
  console.log(`Receipt TX Hash: ${recordResult.txHash}`);
  console.log(`Receipt Block: ${receiptTxReceipt.blockNumber}`);
}

main().catch((err) => {
  console.error("Verification failed:", err.message);
  process.exitCode = 1;
});
