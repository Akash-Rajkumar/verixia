import { ethers } from 'ethers';

let provider = null;
const signers = {
  deployer: null,
  goodAgent: null,
  badAgent: null
};

/**
 * Returns lazy JsonRpcProvider instance if MST_RPC_URL is configured.
 */
export function getProvider() {
  if (!provider && process.env.MST_RPC_URL) {
    try {
      provider = new ethers.JsonRpcProvider(process.env.MST_RPC_URL);
    } catch (err) {
      console.warn('Failed to initialize MST RPC provider:', err.message);
    }
  }
  return provider;
}

/**
 * Helper to construct an ethers.Wallet attached to provider if key is available.
 */
function createLazyWallet(privateKeyEnv) {
  if (!privateKeyEnv) {
    return null;
  }
  const activeProvider = getProvider();
  try {
    return activeProvider
      ? new ethers.Wallet(privateKeyEnv, activeProvider)
      : new ethers.Wallet(privateKeyEnv);
  } catch (err) {
    console.warn('Failed to create wallet from private key:', err.message);
    return null;
  }
}

/**
 * Returns lazy Wallet instance for Deployer (owner).
 */
export function getDeployerSigner() {
  if (!signers.deployer && process.env.DEPLOYER_PRIVATE_KEY) {
    signers.deployer = createLazyWallet(process.env.DEPLOYER_PRIVATE_KEY);
  }
  return signers.deployer;
}

/**
 * Returns lazy Wallet instance for Good Agent (payment execution caller).
 */
export function getGoodAgentSigner() {
  if (!signers.goodAgent && process.env.GOOD_AGENT_PRIVATE_KEY) {
    signers.goodAgent = createLazyWallet(process.env.GOOD_AGENT_PRIVATE_KEY);
  }
  return signers.goodAgent;
}

/**
 * Returns lazy Wallet instance for Bad Agent (adversarial testing caller).
 */
export function getBadAgentSigner() {
  if (!signers.badAgent && process.env.BAD_AGENT_PRIVATE_KEY) {
    signers.badAgent = createLazyWallet(process.env.BAD_AGENT_PRIVATE_KEY);
  }
  return signers.badAgent;
}

/**
 * Reset provider and signer instances (useful for unit tests with dynamic env).
 */
export function resetChainProvider() {
  provider = null;
  signers.deployer = null;
  signers.goodAgent = null;
  signers.badAgent = null;
}
