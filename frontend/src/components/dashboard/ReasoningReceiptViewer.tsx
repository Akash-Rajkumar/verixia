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
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean
    computedHash: string
    onChainHash: string
  } | null>(null)

  const receipt: ReasoningReceipt | null = selectedAttempt?.receipt || null

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopiedHash(true)
      setTimeout(() => setCopiedHash(false), 2000)
    } catch (err) {
      console.error("Failed to copy hash:", err)
    }
  }

  // Verification simulation check calling API abstraction
  const handleVerify = async () => {
    if (!receipt) return
    setVerifying(true)
    setVerificationResult(null)
    try {
      // Small simulated latency for verification progress animation
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
      <Card className="w-full bg-[#0f1433]/90 border-violet-900/40 shadow-2xl p-6 flex flex-col items-center justify-center text-center h-[520px]">
        <FileCheck2 className="w-12 h-12 text-[#7c86b8] animate-pulse mb-3" />
        <h3 className="text-sm font-bold font-mono text-cyan-300 uppercase tracking-wider">
          SELECT A TRANSACTION IN THE LEDGER
        </h3>
        <p className="text-xs text-[#c4c7dc] max-w-sm mt-1">
          Click any transaction row in the ledger above to inspect its cryptographic reasoning receipt and on-chain verification proof.
        </p>
      </Card>
    )
  }

  // 2. RECEIPT NULL STATE
  if (!receipt) {
    return (
      <Card className="w-full bg-[#0f1433]/90 border-violet-900/40 shadow-2xl p-6 flex flex-col items-center justify-center text-center h-[520px]">
        <AlertTriangle className="w-12 h-12 text-amber-400/80 mb-3" />
        <h3 className="text-sm font-bold font-mono text-amber-300 uppercase tracking-wider">
          REASONING RECEIPT NOT AVAILABLE YET
        </h3>
        <p className="text-xs text-[#c4c7dc] max-w-sm mt-1">
          No on-chain reasoning receipt was attached to transaction attempt <span className="font-mono text-[#f1f2ff]">{selectedAttempt.id}</span>.
        </p>
      </Card>
    )
  }

  const rf = receipt.reasoningFull
  const isBlocked = receipt.decisionLabel === "BLOCKED"
  const isExecuted = receipt.decisionLabel === "EXECUTED"

  return (
    <Card
      variant={isBlocked ? "glow-red" : isExecuted ? "glow-emerald" : "glow-violet"}
      className="w-full bg-[#0f1433]/95 border-violet-900/40 shadow-2xl p-5 flex flex-col h-[520px] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1d163e]/90 border border-violet-500/50 flex items-center justify-center shadow-[0_0_18px_rgba(124,108,245,0.3)]">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-[#f1f2ff] uppercase tracking-wider">
                Reasoning Receipt Viewer
              </h3>
              <Badge variant="violet" className="text-[10px] py-0 px-1.5">
                ON-CHAIN PROOF
              </Badge>
            </div>
            <p className="text-[11px] text-[#c4c7dc] font-mono">
              Receipt ID: {receipt.receiptId}
            </p>
          </div>
        </div>

        {/* Decision Badge Header */}
        <div className="flex items-center gap-2">
          {isBlocked && (
            <Badge variant="red" className="text-xs py-1 px-3 gap-1 font-bold shadow-[0_0_12px_rgba(251,79,99,0.3)]">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
              BLOCKED BY CHARTER
            </Badge>
          )}
          {isExecuted && (
            <Badge variant="emerald" className="text-xs py-1 px-3 gap-1 font-bold shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              EXECUTED ON-CHAIN
            </Badge>
          )}
          {!isBlocked && !isExecuted && (
            <Badge variant="amber" className="text-xs py-1 px-3 gap-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              DECLINED BY AGENT
            </Badge>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        
        {/* 1. DECISION SUMMARY AUDIT BOX */}
        <div className="p-3.5 bg-[#0a0f26]/80 border border-indigo-900/40 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-[#858aa6] uppercase tracking-wider block">
            Executive Decision Summary
          </span>
          <p className="text-xs font-semibold text-[#f1f2ff] leading-relaxed font-sans">
            {receipt.reasoningSummary}
          </p>
        </div>

        {/* 2. MANIPULATION SIGNALS */}
        <div className="space-y-1.5 font-mono">
          <span className="text-[10px] text-[#858aa6] uppercase tracking-wider block">
            Detected Manipulation Signals
          </span>
          <div className="flex flex-wrap gap-1.5">
            {rf.manipulationSignals && rf.manipulationSignals.length > 0 ? (
              rf.manipulationSignals.map((signal, idx) => (
                <Badge key={idx} variant="red" className="text-[10px] py-0.5 px-2 gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  {signal}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-emerald-300 font-bold bg-[#092723]/90 border border-emerald-500/40 px-2.5 py-1 rounded-md inline-block shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                ✓ NO MANIPULATION SIGNALS DETECTED
              </span>
            )}
          </div>
        </div>

        {/* 3. RATIONALE */}
        <div className="p-3 bg-[#0a0f26]/60 border border-indigo-900/40 rounded-xl space-y-1 font-sans">
          <span className="text-[10px] font-mono text-[#858aa6] uppercase tracking-wider block">
            Agent Rationale
          </span>
          <p className="text-xs text-[#c4c7dc] leading-relaxed">
            {rf.rationale}
          </p>
        </div>

        {/* 4. REPUTATION CHECK & MODEL METADATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          
          {/* Reputation Check */}
          <div className="p-3 bg-[#0a0f26]/60 border border-indigo-900/40 rounded-xl space-y-1">
            <span className="text-[10px] text-[#858aa6] uppercase block">Reputation Verification</span>
            {rf.reputationChecked.enabled ? (
              <div className="space-y-1 text-[11px]">
                <div className="text-[#f1f2ff]">Feedback Count: {rf.reputationChecked.feedbackCount}</div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-[#c4c7dc]">
                  <span>Comp: {rf.reputationChecked.axes.competence ?? "NO DATA"}</span>
                  <span>Hon: {rf.reputationChecked.axes.honesty ?? "NO DATA"}</span>
                  <span>Compl: {rf.reputationChecked.axes.compliance ?? "NO DATA"}</span>
                  <span>Rel: {rf.reputationChecked.axes.reliability ?? "NO DATA"}</span>
                </div>
              </div>
            ) : (
              <span className="text-[#7c86b8] italic">REPUTATION CHECK DISABLED</span>
            )}
          </div>

          {/* Model Info */}
          <div className="p-3 bg-[#0a0f26]/60 border border-indigo-900/40 rounded-xl space-y-1">
            <span className="text-[10px] text-[#858aa6] uppercase block">AI Model Metadata</span>
            <div className="flex items-center gap-1.5 font-bold text-[#f1f2ff]">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{rf.model.provider.toUpperCase()} ({rf.model.name})</span>
            </div>
            {rf.model.fellBack && (
              <Badge variant="amber" className="text-[9px] py-0 px-1 mt-1">
                FELL BACK TO OLLAMA
              </Badge>
            )}
          </div>

        </div>

        {/* 5. REASONING HASH & ON-CHAIN VERIFICATION PROOF */}
        <div className="p-3.5 bg-[#091024]/90 border border-indigo-900/50 rounded-xl space-y-3 font-mono text-xs">
          
          <div className="flex items-center justify-between">
            <span className="text-[#c4c7dc] flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-cyan-400" /> Cryptographic Reasoning Hash:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-bold">{truncateHash(receipt.reasoningHash, 10, 8)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyHash(receipt.reasoningHash)}
                className="p-1 h-6 text-[#c4c7dc] hover:text-white"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Verification Controls & Visual Status */}
          <div className="pt-2 border-t border-indigo-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <Button
              variant={
                verificationResult?.verified
                  ? "primary"
                  : verificationResult?.verified === false
                  ? "danger"
                  : "primary"
              }
              size="md"
              isLoading={verifying}
              onClick={handleVerify}
              className="w-full sm:w-auto font-mono text-xs font-bold gap-2 py-2 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white border-none shadow-[0_0_20px_rgba(124,108,245,0.35)]"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              {verifying ? "COMPUTING HASH MATCH..." : "VERIFY ON-CHAIN"}
            </Button>

            <AnimatePresence mode="wait">
              {verificationResult?.verified === true && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs bg-[#092723]/90 border border-emerald-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  VERIFIED ON-CHAIN ✓
                </motion.div>
              )}

              {verificationResult?.verified === false && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 text-rose-300 font-bold text-xs bg-[#250d19]/90 border border-rose-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(251,79,99,0.3)]"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  HASH MISMATCH ⚠
                </motion.div>
              )}
            </AnimatePresence>

            {txExplorerUrl && (
              <a
                href={txExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 underline"
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

