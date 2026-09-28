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
    <Card className="w-full bg-slate-950/95 border-slate-800 p-4 lg:p-5 shadow-xl relative overflow-hidden">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/20 via-violet-950/20 to-red-950/20 pointer-events-none" />

      <div className="relative z-10 space-y-4">
        
        {/* Header Title & Core Thesis Statement */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h4 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              WHY THIS CAN'T BE TALKED OUT OF IT
            </h4>
            <p className="text-xs text-slate-300 font-sans font-medium mt-0.5">
              The model can propose. The charter enforces.
            </p>
          </div>

          <Badge variant="cyan" className="text-[10px] py-0.5 px-2">
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
            className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 relative"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                STAGE 1
              </span>
              <h5 className="text-xs font-bold font-mono text-slate-100 uppercase">
                LLM Decision
              </h5>
              <p className="text-[11px] text-slate-400 font-sans">
                Agent evaluates prompt proposal
              </p>
            </div>
          </motion.div>

          {/* Connection Arrow 1 */}
          <div className="hidden md:flex justify-center -mx-2 text-slate-600">
            <ArrowRight className="w-5 h-5 text-cyan-500/60 animate-pulse" />
          </div>

          {/* STAGE 2: SPENDING CHARTER ON-CHAIN POLICY CHECK */}
          <motion.div
            key={`stage2-${selectedAttempt?.id}`}
            initial={{ opacity: 0.6, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              isBlocked
                ? "bg-red-950/40 border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                : isExecuted
                ? "bg-emerald-950/40 border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                : "bg-slate-900/80 border-cyan-500/40"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isBlocked
                  ? "bg-red-950 border-red-500/60 text-red-400"
                  : isExecuted
                  ? "bg-emerald-950 border-emerald-500/60 text-emerald-400"
                  : "bg-cyan-950 border-cyan-500/40 text-cyan-400"
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                STAGE 2
              </span>
              <h5 className="text-xs font-bold font-mono text-slate-100 uppercase">
                Spending Charter
              </h5>
              <p className="text-[11px] text-slate-400 font-sans">
                Solidity smart contract check
              </p>
            </div>
          </motion.div>

          {/* Connection Arrow 2 */}
          <div className="hidden md:flex justify-center -mx-2 text-slate-600">
            <ArrowRight className="w-5 h-5 text-cyan-500/60 animate-pulse" />
          </div>

          {/* STAGE 3: RESULT */}
          <motion.div
            key={`stage3-${selectedAttempt?.id}`}
            initial={{ opacity: 0.6, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              isBlocked
                ? "bg-red-950/60 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]"
                : isExecuted
                ? "bg-emerald-950/60 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                : isDeclined
                ? "bg-amber-950/60 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                : "bg-slate-900/80 border-slate-800"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isBlocked
                  ? "bg-red-950 border-red-500 text-red-400"
                  : isExecuted
                  ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                  : isDeclined
                  ? "bg-amber-950 border-amber-500 text-amber-400"
                  : "bg-slate-900 border-slate-700 text-slate-400"
              }`}
            >
              {isBlocked && <ShieldAlert className="w-5 h-5 animate-pulse" />}
              {isExecuted && <ShieldCheck className="w-5 h-5" />}
              {isDeclined && <AlertTriangle className="w-5 h-5" />}
              {!isBlocked && !isExecuted && !isDeclined && <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                STAGE 3: FINAL RESULT
              </span>
              <h5
                className={`text-xs font-bold font-mono uppercase ${
                  isBlocked
                    ? "text-red-400"
                    : isExecuted
                    ? "text-emerald-400"
                    : isDeclined
                    ? "text-amber-400"
                    : "text-slate-200"
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
              <p className="text-[11px] text-slate-300 font-sans">
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
