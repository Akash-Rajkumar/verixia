import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import { createBlockchainTransactionAdapter } from '../agent/adapters/BlockchainTransactionAdapter.js';

const router = Router();

router.get('/blockchain/transaction/:txHash', async (req, res) => {
  const { txHash } = req.params;

  if (typeof txHash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(txHash.trim())) {
    return sendError(res, 400, 'INVALID_HASH', 'Invalid transaction hash format. Must be a 0x-prefixed 64-character hex string.');
  }

  try {
    const adapter = createBlockchainTransactionAdapter();
    const details = await adapter.getTransactionDetails(txHash.trim());

    if (!details) {
      return sendError(res, 404, 'NOT_FOUND', `Transaction ${txHash} not found on MST Testnet chain.`);
    }

    return sendSuccess(res, details);
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err);
    if (errMsg.includes('Invalid transaction hash format')) {
      return sendError(res, 400, 'INVALID_HASH', errMsg);
    }
    return sendError(res, 502, 'CHAIN_ERROR', `Failed to query transaction details from MST chain: ${errMsg}`);
  }
});

export default router;
