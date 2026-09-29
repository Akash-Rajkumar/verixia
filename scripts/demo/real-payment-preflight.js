const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile("../../backend/.env"); } catch (e) {}
}

async function main() {
  const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const deploymentPath = path.resolve(__dirname, "../../shared/deployments/mst-testnet.json");
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const deployer = deploymentData.deployer || "0x8F90119B73B9EF8bC04d90b871F6db504b9EfFC0";
  const goodAgent = deploymentData.goodAgent || "0x5D7C03A79570014e8cf335DCdBc9Fb87284Fdf4B";
  const badAgent = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

  const charterAddress = deploymentData.SpendingCharter || "0xbD4c07Adb44e8ff2030faBcf0c4543067bA95E69";
  const registryAddress = deploymentData.ReputationRegistry || "0xcE3bfbfC140AdD1a6A7eD1b1Aa571d0314f3Fb95";
  const receiptsAddress = deploymentData.ReasoningReceipts || "0x9acDE9ACf72aE5AEc94430B357ce0531C0FFaae1";

  // 1. Read native MST balances
  const deployerBal = await provider.getBalance(deployer);
  const goodAgentBal = await provider.getBalance(goodAgent);
  const badAgentBal = await provider.getBalance(badAgent);
  const charterBal = await provider.getBalance(charterAddress);

  // 5. Bytecode existence
  const charterCode = await provider.getCode(charterAddress);
  const registryCode = await provider.getCode(registryAddress);
  const receiptsCode = await provider.getCode(receiptsAddress);

  // ABIs
  const charterAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../shared/abi/SpendingCharter.json"), "utf8"));
  const receiptsAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../shared/abi/ReasoningReceipts.json"), "utf8"));

  const charterContract = new ethers.Contract(charterAddress, charterAbi, provider);
  const receiptsContract = new ethers.Contract(receiptsAddress, receiptsAbi, provider);

  // 2. Read getRules()
  const rules = await charterContract.getRules();
  // 3. Read getStatus()
  const status = await charterContract.getStatus();
  // 4. Read ReasoningReceipts recorder status for Good Agent
  const isGoodAgentRecorder = await receiptsContract.getRecorderStatus(goodAgent);
  // 8. Agent address in SpendingCharter
  const charterAgent = await charterContract.agent();

  const maxPerTxWei = rules.maxPerTx;
  const dailyCapWei = rules.dailyCap;
  const humanApprovalThresholdWei = rules.humanApprovalThreshold;
  const allowListEnabled = rules.allowListEnabled;

  const windowStart = status.windowStart;
  const spentInWindowWei = status.spentInWindow;
  const remainingInWindowWei = status.remainingInWindow;

  // 9. Numerical policy check for 0.25 MST payment
  const payment025Wei = ethers.parseEther("0.25");
  const passesMaxPerTx = payment025Wei <= maxPerTxWei;
  const passesDailyCap = (spentInWindowWei + payment025Wei) <= dailyCapWei;
  const passesNumericalPolicy = passesMaxPerTx && passesDailyCap;

  console.log("================ PREFLIGHT SUMMARY ================");
  console.log("1. NATIVE MST BALANCES:");
  console.log(`   - Deployer (${deployer}): ${ethers.formatEther(deployerBal)} MST`);
  console.log(`   - Good Agent (${goodAgent}): ${ethers.formatEther(goodAgentBal)} MST`);
  console.log(`   - Bad Agent (${badAgent}): ${ethers.formatEther(badAgentBal)} MST`);
  console.log(`   - SpendingCharter (${charterAddress}): ${ethers.formatEther(charterBal)} MST`);
  console.log("\n2. SPENDING CHARTER LIVE RULES:");
  console.log(`   - maxPerTx: ${ethers.formatEther(maxPerTxWei)} MST (${maxPerTxWei.toString()} wei)`);
  console.log(`   - dailyCap: ${ethers.formatEther(dailyCapWei)} MST (${dailyCapWei.toString()} wei)`);
  console.log(`   - humanApprovalThreshold: ${ethers.formatEther(humanApprovalThresholdWei)} MST (${humanApprovalThresholdWei.toString()} wei)`);
  console.log(`   - allowListEnabled: ${allowListEnabled}`);
  console.log("\n3. SPENDING CHARTER LIVE STATUS:");
  console.log(`   - windowStart: ${windowStart.toString()} (${new Date(Number(windowStart) * 1000).toISOString()})`);
  console.log(`   - spentInWindow: ${ethers.formatEther(spentInWindowWei)} MST`);
  console.log(`   - remainingInWindow: ${ethers.formatEther(remainingInWindowWei)} MST`);
  console.log(`   - balance (on contract): ${ethers.formatEther(status.balance)} MST`);
  console.log("\n4. GOOD AGENT RECORDER STATUS:");
  console.log(`   - ReasoningReceipts recorder status for ${goodAgent}: ${isGoodAgentRecorder ? "AUTHORIZED (true)" : "UNAUTHORIZED (false)"}`);
  console.log("\n5. BYTECODE VERIFICATION:");
  console.log(`   - SpendingCharter (${charterAddress}): ${charterCode.length > 2 ? `EXISTS (${charterCode.length} bytes)` : "MISSING"}`);
  console.log(`   - ReputationRegistry (${registryAddress}): ${registryCode.length > 2 ? `EXISTS (${registryCode.length} bytes)` : "MISSING"}`);
  console.log(`   - ReasoningReceipts (${receiptsAddress}): ${receiptsCode.length > 2 ? `EXISTS (${receiptsCode.length} bytes)` : "MISSING"}`);
  console.log("\n8. CHARTER CONFIGURED AGENT ADDRESS:");
  console.log(`   - charter.agent(): ${charterAgent}`);
  console.log(`   - matches Good Agent address: ${charterAgent.toLowerCase() === goodAgent.toLowerCase() ? "YES" : "NO"}`);
  console.log("\n9. POLICY CHECK FOR 0.25 MST PAYMENT:");
  console.log(`   - 0.25 MST <= maxPerTx (${ethers.formatEther(maxPerTxWei)} MST): ${passesMaxPerTx ? "PASS" : "FAIL"}`);
  console.log(`   - (spentToday + 0.25 MST) <= dailyCap (${ethers.formatEther(dailyCapWei)} MST): ${passesDailyCap ? "PASS" : "FAIL"}`);
  console.log(`   - Overall 0.25 MST numerical policy pass: ${passesNumericalPolicy ? "PASS" : "FAIL"}`);
  console.log("===================================================");
}

main().catch((err) => {
  console.error("Preflight Error:", err.message);
  process.exitCode = 1;
});
