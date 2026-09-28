import { ethers } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let provider = null;

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

export function getDeploymentConfig() {
  const deploymentPath = path.resolve(__dirname, '../../../../shared/deployments/mst-testnet.json');
  if (fs.existsSync(deploymentPath)) {
    try {
      const content = fs.readFileSync(deploymentPath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.warn('Failed to read MST deployment config:', err.message);
    }
  }
  return null;
}

export function getCharterAbi() {
  const abiPath = path.resolve(__dirname, '../../../../shared/abi/SpendingCharter.json');
  if (fs.existsSync(abiPath)) {
    try {
      const content = fs.readFileSync(abiPath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.warn('Failed to read SpendingCharter ABI:', err.message);
    }
  }
  return null;
}

export function getChainStatus() {
  const rpcConfigured = Boolean(process.env.MST_RPC_URL);
  const deploymentConfig = getDeploymentConfig();
  const charterAbi = getCharterAbi();
  return {
    configured: rpcConfigured,
    rpcUrl: rpcConfigured ? process.env.MST_RPC_URL : null,
    chainId: process.env.MST_CHAIN_ID || null,
    hasDeploymentFile: Boolean(deploymentConfig),
    hasCharterAbi: Boolean(charterAbi)
  };
}
