const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile("../../backend/.env"); } catch (e) {}
}

async function main() {
  const deployerKey = (process.env.DEPLOYER_PRIVATE_KEY || "").trim();
  const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";

  if (!deployerKey) throw new Error("DEPLOYER_PRIVATE_KEY is required");

  const deploymentPath = path.resolve(__dirname, "../../shared/deployments/mst-testnet.json");
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const charterAddress = deploymentData.SpendingCharter || "0xbD4c07Adb44e8ff2030faBcf0c4543067bA95E69";
  const receiptsAddress = deploymentData.ReasoningReceipts || "0x9acDE9ACf72aE5AEc94430B357ce0531C0FFaae1";
  const expectedGoodAgent = deploymentData.goodAgent || "0x5D7C03A79570014e8cf335DCdBc9Fb87284Fdf4B";

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const deployerWallet = new ethers.Wallet(deployerKey, provider);

  const charterAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../shared/abi/SpendingCharter.json"), "utf8"));
  const receiptsAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../shared/abi/ReasoningReceipts.json"), "utf8"));

  const charter = new ethers.Contract(charterAddress, charterAbi, deployerWallet);
  const receipts = new ethers.Contract(receiptsAddress, receiptsAbi, provider);

  // PART A — READ CURRENT OWNER & RULES
  console.log("=== PART A: READ CURRENT STATE ===");
  const owner = await charter.owner();
  console.log(`Charter Address: ${charterAddress}`);
  console.log(`Charter Owner: ${owner}`);
  console.log(`Deployer Address: ${deployerWallet.address}`);

  if (owner.toLowerCase() !== deployerWallet.address.toLowerCase()) {
    throw new Error(`Deployer (${deployerWallet.address}) is NOT contract owner (${owner})! Stopping immediately.`);
  }

  const initialRules = await charter.getRules();
  console.log("Initial Rules:", {
    maxPerTx: ethers.formatEther(initialRules.maxPerTx),
    dailyCap: ethers.formatEther(initialRules.dailyCap),
    humanApprovalThreshold: ethers.formatEther(initialRules.humanApprovalThreshold),
    allowListEnabled: initialRules.allowListEnabled
  });

  const initialStatus = await charter.getStatus();
  console.log("Initial Status:", {
    windowStart: initialStatus.windowStart.toString(),
    spentInWindow: ethers.formatEther(initialStatus.spentInWindow),
    remainingInWindow: ethers.formatEther(initialStatus.remainingInWindow),
    balance: ethers.formatEther(initialStatus.balance)
  });

  // PART B — CONFIGURE EXISTING CHARTER
  console.log("\n=== PART B: CONFIGURE CHARTER RULES ===");
  const maxPerTx = ethers.parseEther("0.5");
  const dailyCap = ethers.parseEther("1.0");
  const humanApprovalThreshold = ethers.parseEther("0.5");
  const allowListEnabled = false;

  console.log("Calling setRules(0.5 MST, 1.0 MST, 0.5 MST, false)...");
  const setRulesTx = await charter.setRules(maxPerTx, dailyCap, humanApprovalThreshold, allowListEnabled);
  console.log(`setRules TX hash: ${setRulesTx.hash}`);

  const setRulesReceipt = await setRulesTx.wait(1);
  console.log(`setRules confirmed in block ${setRulesReceipt.blockNumber}`);

  const updatedRules = await charter.getRules();
  console.log("Updated Rules:", {
    maxPerTx: ethers.formatEther(updatedRules.maxPerTx),
    dailyCap: ethers.formatEther(updatedRules.dailyCap),
    humanApprovalThreshold: ethers.formatEther(updatedRules.humanApprovalThreshold),
    allowListEnabled: updatedRules.allowListEnabled
  });

  // PART C — FUND EXISTING CHARTER
  console.log("\n=== PART C: FUND SPENDING CHARTER ===");
  const fundAmount = ethers.parseEther("0.5");
  console.log("Sending 0.5 MST directly to SpendingCharter...");
  const fundTx = await deployerWallet.sendTransaction({
    to: charterAddress,
    value: fundAmount
  });
  console.log(`fund TX hash: ${fundTx.hash}`);

  const fundReceipt = await fundTx.wait(1);
  console.log(`fund TX confirmed in block ${fundReceipt.blockNumber}`);

  const updatedBalance = await provider.getBalance(charterAddress);
  console.log(`Charter native balance after funding: ${ethers.formatEther(updatedBalance)} MST`);

  // PART D — SAFETY VERIFICATION
  console.log("\n=== PART D: SAFETY VERIFICATION ===");
  const finalRules = await charter.getRules();
  const finalStatus = await charter.getStatus();
  const finalCharterBalance = await provider.getBalance(charterAddress);
  const finalAgent = await charter.agent();
  const finalRecorderStatus = await receipts.getRecorderStatus(expectedGoodAgent);
  const finalDeployerBal = await provider.getBalance(deployerWallet.address);

  console.log("FINAL VERIFICATION SUMMARY:");
  console.log(`- maxPerTx: ${ethers.formatEther(finalRules.maxPerTx)} MST (Expected: 0.5 MST)`);
  console.log(`- dailyCap: ${ethers.formatEther(finalRules.dailyCap)} MST (Expected: 1.0 MST)`);
  console.log(`- humanApprovalThreshold: ${ethers.formatEther(finalRules.humanApprovalThreshold)} MST (Expected: 0.5 MST)`);
  console.log(`- allowListEnabled: ${finalRules.allowListEnabled} (Expected: false)`);
  console.log(`- Charter Balance: ${ethers.formatEther(finalCharterBalance)} MST (Expected: 0.5 MST)`);
  console.log(`- Charter Agent: ${finalAgent} (Matches Good Agent: ${finalAgent.toLowerCase() === expectedGoodAgent.toLowerCase()})`);
  console.log(`- Good Agent M8 Recorder Status: ${finalRecorderStatus} (Expected: true)`);
  console.log(`- Deployer Remaining Balance: ${ethers.formatEther(finalDeployerBal)} MST`);
}

main().catch((err) => {
  console.error("Error during configure & fund:", err.message);
  process.exitCode = 1;
});
