const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile("../../backend/.env"); } catch (e) {}
}

const EXPECTED_CHAIN_ID = 91562037n;

async function main() {
  const deployerKey = (process.env.DEPLOYER_PRIVATE_KEY || "").trim();
  const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";

  if (!deployerKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY is missing");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();

  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Connected network chain ID (${network.chainId}) does not match expected MST testnet (${EXPECTED_CHAIN_ID})`);
  }

  const deployerWallet = new ethers.Wallet(deployerKey, provider);
  const deployerAddress = deployerWallet.address;

  console.log(`Deploying ReasoningReceipts...`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Deployer: ${deployerAddress}`);

  const factory = await ethers.getContractFactory("ReasoningReceipts", deployerWallet);
  const contract = await factory.deploy(deployerAddress);
  
  await contract.waitForDeployment();
  const txHash = contract.deploymentTransaction().hash;
  await contract.deploymentTransaction().wait();

  const deployedAddress = await contract.getAddress();
  console.log(`ReasoningReceipts deployed at: ${deployedAddress}`);
  console.log(`Deployment TX Hash: ${txHash}`);

  // Bytecode verification
  const bytecode = await provider.getCode(deployedAddress);
  const bytecodeExists = bytecode && bytecode !== "0x" && bytecode.length > 2;
  console.log(`Bytecode verified: ${bytecodeExists ? "YES" : "NO"} (${bytecode.length} bytes)`);

  // Recorder status check
  const goodAgentAddress = "0x5D7C03A79570014e8cf335DCdBc9Fb87284Fdf4B";
  const deployerRecorderStatus = await contract.getRecorderStatus(deployerAddress);
  const goodAgentRecorderStatus = await contract.getRecorderStatus(goodAgentAddress);

  console.log(`Deployer recorder status: ${deployerRecorderStatus}`);
  console.log(`Good Agent recorder status: ${goodAgentRecorderStatus}`);

  // Update shared/deployments/mst-testnet.json
  const deploymentPath = path.resolve(__dirname, "../../shared/deployments/mst-testnet.json");
  if (fs.existsSync(deploymentPath)) {
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    deploymentData.ReasoningReceipts = deployedAddress;
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2) + "\n");
    console.log(`Updated shared/deployments/mst-testnet.json with ReasoningReceipts address.`);
  }
}

main().catch((err) => {
  console.error("Deployment error:", err.message);
  process.exitCode = 1;
});
