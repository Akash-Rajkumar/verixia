import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  X,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Clock,
  AlertTriangle,
  Database,
  Lock,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNativeAmount, truncateAddress, truncateHash, copyToClipboard } from "@/lib/format"
import { REASON_CODE_LABELS, REASON_CODE_HUMAN_TEXT, ATTACK_TYPE_HUMAN_LABELS } from "@/api/constants"
import type { PublicConfig, TransactionAttempt } from "@/api/types"

export interface TransactionDetailProps {
  attempt: TransactionAttempt | null
  config: PublicConfig | null
  onClose: () => void
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({
  attempt,
  config,
  onClose,
}) => {
  const [copiedTxHash, setCopiedTxHash] = useState(false)
  const [copiedCounterparty, setCopiedCounterparty] = useState(false)

  if (!attempt) return null

  const handleCopyHash = async () => {
    if (attempt.txHash) {
      const success = await copyToClipboard(attempt.txHash)
      if (success) {
        setCopiedTxHash(true)
        setTimeout(() => setCopiedTxHash(false), 2000)
      }
    }
  }

  const handleCopyCounterparty = async () => {
    if (attempt.counterpartyAddress) {
      const success = await copyToClipboard(attempt.counterpartyAddress)
      if (success) {
        setCopiedCounterparty(true)
        setTimeout(() => setCopiedCounterparty(false), 2000)
      }
    }
  }

  const explorerBaseUrl = config?.explorerUrl || "https://explorer.mst.network"
  const explorerUrl = attempt.txHash ? `${explorerBaseUrl.replace(/\/$/, "")}/tx/${attempt.txHash}` : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm p-4 lg:p-6 overflow-y-auto">
      <motion.div
        initial={{ x: 350, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 350, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 250 }}
        className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                Transaction Attempt Details
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                ID: {attempt.id}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans">
          
          {/* Status banner */}
          <Card
            variant={
              attempt.status === "blocked"
                ? "glow-red"
                : attempt.status === "executed"
                ? "glow-emerald"
                : "default"
            }
            className="p-4 flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Policy Outcome Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                {attempt.status === "blocked" && (
                  <>
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <span className="text-base font-bold font-mono text-red-400">
                      BLOCKED BY CHARTER
                    </span>
                  </>
                )}
                {attempt.status === "executed" && (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-base font-bold font-mono text-emerald-400">
                      EXECUTED ON-CHAIN
                    </span>
                  </>
                )}
                {attempt.status === "declined" && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span className="text-base font-bold font-mono text-amber-400">
                      DECLINED BY AGENT
                    </span>
                  </>
                )}
                {attempt.status === "proposed" && (
                  <span className="text-base font-bold font-mono text-cyan-400">
                    PROPOSED
                  </span>
                )}
                {attempt.status === "failed" && (
                  <span className="text-base font-bold font-mono text-slate-400">
                    FAILED
                  </span>
                )}
              </div>
            </div>

            <Badge
              variant={
                attempt.status === "blocked"
                  ? "red"
                  : attempt.status === "executed"
                  ? "emerald"
                  : attempt.status === "declined"
                  ? "amber"
                  : "neutral"
              }
              className="text-xs px-3 py-1"
            >
              {attempt.status.toUpperCase()}
            </Badge>
          </Card>

          {/* Amount & Counterparty grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Amount */}
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Requested Amount
              </span>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {formatNativeAmount(attempt.amountWei, 18, "MST")}
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Exact Wei: {attempt.amountWei}
              </span>
            </div>

            {/* Counterparty */}
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Counterparty Address
              </span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="font-mono text-sm text-slate-200">
                  {truncateAddress(attempt.counterpartyAddress, 8, 6)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCounterparty}
                  className="p-1 h-7 text-xs text-slate-400 hover:text-cyan-400"
                >
                  {copiedCounterparty ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

          </div>

          {/* Block Reason Section if blocked */}
          {attempt.status === "blocked" && (
            <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold font-mono text-red-300 uppercase">
                  Reason Code #{attempt.blockReasonCode}: {REASON_CODE_LABELS[attempt.blockReasonCode || 0] || "BLOCKED"}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {attempt.blockReason || REASON_CODE_HUMAN_TEXT[attempt.blockReasonCode || 0] || "Policy violation."}
              </p>
            </div>
          )}

          {/* Attack Type if present */}
          {attempt.attackType && (
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Associated Attack Vector:</span>
              <Badge variant="red" className="text-xs">
                {ATTACK_TYPE_HUMAN_LABELS[attempt.attackType] || attempt.attackType.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* On-Chain Transaction Hash & Explorer Link */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              On-Chain Transaction Reference
            </span>
            {attempt.txHash ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
                  <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{truncateHash(attempt.txHash, 10, 8)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyHash}
                    className="p-1 h-7 text-xs text-slate-400 hover:text-cyan-400"
                  >
                    {copiedTxHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-mono transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Explorer
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-mono italic">
                No on-chain transaction executed (blocked/declined prior to execution).
              </p>
            )}
          </div>

          {/* Receipt & Metadata Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase block">Reasoning Receipt</span>
              <span className={attempt.receiptId ? "text-emerald-400 font-bold" : "text-slate-400 italic"}>
                {attempt.receiptId ? `Receipt ID: ${attempt.receiptId}` : "Reasoning receipt not available yet"}
              </span>
            </div>
            <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase block">Verification Tier</span>
              <span className="text-slate-200 font-bold uppercase">{attempt.verificationTier}</span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Created: {new Date(attempt.createdAt).toLocaleString()}
            </span>
            <span>Chain ID: {attempt.chainId}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspection
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
