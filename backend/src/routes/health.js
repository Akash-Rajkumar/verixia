import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';
import { getDbStatus } from '../services/db/index.js';
import { getChainStatus } from '../services/chain/index.js';

const router = Router();

/**
 * GET /api/v1/health
 * Basic liveness and dependency status check
 */
router.get('/health', (req, res) => {
  const dbStatus = getDbStatus();
  const chainStatus = getChainStatus();

  return sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      db: dbStatus.status,
      chain: chainStatus.configured ? 'configured' : 'not_configured'
    }
  });
});

/**
 * GET /api/v1/config/public
 * Exposes non-sensitive public configuration for the frontend
 */
router.get('/config/public', (req, res) => {
  return sendSuccess(res, {
    mstChainId: process.env.MST_CHAIN_ID || '',
    mstExplorerUrl: process.env.MST_EXPLORER_URL || '',
    charterAddress: process.env.CHARTER_ADDRESS || '',
    registryAddress: process.env.REGISTRY_ADDRESS || '',
    receiptsAddress: process.env.RECEIPTS_ADDRESS || '',
    features: {
      reputation: process.env.FEATURE_REPUTATION === 'true',
      stakeSlash: process.env.FEATURE_STAKE_SLASH === 'true',
      tiered: process.env.FEATURE_TIERED === 'true'
    }
  });
});

export default router;
