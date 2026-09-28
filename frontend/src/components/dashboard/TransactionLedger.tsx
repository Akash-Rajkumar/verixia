import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldAlert,
  ListFilter,
  AlertTriangle,
  Clock,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNativeAmount, truncateAddress } from "@/lib/format"
import { REASON_CODE_LABELS, REASON_CODE_HUMAN_TEXT, ATTACK_TYPE_HUMAN_LABELS } from "@/api/constants"
import type { TransactionAttempt } from "@/api/types"

export interface TransactionLedgerProps {
  transactions: TransactionAttempt[]
  selectedAttemptId?: string | null
  onSelectAttempt: (attempt: TransactionAttempt) => void
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  selectedAttemptId,
  onSelectAttempt,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  return (
    <Card className="w-full bg-black border-white/15 shadow-2xl flex flex-col h-[520px] overflow-hidden rounded-2xl">
      
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#0a0a0a] border-b border-white/12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ListFilter className="w-4 h-4 text-[#dfff00]" />
          <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            Transaction Ledger
          </h3>
          <Badge variant="cyan" className="text-[10px] py-0 px-1.5 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dfff00] animate-pulse" />
            LIVE
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/70">
            {transactions.length} Attempt{transactions.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Main List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-black scrollbar-thin scrollbar-thumb-white/20">
        
        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[#0a0a0a] border border-white/12 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#dfff00]" />
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold text-[#dfff00] uppercase">
                Failed to load transaction ledger
              </h4>
              <p className="text-xs text-white/70 max-w-sm">{error}</p>
            </div>
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry} className="text-xs font-mono gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </Button>
            )}
          </div>
        ) : transactions.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2 text-white/60 font-mono">
            <HelpCircle className="w-8 h-8 text-white/40" />
            <p className="text-xs">No transaction attempts recorded yet.</p>
            <p className="text-[11px] text-white/50">
              Trigger an attack or legitimate offer in Demo Controls above to see real-time ledger entries.
            </p>
          </div>
        ) : (
          /* Transaction Rows */
          <AnimatePresence initial={false}>
            {transactions.map((attempt) => {
              const isSelected = selectedAttemptId === attempt.id
              const isBlocked = attempt.status === "blocked"
              const isExecuted = attempt.status === "executed"
              const isDeclined = attempt.status === "declined"

              return (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelectAttempt(attempt)}
                  className={`group relative rounded-xl p-3.5 border transition-all cursor-pointer select-none ${
                    isSelected
                      ? "bg-black border-[#dfff00] shadow-[0_0_20px_rgba(223,255,0,0.14)]"
                      : "bg-[#050505] hover:bg-[#0a0a0a] border-white/12 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    
                    {/* Left: Status Icon & Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      
                      {/* Status Icon */}
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                          isBlocked
                            ? "bg-black border-[#dfff00]/70 text-[#dfff00] shadow-[0_0_10px_rgba(223,255,0,0.2)]"
                            : isExecuted
                            ? "bg-black border-white/50 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                            : isDeclined
                            ? "bg-black border-white/30 text-white/80"
                            : "bg-black border-white/15 text-white/50"
                        }`}
                      >
                        {isBlocked && <ShieldAlert className="w-5 h-5 text-[#dfff00]" />}
                        {isExecuted && <CheckCircle2 className="w-5 h-5 text-white" />}
                        {isDeclined && <AlertTriangle className="w-5 h-5 text-white/80" />}
                        {!isBlocked && !isExecuted && !isDeclined && <Clock className="w-5 h-5" />}
                      </div>

                      {/* Info lines */}
                      <div className="min-w-0 space-y-0.5">
                        
                        {/* Line 1: Attempt ID & Amount */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-white">
                            {attempt.id}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#dfff00]">
                            {formatNativeAmount(attempt.amountWei, 18, "MST")}
                          </span>
                          
                          {/* Attack badge if present */}
                          {attempt.attackType && (
                            <Badge variant="cyan" className="text-[9px] py-0 px-1">
                              {ATTACK_TYPE_HUMAN_LABELS[attempt.attackType] || attempt.attackType}
                            </Badge>
                          )}
                        </div>

                        {/* Line 2: Counterparty */}
                        <p className="text-xs text-white/70 font-mono truncate">
                          To: {truncateAddress(attempt.counterpartyAddress, 6, 4)}
                        </p>

                        {/* Line 3: Exact Reason Code & Sentence for Blocked */}
                        {isBlocked && (() => {
                          const code = attempt.blockReasonCode !== null && attempt.blockReasonCode !== undefined && attempt.blockReasonCode !== 0
                            ? attempt.blockReasonCode
                            : 1;
                          const label = REASON_CODE_LABELS[code] || "EXCEEDS_MAX_PER_TX";
                          const human = (attempt.blockReason && !attempt.blockReason.includes("reason code 0"))
                            ? attempt.blockReason
                            : REASON_CODE_HUMAN_TEXT[code] || "Per-transaction spending limit exceeded";
                          return (
                            <div className="mt-1 pt-1 border-t border-white/10 text-[11px] font-mono text-[#dfff00]">
                              <span className="font-bold">
                                #{code} {label}:
                              </span>{" "}
                              <span>{human}</span>
                            </div>
                          );
                        })()}

                        {/* Line 3 for Declined */}
                        {isDeclined && (
                          <p className="text-[11px] font-mono text-white/80">
                            Declined by Good Agent reasoner.
                          </p>
                        )}

                      </div>
                    </div>

                    {/* Right: Status Badge & Chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isBlocked && (
                        <Badge variant="red" className="font-bold gap-1 text-[10px]">
                          BLOCKED BY CHARTER
                        </Badge>
                      )}
                      {isExecuted && (
                        <Badge variant="emerald" className="font-bold gap-1 text-[10px]">
                          EXECUTED ON-CHAIN
                        </Badge>
                      )}
                      {isDeclined && (
                        <Badge variant="amber" className="font-bold gap-1 text-[10px]">
                          DECLINED BY AGENT
                        </Badge>
                      )}
                      {!isBlocked && !isExecuted && !isDeclined && (
                        <Badge variant="neutral" className="font-bold gap-1 text-[10px]">
                          {attempt.status.toUpperCase()}
                        </Badge>
                      )}

                      <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-[#dfff00] transition-colors" />
                    </div>

                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}

      </div>
    </Card>
  )
}
