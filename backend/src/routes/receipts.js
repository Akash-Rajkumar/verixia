import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import { createReasoningReceiptsAdapter } from '../agent/adapters/ReasoningReceiptsAdapter.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

function getDeploymentConfig() {
  const deploymentPath = path.resolve(__dirname, '../../../shared/deployments/mst-testnet.json');
  if (fs.existsSync(deploymentPath)) {
    try {
      return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    } catch (e) {}
  }
  return null;
}

function getReceiptsAdapter() {
  const deployment = getDeploymentConfig();
  const contractAddress = process.env.REASONING_RECEIPTS_ADDRESS || (deployment && deployment.ReasoningReceipts) || '';
  const rpcUrl = process.env.MST_RPC_URL || process.env.RPC_URL || 'https://testnetrpc.mstblockchain.com';

  if (!contractAddress) {
    return null;
  }

  return createReasoningReceiptsAdapter({
    contractAddress,
    rpcUrl
  });
}

router.get('/receipts/:receiptId', async (req, res) => {
  const adapter = getReceiptsAdapter();
  if (!adapter) {
    return sendError(res, 502, 'CHAIN_ERROR', 'ReasoningReceipts contract address is not configured');
  }

  try {
    const receipt = await adapter.getReceipt(req.params.receiptId);
    if (!receipt || !receipt.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Reasoning receipt not found on-chain');
    }
    return sendSuccess(res, receipt);
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err);
    if (errMsg.includes('ReceiptNotFound') || errMsg.includes('not found')) {
      return sendError(res, 404, 'NOT_FOUND', 'Reasoning receipt not found on-chain');
    }
    return sendError(res, 502, 'CHAIN_ERROR', `Failed to query reasoning receipt: ${errMsg}`);
  }
});

router.get('/receipts/:receiptId/verify', async (req, res) => {
  const adapter = getReceiptsAdapter();
  if (!adapter) {
    return sendError(res, 502, 'CHAIN_ERROR', 'ReasoningReceipts contract address is not configured');
  }

  try {
    const receipt = await adapter.getReceipt(req.params.receiptId);
    const onChainHash = await adapter.getReceiptHash(req.params.receiptId);

    if (!receipt || !receipt.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Reasoning receipt not found on-chain');
    }

    const computedHash = receipt.reasoningHash;
    const verified = Boolean(
      computedHash &&
      onChainHash &&
      computedHash.toLowerCase() === onChainHash.toLowerCase()
    );

    return sendSuccess(res, {
      receiptId: req.params.receiptId,
      computedHash,
      onChainHash,
      verified
    });
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err);
    if (errMsg.includes('ReceiptNotFound') || errMsg.includes('not found')) {
      return sendError(res, 404, 'NOT_FOUND', 'Reasoning receipt not found on-chain');
    }
    return sendError(res, 502, 'CHAIN_ERROR', `Failed to verify reasoning receipt: ${errMsg}`);
  }
});

export default router;
