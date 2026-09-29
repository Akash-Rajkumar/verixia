import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  Hash,
  Sparkles,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { truncateHash } from "@/lib/format"
import { api } from "@/api"
import type { PublicConfig, ReasoningReceipt, TransactionAttempt } from "@/api/types"

export interface ReasoningReceiptViewerProps {
  config: PublicConfig | null
  selectedAttempt?: TransactionAttempt | null
}

export const ReasoningReceiptViewer: React.FC<ReasoningReceiptViewerProps> = ({
  config,
  selectedAttempt,
}) => {
  const [copiedHash, setCopiedHash] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [fetchedReceipt, setFetchedReceipt] = useState<ReasoningReceipt | null>(null)
  const [fetchingReceipt, setFetchingReceipt] = useState<boolean>(false)
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean
    computedHash: string
    onChainHash: string
  } | null>(null)

  // Direct receipt from selected attempt or dynamically fetched receipt
  const receipt: ReasoningReceipt | null = selectedAttempt?.receipt || fetchedReceipt || null

  // Automatically fetch receipt if selectedAttempt has receiptId but no embedded receipt object
  React.useEffect(() => {
    setFetchedReceipt(null)

    const receiptId = selectedAttempt?.receiptId
    if (!selectedAttempt?.receipt && receiptId && receiptId !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      setFetchingReceipt(true)
      api
        .getReceipt(receiptId)
        .then((rcpt) => {
          setFetchedReceipt(rcpt)
        })
        .catch(() => {
          // If fetch fails or no receipt on chain, receipt state remains null
        })
        .finally(() => {
          setFetchingReceipt(false)
        })
    }
  }, [selectedAttempt?.id, selectedAttempt?.receiptId, selectedAttempt?.receipt])

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopiedHash(true)
      setTimeout(() => setCopiedHash(false), 2000)
    } catch (err) {
      console.error("Failed to copy hash:", err)
    }
  }

  // Verification check calling API abstraction
  const handleVerify = async () => {
    if (!receipt) return
    setVerifying(true)
    setVerificationResult(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const res = await api.verifyReceipt(receipt.receiptId)
      setVerificationResult({
        verified: res.verified,
        computedHash: res.computedHash,
        onChainHash: res.onChainHash,
      })
    } catch (err) {
      console.error("Receipt verification failed:", err)
      setVerificationResult({
        verified: false,
        computedHash: receipt.reasoningHash,
        onChainHash: "0xMISMATCH_UNVERIFIED",
      })
    } finally {
      setVerifying(false)
    }
  }

  const explorerBaseUrl = config?.explorerUrl || "https://explorer.mst.network"
  const txExplorerUrl = receipt?.onChainTxHash
    ? `${explorerBaseUrl.replace(/\/$/, "")}/tx/${receipt.onChainTxHash}`
    : null

  // 1. NO TRANSACTION SELECTED STATE
  if (!selectedAttempt) {
    return (
      <Card className="w-full bg-[#050505] border-white/10 shadow-2xl p-8 flex flex-col items-center justify-center text-center h-[520px] rounded-2xl">
        <FileCheck2 className="w-12 h-12 text-[#dfff00] animate-pulse mb-3" />
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          SELECT A TRANSACTION IN THE LEDGER
        </h3>
        <p className="text-xs text-white/50 max-w-sm mt-2 leading-relaxed">
          Click any transaction row in the ledger to inspect its cryptographic reasoning receipt and on-chain verification proof.
        </p>
      </Card>
    )
  }

  // 2. RECEIPT FETCHING STATE
  if (fetchingReceipt) {
    return (
      <Card className="w-full bg-[#050505] border-white/10 shadow-2xl p-8 flex flex-col items-center justify-center text-center h-[520px] rounded-2xl">
        <Cpu className="w-10 h-10 text-[#dfff00] animate-spin mb-3" />
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          FETCHING ON-CHAIN RECEIPT...
        </h3>
        <p className="text-xs text-white/50 max-w-sm mt-1 font-mono">
          Querying ReasoningReceipts contract for ID {selectedAttempt.receiptId}...
        </p>
      </Card>
    )
  }

  // 3. RECEIPT NULL / UNATTACHED STATE
  if (!receipt) {
    return (
      <Card className="w-full bg-[#050505] border-white/10 shadow-2xl p-8 flex flex-col items-center justify-center text-center h-[520px] rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-white/40" />
        </div>
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          NO ON-CHAIN RECEIPT
        </h3>
        <p className="text-xs text-white/50 max-w-sm mt-2 leading-relaxed font-sans">
          This transaction attempt does not have an on-chain reasoning receipt attached.
        </p>
        <p className="text-[11px] font-mono text-white/30 mt-3">
          Attempt ID: {selectedAttempt.id} • Status: {selectedAttempt.status.toUpperCase()}
        </p>
      </Card>
    )
  }

  const rf = receipt.reasoningFull
  const isBlocked = receipt.decisionLabel === "BLOCKED"
  const isExecuted = receipt.decisionLabel === "EXECUTED"

  const signals = rf?.manipulationSignals || []
  const rationaleText = rf?.rationale || receipt.reasoningSummary
  const repChecked = rf?.reputationChecked
  const modelInfo = rf?.model || { provider: "gemini", name: "gemini-2.5-flash", fellBack: false }

  return (
    <Card
      className="w-full bg-black border-white/15 shadow-2xl p-5 flex flex-col h-[520px] overflow-hidden rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/12 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-black border border-[#dfff00]/60 flex items-center justify-center shadow-[0_0_18px_rgba(223,255,0,0.2)]">
            <Sparkles className="w-5 h-5 text-[#dfff00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Reasoning Receipt Viewer
              </h3>
              <Badge variant="cyan" className="text-[10px] py-0 px-1.5">
                ON-CHAIN PROOF
              </Badge>
            </div>
            <p className="text-[11px] text-white/50 font-mono">
              Receipt ID: {receipt.receiptId}
            </p>
          </div>
        </div>

        {/* Decision Badge Header */}
        <div className="flex items-center gap-2">
          {isBlocked && (
            <Badge variant="red" className="text-xs py-1 px-3 gap-1 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-[#dfff00]" />
              BLOCKED BY CHARTER
            </Badge>
          )}
          {isExecuted && (
            <Badge variant="emerald" className="text-xs py-1 px-3 gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              EXECUTED ON-CHAIN
            </Badge>
          )}
          {!isBlocked && !isExecuted && (
            <Badge variant="amber" className="text-xs py-1 px-3 gap-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-white/80" />
              DECLINED BY AGENT
            </Badge>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/20">
        
        {/* 1. DECISION SUMMARY AUDIT BOX */}
        <div className="p-3.5 bg-[#0a0a0a] border border-white/12 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
            Executive Decision Summary
          </span>
          <p className="text-xs font-semibold text-white leading-relaxed font-sans">
            {receipt.reasoningSummary}
          </p>
        </div>

        {/* 2. MANIPULATION SIGNALS */}
        <div className="space-y-1.5 font-mono">
          <span className="text-[10px] text-white/50 uppercase tracking-wider block">
            Detected Manipulation Signals
          </span>
          <div className="flex flex-wrap gap-1.5">
            {signals.length > 0 ? (
              signals.map((signal, idx) => (
                <Badge key={idx} variant="red" className="text-[10px] py-0.5 px-2 gap-1">
                  <AlertOctagon className="w-3 h-3 text-[#dfff00]" />
                  {signal}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-white font-bold bg-black border border-white/30 px-2.5 py-1 rounded-md inline-block shadow-[0_0_12px_rgba(255,255,255,0.08)]">
                ✓ NO MANIPULATION SIGNALS DETECTED
              </span>
            )}
          </div>
        </div>

        {/* 3. RATIONALE */}
        <div className="p-3 bg-[#0a0a0a] border border-white/12 rounded-xl space-y-1 font-sans">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
            Agent Rationale
          </span>
          <p className="text-xs text-white/80 leading-relaxed">
            {rationaleText}
          </p>
        </div>

        {/* 4. REPUTATION CHECK & MODEL METADATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          
          {/* Reputation Check */}
          <div className="p-3 bg-[#0a0a0a] border border-white/12 rounded-xl space-y-1">
            <span className="text-[10px] text-white/50 uppercase block">Reputation Verification</span>
            {repChecked?.enabled ? (
              <div className="space-y-1 text-[11px]">
                <div className="text-white">Feedback Count: {repChecked.feedbackCount}</div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-white/70">
                  <span>Comp: {repChecked.axes?.competence ?? "NO DATA"}</span>
                  <span>Hon: {repChecked.axes?.honesty ?? "NO DATA"}</span>
                  <span>Compl: {repChecked.axes?.compliance ?? "NO DATA"}</span>
                  <span>Rel: {repChecked.axes?.reliability ?? "NO DATA"}</span>
                </div>
              </div>
            ) : (
              <span className="text-white/40 italic">REPUTATION CHECK DISABLED</span>
            )}
          </div>

          {/* Model Info */}
          <div className="p-3 bg-[#0a0a0a] border border-white/12 rounded-xl space-y-1">
            <span className="text-[10px] text-white/50 uppercase block">AI Model Metadata</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Cpu className="w-3.5 h-3.5 text-[#dfff00]" />
              <span>{modelInfo.provider.toUpperCase()} ({modelInfo.name})</span>
            </div>
            {modelInfo.fellBack && (
              <Badge variant="cyan" className="text-[9px] py-0 px-1 mt-1">
                FELL BACK TO OLLAMA
              </Badge>
            )}
          </div>

        </div>

        {/* 5. REASONING HASH & ON-CHAIN VERIFICATION PROOF */}
        <div className="p-3.5 bg-[#050505] border border-white/15 rounded-xl space-y-3 font-mono text-xs">
          
          <div className="flex items-center justify-between">
            <span className="text-white/70 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-[#dfff00]" /> Cryptographic Reasoning Hash:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#dfff00] font-bold">{truncateHash(receipt.reasoningHash, 10, 8)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyHash(receipt.reasoningHash)}
                className="p-1 h-6 text-white/70 hover:text-[#dfff00]"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-[#dfff00]" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Verification Controls & Visual Status */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <Button
              variant="primary"
              size="md"
              isLoading={verifying}
              onClick={handleVerify}
              className="w-full sm:w-auto font-mono text-xs font-bold gap-2 py-2 px-4 bg-black text-white hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/70 shadow-[0_0_20px_rgba(223,255,0,0.18)]"
            >
              <ShieldCheck className="w-4 h-4" />
              {verifying ? "COMPUTING HASH MATCH..." : "VERIFY ON-CHAIN"}
            </Button>

            <AnimatePresence mode="wait">
              {verificationResult?.verified === true && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 text-[#dfff00] font-bold text-xs bg-black border border-[#dfff00]/60 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(223,255,0,0.2)]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#dfff00]" />
                  RECEIPT VERIFIED ✓
                </motion.div>
              )}

              {verificationResult?.verified === false && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 text-white font-bold text-xs bg-black border border-[#dfff00] px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(223,255,0,0.25)] animate-pulse"
                >
                  <AlertTriangle className="w-4 h-4 text-[#dfff00]" />
                  HASH MISMATCH ⚠
                </motion.div>
              )}
            </AnimatePresence>

            {txExplorerUrl && (
              <a
                href={txExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#dfff00] hover:underline"
              >
                Explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

        </div>

      </div>
    </Card>
  )
}
