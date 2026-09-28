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
    <Card className="w-full bg-black border-white/15 p-4 lg:p-5 shadow-2xl relative overflow-hidden rounded-2xl">
      
      {/* Background Subtle Yellow Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(223,255,0,0.03)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 space-y-4">
        
        {/* Header Title & Core Thesis Statement */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/12 pb-3">
          <div>
            <h4 className="text-xs font-bold font-mono text-[#dfff00] uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#dfff00]" />
              WHY THIS CAN'T BE TALKED OUT OF IT
            </h4>
            <p className="text-xs text-white/70 font-sans font-medium mt-0.5">
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
            className="p-3.5 rounded-xl bg-[#0a0a0a] border border-white/15 flex items-center gap-3 relative shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-black border border-white/30 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                STAGE 1
              </span>
              <h5 className="text-xs font-bold font-mono text-white uppercase">
                LLM Decision
              </h5>
              <p className="text-[11px] text-white/70 font-sans">
                Agent evaluates prompt proposal
              </p>
            </div>
          </motion.div>

          {/* Connection Arrow 1 */}
          <div className="hidden md:flex justify-center -mx-2 text-white/40">
            <ArrowRight className="w-5 h-5 text-[#dfff00] animate-pulse" />
          </div>

          {/* STAGE 2: SPENDING CHARTER ON-CHAIN POLICY CHECK */}
          <motion.div
            key={`stage2-${selectedAttempt?.id}`}
            initial={{ opacity: 0.6, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              isBlocked
                ? "bg-black border-[#dfff00] shadow-[0_0_18px_rgba(223,255,0,0.2)]"
                : isExecuted
                ? "bg-black border-white/50 shadow-[0_0_18px_rgba(255,255,255,0.1)]"
                : "bg-[#0a0a0a] border-white/20"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isBlocked
                  ? "bg-black border-[#dfff00] text-[#dfff00]"
                  : isExecuted
                  ? "bg-black border-white text-white"
                  : "bg-black border-white/30 text-white/70"
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                STAGE 2
              </span>
              <h5 className="text-xs font-bold font-mono text-white uppercase">
                Spending Charter
              </h5>
              <p className="text-[11px] text-white/70 font-sans">
                Solidity smart contract check
              </p>
            </div>
          </motion.div>

          {/* Connection Arrow 2 */}
          <div className="hidden md:flex justify-center -mx-2 text-white/40">
            <ArrowRight className="w-5 h-5 text-[#dfff00] animate-pulse" />
          </div>

          {/* STAGE 3: RESULT */}
          <motion.div
            key={`stage3-${selectedAttempt?.id}`}
            initial={{ opacity: 0.6, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              isBlocked
                ? "bg-black border-[#dfff00] shadow-[0_0_20px_rgba(223,255,0,0.25)]"
                : isExecuted
                ? "bg-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                : isDeclined
                ? "bg-[#0a0a0a] border-white/40"
                : "bg-black border-white/12"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isBlocked
                  ? "bg-black border-[#dfff00] text-[#dfff00]"
                  : isExecuted
                  ? "bg-black border-white text-white"
                  : isDeclined
                  ? "bg-black border-white/40 text-white/80"
                  : "bg-black border-white/15 text-white/50"
              }`}
            >
              {isBlocked && <ShieldAlert className="w-5 h-5 animate-pulse text-[#dfff00]" />}
              {isExecuted && <ShieldCheck className="w-5 h-5 text-white" />}
              {isDeclined && <AlertTriangle className="w-5 h-5 text-white/80" />}
              {!isBlocked && !isExecuted && !isDeclined && <CheckCircle2 className="w-5 h-5 text-white/40" />}
            </div>
            <div>
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                STAGE 3: FINAL RESULT
              </span>
              <h5
                className={`text-xs font-bold font-mono uppercase ${
                  isBlocked
                    ? "text-[#dfff00]"
                    : "text-white"
                }`}
              >
                {isBlocked
                  ? `BLOCKED (${REASON_CODE_LABELS[(selectedAttempt?.blockReasonCode !== null && selectedAttempt?.blockReasonCode !== undefined && selectedAttempt?.blockReasonCode !== 0) ? selectedAttempt.blockReasonCode : 1] || "EXCEEDS_MAX_PER_TX"})`
                  : isExecuted
                  ? "EXECUTED ON-CHAIN"
                  : isDeclined
                  ? "DECLINED BY AGENT"
                  : selectedAttempt?.status.toUpperCase() || "NO EVENT SELECTED"}
              </h5>
              <p className="text-[11px] text-white/70 font-sans">
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
