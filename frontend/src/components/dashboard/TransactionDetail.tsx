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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md p-4 lg:p-6 overflow-y-auto">
      <motion.div
        initial={{ x: 350, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 350, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 250 }}
        className="w-full max-w-xl bg-black border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0a0a0a] border-b border-white/12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black border border-[#dfff00]/60 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#dfff00]" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Transaction Attempt Details
              </h3>
              <p className="text-[11px] font-mono text-white/50">
                ID: {attempt.id}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans">
          
          {/* Status banner */}
          <Card
            className="p-4 flex items-center justify-between bg-[#0a0a0a] border-white/15"
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                Policy Outcome Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                {attempt.status === "blocked" && (
                  <>
                    <ShieldAlert className="w-5 h-5 text-[#dfff00]" />
                    <span className="text-base font-bold font-mono text-[#dfff00]">
                      BLOCKED BY CHARTER
                    </span>
                  </>
                )}
                {attempt.status === "executed" && (
                  <>
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span className="text-base font-bold font-mono text-white">
                      EXECUTED ON-CHAIN
                    </span>
                  </>
                )}
                {attempt.status === "declined" && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-white/80" />
                    <span className="text-base font-bold font-mono text-white/90">
                      DECLINED BY AGENT
                    </span>
                  </>
                )}
                {attempt.status === "proposed" && (
                  <span className="text-base font-bold font-mono text-[#dfff00]">
                    PROPOSED
                  </span>
                )}
                {attempt.status === "failed" && (
                  <span className="text-base font-bold font-mono text-white/50">
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
            <div className="p-3.5 bg-[#0a0a0a] border border-white/12 rounded-xl">
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mb-1">
                Requested Amount
              </span>
              <div className="text-xl font-bold font-mono text-[#dfff00]">
                {formatNativeAmount(attempt.amountWei, 18, "MST")}
              </div>
              <span className="text-[10px] font-mono text-white/50 block mt-1">
                Exact Wei: {attempt.amountWei}
              </span>
            </div>

            {/* Counterparty */}
            <div className="p-3.5 bg-[#0a0a0a] border border-white/12 rounded-xl">
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mb-1">
                Counterparty Address
              </span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="font-mono text-sm text-white font-bold">
                  {truncateAddress(attempt.counterpartyAddress, 8, 6)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCounterparty}
                  className="p-1 h-7 text-xs text-white/60 hover:text-[#dfff00]"
                >
                  {copiedCounterparty ? <Check className="w-3.5 h-3.5 text-[#dfff00]" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

          </div>

          {/* Block Reason Section if blocked */}
          {attempt.status === "blocked" && (
            <div className="p-4 bg-black border border-[#dfff00]/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#dfff00]" />
                <span className="text-xs font-bold font-mono text-[#dfff00] uppercase">
                  Reason Code #{attempt.blockReasonCode}: {REASON_CODE_LABELS[attempt.blockReasonCode || 0] || "BLOCKED"}
                </span>
              </div>
              <p className="text-xs text-white leading-relaxed font-sans">
                {attempt.blockReason || REASON_CODE_HUMAN_TEXT[attempt.blockReasonCode || 0] || "Policy violation."}
              </p>
            </div>
          )}

          {/* Attack Type if present */}
          {attempt.attackType && (
            <div className="p-3.5 bg-[#0a0a0a] border border-white/12 rounded-xl flex items-center justify-between">
              <span className="text-xs font-mono text-white/70">Associated Attack Vector:</span>
              <Badge variant="red" className="text-xs">
                {ATTACK_TYPE_HUMAN_LABELS[attempt.attackType] || attempt.attackType.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* On-Chain Transaction Hash & Explorer Link */}
          <div className="p-3.5 bg-[#0a0a0a] border border-white/12 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
              On-Chain Transaction Reference
            </span>
            {attempt.txHash ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-xs text-[#dfff00]">
                  <Database className="w-3.5 h-3.5 text-[#dfff00] shrink-0" />
                  <span>{truncateHash(attempt.txHash, 10, 8)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyHash}
                    className="p-1 h-7 text-xs text-white/60 hover:text-[#dfff00]"
                  >
                    {copiedTxHash ? <Check className="w-3.5 h-3.5 text-[#dfff00]" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-black border border-[#dfff00]/50 text-[#dfff00] hover:bg-[#dfff00] hover:text-black text-xs font-mono transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Explorer
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/50 font-mono italic">
                No on-chain transaction executed (blocked/declined prior to execution).
              </p>
            )}
          </div>

          {/* Receipt & Metadata Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#0a0a0a] border border-white/12 rounded-lg">
              <span className="text-[10px] text-white/50 uppercase block">Reasoning Receipt</span>
              <span className={attempt.receiptId ? "text-white font-bold" : "text-white/40 italic"}>
                {attempt.receiptId ? `Receipt ID: ${attempt.receiptId}` : "Reasoning receipt not available yet"}
              </span>
            </div>
            <div className="p-3 bg-[#0a0a0a] border border-white/12 rounded-lg">
              <span className="text-[10px] text-white/50 uppercase block">Verification Tier</span>
              <span className="text-white font-bold uppercase">{attempt.verificationTier}</span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Created: {new Date(attempt.createdAt).toLocaleString()}
            </span>
            <span>Chain ID: {attempt.chainId}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0a0a0a] border-t border-white/12 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspection
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
