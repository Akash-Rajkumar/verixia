import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDeploymentConfig() {
  const deploymentPath = path.resolve(__dirname, "../../../../shared/deployments/mst-testnet.json");
  if (fs.existsSync(deploymentPath)) {
    try {
      return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    } catch (e) {}
  }
  return null;
}

function getReceiptsAbi() {
  const abiPath = path.resolve(__dirname, "../../../../shared/abi/ReasoningReceipts.json");
  if (fs.existsSync(abiPath)) {
    try {
      return JSON.parse(fs.readFileSync(abiPath, "utf8"));
    } catch (e) {}
  }
  return null;
}

function getCharterAbi() {
  const abiPath = path.resolve(__dirname, "../../../../shared/abi/SpendingCharter.json");
  if (fs.existsSync(abiPath)) {
    try {
      return JSON.parse(fs.readFileSync(abiPath, "utf8"));
    } catch (e) {}
  }
  return null;
}

export class BlockchainTransactionAdapter {
  constructor(config = {}) {
    this.rpcUrl = config.rpcUrl || process.env.MST_RPC_URL || process.env.RPC_URL || "https://testnetrpc.mstblockchain.com";
    const deployment = getDeploymentConfig();
    this.receiptsAddress = (config.receiptsAddress || process.env.REASONING_RECEIPTS_ADDRESS || (deployment && deployment.ReasoningReceipts) || "0x9acDE9ACf72aE5AEc94430B357ce0531C0FFaae1").toLowerCase();
    this.charterAddress = (config.charterAddress || process.env.SPENDING_CHARTER_ADDRESS || (deployment && deployment.SpendingCharter) || "0xbD4c07Adb44e8ff2030faBcf0c4543067bA95E69").toLowerCase();
  }

  async getTransactionDetails(txHash) {
    if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash.trim())) {
      throw new Error("Invalid transaction hash format. Must be a 0x-prefixed 64-character hex string.");
    }

    const cleanHash = txHash.trim();
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);

    const [tx, receipt] = await Promise.all([
      provider.getTransaction(cleanHash).catch(() => null),
      provider.getTransactionReceipt(cleanHash).catch(() => null),
    ]);

    if (!tx) {
      return null;
    }

    let blockTimestamp = null;
    let confirmations = 0;

    const latestBlockNumber = await provider.getBlockNumber().catch(() => null);

    if (tx.blockNumber !== null && tx.blockNumber !== undefined) {
      if (latestBlockNumber !== null) {
        confirmations = Math.max(0, latestBlockNumber - tx.blockNumber + 1);
      }

      const block = await provider.getBlock(tx.blockNumber).catch(() => null);
      if (block) {
        blockTimestamp = block.timestamp;
      }
    }

    const status = receipt ? (receipt.status === 1 ? "SUCCESS" : "FAILED") : "PENDING";
    const gasUsed = receipt ? receipt.gasUsed : 0n;
    const gasPrice = tx.gasPrice ?? receipt?.gasPrice ?? 0n;
    const txFeeWei = (gasUsed * gasPrice).toString();

    let method = "Transfer / Execution";
    if (tx.to && tx.to.toLowerCase() === this.receiptsAddress) {
      method = "recordReceipt";
    } else if (tx.to && tx.to.toLowerCase() === this.charterAddress) {
      method = "attemptPayment";
    } else if (tx.data && tx.data.length >= 10 && tx.data !== "0x") {
      const selector = tx.data.slice(0, 10);
      if (selector === "0x41209fae") {
        method = "recordReceipt";
      } else {
        method = `Function Call (${selector})`;
      }
    }

    const tokenTransfers = [];
    if (tx.value && tx.value > 0n) {
      tokenTransfers.push({
        type: "native",
        asset: "MST",
        from: tx.from,
        to: tx.to,
        amountWei: tx.value.toString(),
      });
    }

    const erc20TransferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    if (receipt && receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        if (log.topics && log.topics[0] === erc20TransferTopic && log.topics.length === 3) {
          try {
            const from = ethers.getAddress("0x" + log.topics[1].slice(26));
            const to = ethers.getAddress("0x" + log.topics[2].slice(26));
            const amountWei = BigInt(log.data).toString();
            tokenTransfers.push({
              type: "erc20",
              tokenAddress: log.address,
              from,
              to,
              amountWei,
            });
          } catch (e) {}
        }
      }
    }

    const contractEvents = [];
    const receiptsAbi = getReceiptsAbi();
    const charterAbi = getCharterAbi();

    if (receipt && receipt.logs) {
      if (receiptsAbi) {
        const rcptIface = new ethers.Interface(receiptsAbi);
        const receiptRecordedTopic = "0x2b5721f20f6a7910d88f753e5cc4c086ae907f644594fcddb1a42733e7ff4f0b";
        for (const log of receipt.logs) {
          if (log.topics && log.topics[0] === receiptRecordedTopic) {
            try {
              const parsed = rcptIface.parseLog(log);
              contractEvents.push({
                eventName: parsed.name,
                args: {
                  receiptId: parsed.args[0],
                  agent: parsed.args[1],
                  counterparty: parsed.args[2],
                  amountWei: parsed.args[3].toString(),
                  decision: Number(parsed.args[4]),
                  reasoningHash: parsed.args[5],
                  summary: parsed.args[6],
                },
              });
            } catch (e) {}
          }
        }
      }

      if (charterAbi) {
        const charterIface = new ethers.Interface(charterAbi);
        for (const log of receipt.logs) {
          try {
            const parsed = charterIface.parseLog(log);
            if (parsed.name === "PaymentExecuted") {
              const amountWei = parsed.args[2].toString();
              tokenTransfers.push({
                type: "internal_native",
                asset: "MST",
                from: tx.to,
                to: parsed.args[1],
                amountWei,
              });
              contractEvents.push({
                eventName: parsed.name,
                args: {
                  receiptId: parsed.args[0],
                  to: parsed.args[1],
                  amountWei: amountWei,
                  spentInWindowWei: parsed.args[3].toString(),
                },
              });
            } else if (parsed.name === "PaymentBlocked") {
              contractEvents.push({
                eventName: parsed.name,
                args: {
                  receiptId: parsed.args[0],
                  to: parsed.args[1],
                  amountWei: parsed.args[2].toString(),
                  reasonCode: Number(parsed.args[3]),
                },
              });
            }
          } catch (e) {}
        }
      }
    }

    const rawLogs = (receipt?.logs || []).map((l, i) => ({
      address: l.address,
      topics: l.topics,
      data: l.data,
      index: l.index ?? i,
    }));

    return {
      hash: tx.hash,
      status,
      method,
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      timestamp: blockTimestamp,
      from: tx.from,
      to: tx.to,
      valueWei: tx.value ? tx.value.toString() : "0",
      transactionFeeWei: txFeeWei,
      gasPriceWei: gasPrice.toString(),
      gasUsed: gasUsed.toString(),
      gasLimit: tx.gasLimit ? tx.gasLimit.toString() : "0",
      nonce: Number(tx.nonce),
      confirmations,
      contractAddress: receipt?.contractAddress || null,
      tokenTransfers,
      contractEvents,
      rawLogs,
    };
  }
}

export function createBlockchainTransactionAdapter(config = {}) {
  return new BlockchainTransactionAdapter(config);
}
