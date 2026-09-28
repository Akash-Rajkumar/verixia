import React from "react"
import { motion } from "framer-motion"
import { Cpu, ShieldAlert, ShieldCheck, ArrowRight, CheckCircle2, Lock, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { REASON_CODE_LABELS } from "@/api/constants"
import type { TransactionAttempt } from "@/api/types"

export interface ExplainerStripProps {
  selectedAttempt?: TransactionAttempt | null
}

export const ExplainerStrip: React.FC<ExplainerStripProps> = ({ selectedAttempt }) => {
  const isBlocked = selectedAttempt?.status === "blocked"
  const isExecuted = selectedAttempt?.status === "executed"
  const isDeclined = selectedAttempt?.status === "declined"

  return (
    <Card className="w-full bg-[#0c1024]/95 border-indigo-900/40 p-4 lg:p-5 shadow-[0_4px_24px_rgba(8,10,22,0.6)] relative overflow-hidden">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/20 via-violet-950/25 to-rose-950/20 pointer-events-none" />

      <div className="relative z-10 space-y-4">
        
        {/* Header Title & Core Thesis Statement */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-900/40 pb-3">
          <div>
            <h4 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              WHY THIS CAN'T BE TALKED OUT OF IT
            </h4>
            <p className="text-xs text-[#c4c7dc] font-sans font-medium mt-0.5">
              The model can propose. The charter enforces.
            </p>
          </div>

          <Badge variant="violet" className="text-[10px] py-0.5 px-2">
            ON-CHAIN SECURITY PARADIGM
          </Badge>
        </div>

        {/* 3 Connected Stages Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* STAGE 1: LLM DECISION */}
          <motion.div
            key={`stage1-${selectedAttempt?.id}`}
            initial={{ opacity: 0.6, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-3.5 rounded-xl bg-[#09152a]/80 border border-cyan-900/40 flex items-center gap-3 relative shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(34,211,238,0.2)]">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#858aa6] uppercase tracking-wider block">
                STAGE 1
              </span>
              <h5 className="text-xs font-bold font-mono text-[#f1f2ff] uppercase">
                LLM Decision
              </h5>
              <p className="text-[11px] text-[#c4c7dc] font-sans">
                Agent evaluates prompt proposal
              </p>
            </div>
          </motion.div>

          {/* Connection Arrow 1 */}
          <div className="hidden md:flex justify-center -mx-2 text-[#7c86b8]">
            <ArrowRight className="w-5 h-5 text-violet-400/80 animate-pulse" />
          </div>

          {/* STAGE 2: SPENDING CHARTER ON-CHAIN POLICY CHECK */}
          <motion.div
            key={`stage2-${selectedAttempt?.id}`}
            initial={{ opacity: 0.6, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              isBlocked
                ? "bg-[#250d19]/90 border-rose-500/70 shadow-[0_0_18px_rgba(251,79,99,0.25)]"
                : isExecuted
                ? "bg-[#092723]/90 border-emerald-500/70 shadow-[0_0_18px_rgba(52,211,153,0.25)]"
                : "bg-[#121638]/90 border-violet-500/40"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isBlocked
                  ? "bg-[#30101e] border-rose-500/60 text-rose-400"
                  : isExecuted
                  ? "bg-[#0a2f26] border-emerald-500/60 text-emerald-400"
                  : "bg-[#1d163e] border-violet-500/50 text-violet-300"
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#858aa6] uppercase tracking-wider block">
                STAGE 2
              </span>
              <h5 className="text-xs font-bold font-mono text-[#f1f2ff] uppercase">
                Spending Charter
              </h5>
              <p className="text-[11px] text-[#c4c7dc] font-sans">
                Solidity smart contract check
              </p>
            </div>
          </motion.div>

          {/* Connection Arrow 2 */}
          <div className="hidden md:flex justify-center -mx-2 text-[#7c86b8]">
            <ArrowRight className="w-5 h-5 text-violet-400/80 animate-pulse" />
          </div>

          {/* STAGE 3: RESULT */}
          <motion.div
            key={`stage3-${selectedAttempt?.id}`}
            initial={{ opacity: 0.6, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              isBlocked
                ? "bg-[#2b0c16]/95 border-rose-500 shadow-[0_0_20px_rgba(251,79,99,0.35)]"
                : isExecuted
                ? "bg-[#092723]/95 border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.35)]"
                : isDeclined
                ? "bg-[#2a1a0c]/95 border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.25)]"
                : "bg-[#0c1024]/90 border-indigo-900/40"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isBlocked
                  ? "bg-[#30101e] border-rose-500 text-rose-400"
                  : isExecuted
                  ? "bg-[#0a2f26] border-emerald-500 text-emerald-400"
                  : isDeclined
                  ? "bg-[#2e200a] border-amber-500 text-amber-400"
                  : "bg-[#101535] border-indigo-900/50 text-[#7c86b8]"
              }`}
            >
              {isBlocked && <ShieldAlert className="w-5 h-5 animate-pulse text-rose-400" />}
              {isExecuted && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
              {isDeclined && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isBlocked && !isExecuted && !isDeclined && <CheckCircle2 className="w-5 h-5 text-[#7c86b8]" />}
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#858aa6] uppercase tracking-wider block">
                STAGE 3: FINAL RESULT
              </span>
              <h5
                className={`text-xs font-bold font-mono uppercase ${
                  isBlocked
                    ? "text-rose-300"
                    : isExecuted
                    ? "text-emerald-300"
                    : isDeclined
                    ? "text-amber-300"
                    : "text-[#f1f2ff]"
                }`}
              >
                {isBlocked
                  ? `BLOCKED (${REASON_CODE_LABELS[selectedAttempt?.blockReasonCode || 0] || "CHARTER"})`
                  : isExecuted
                  ? "EXECUTED ON-CHAIN"
                  : isDeclined
                  ? "DECLINED BY AGENT"
                  : selectedAttempt?.status.toUpperCase() || "NO EVENT SELECTED"}
              </h5>
              <p className="text-[11px] text-[#c4c7dc] font-sans">
                {isBlocked
                  ? "Enforcement boundary held."
                  : isExecuted
                  ? "Policy checks satisfied."
                  : isDeclined
                  ? "Declined before execution."
                  : "Awaiting active attempt."}
              </p>
            </div>
          </motion.div>

        </div>

      </div>
    </Card>
  )
}

