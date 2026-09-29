const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile("../../backend/.env"); } catch (e) {}
}

async function main() {
  const deployerKey = (process.env.DEPLOYER_PRIVATE_KEY || "").trim();
  const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";

  if (!deployerKey) throw new Error("DEPLOYER_PRIVATE_KEY missing");

  const deploymentPath = path.resolve(__dirname, "../../shared/deployments/mst-testnet.json");
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const receiptsAddress = deploymentData.ReasoningReceipts;
  const expectedGoodAgent = deploymentData.goodAgent || "0x5D7C03A79570014e8cf335DCdBc9Fb87284Fdf4B";

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const deployerWallet = new ethers.Wallet(deployerKey, provider);

  const abi = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../shared/abi/ReasoningReceipts.json"), "utf8"));
  const contract = new ethers.Contract(receiptsAddress, abi, deployerWallet);

  const owner = await contract.owner();
  console.log(`ReasoningReceipts: ${receiptsAddress}`);
  console.log(`Owner: ${owner}`);
  console.log(`Deployer Wallet: ${deployerWallet.address}`);
  
  if (owner.toLowerCase() !== deployerWallet.address.toLowerCase()) {
    throw new Error("Deployer is not contract owner!");
  }

  const initialStatus = await contract.getRecorderStatus(expectedGoodAgent);
  console.log(`Initial Good Agent recorder status: ${initialStatus}`);

  if (initialStatus) {
    console.log(`Good Agent is ALREADY a recorder. No transaction needed.`);
    return;
  }

  console.log(`Sending setRecorder(${expectedGoodAgent}, true)...`);
  const tx = await contract.setRecorder(expectedGoodAgent, true);
  console.log(`Transaction sent: ${tx.hash}`);

  const receipt = await tx.wait(1);
  console.log(`Transaction confirmed in block ${receipt.blockNumber} (confirmations: ${receipt.confirmations})`);

  const finalStatus = await contract.getRecorderStatus(expectedGoodAgent);
  console.log(`Final Good Agent recorder status: ${finalStatus}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exitCode = 1;
});
