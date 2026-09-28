import {
  getProvider,
  getDeployerSigner,
  getGoodAgentSigner,
  getBadAgentSigner
} from './provider.js';

import {
  getCharterAbi,
  getCharterAddress,
  getCharterRules,
  getCharterStatus,
  checkCharterPayment,
  getCharterCounterpartyStatus,
  attemptCharterPayment,
  setCharterRules,
  setCharterCounterpartyStatus
} from './charter.js';

import {
  parseEtherString,
  formatEtherString,
  normalizeAddress,
  formatRules,
  formatStatus,
  formatPaymentOutcome,
  normalizeChainError
} from './formatters.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export function getChainStatus() {
  const rpcConfigured = Boolean(process.env.MST_RPC_URL);
  const deploymentConfig = getDeploymentConfig();
  const charterAbi = getCharterAbi();
  const charterAddress = getCharterAddress();

  return {
    configured: rpcConfigured,
    rpcUrl: rpcConfigured ? process.env.MST_RPC_URL : null,
    chainId: process.env.MST_CHAIN_ID || null,
    hasDeploymentFile: Boolean(deploymentConfig),
    hasCharterAbi: Boolean(charterAbi),
    charterAddress: charterAddress || null,
    signersConfigured: {
      deployer: Boolean(process.env.DEPLOYER_PRIVATE_KEY),
      goodAgent: Boolean(process.env.GOOD_AGENT_PRIVATE_KEY),
      badAgent: Boolean(process.env.BAD_AGENT_PRIVATE_KEY)
    }
  };
}

export {
  getProvider,
  getDeployerSigner,
  getGoodAgentSigner,
  getBadAgentSigner,
  getCharterAbi,
  getCharterAddress,
  getCharterRules,
  getCharterStatus,
  checkCharterPayment,
  getCharterCounterpartyStatus,
  attemptCharterPayment,
  setCharterRules,
  setCharterCounterpartyStatus,
  parseEtherString,
  formatEtherString,
  normalizeAddress,
  formatRules,
  formatStatus,
  formatPaymentOutcome,
  normalizeChainError
};
