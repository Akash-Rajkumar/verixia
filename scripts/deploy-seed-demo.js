const hre = require("hardhat");

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env");
}

const EXPECTED_CHAIN_ID = 91562037n;

async function main() {
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const goodAgentPrivateKey = process.env.GOOD_AGENT_PRIVATE_KEY;

  if (!deployerPrivateKey || !goodAgentPrivateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY and GOOD_AGENT_PRIVATE_KEY are required");
  }

  if (hre.network.name !== "mstTestnet") {
    throw new Error("Run this script with the mstTestnet Hardhat network");
  }

  const { ethers } = hre;
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error("Connected network chain ID does not match MST testnet");
  }

  const deployer = new ethers.Wallet(deployerPrivateKey, ethers.provider);
  const goodAgent = new ethers.Wallet(goodAgentPrivateKey).address;

  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Good Agent: ${goodAgent}`);

  const registryFactory = await ethers.getContractFactory("ReputationRegistry", deployer);
  const registry = await registryFactory.deploy(deployer.address);
  await registry.waitForDeployment();
  await registry.deploymentTransaction().wait();
  console.log(`ReputationRegistry: ${await registry.getAddress()}`);

  const charterFactory = await ethers.getContractFactory("SpendingCharter", deployer);
  const charter = await charterFactory.deploy(deployer.address, goodAgent);
  await charter.waitForDeployment();
  await charter.deploymentTransaction().wait();
  console.log(`SpendingCharter: ${await charter.getAddress()}`);
}

main().catch(() => {
  console.error("Deployment failed; secret-bearing error details were omitted.");
  process.exitCode = 1;
});