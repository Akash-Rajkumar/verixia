import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  UserX,
  FileCode2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatNativeAmount, truncateAddress } from "@/lib/format"
import { REASON_CODE_LABELS, REASON_CODE_HUMAN_TEXT } from "@/api/constants"
import { api } from "@/api"
import type { CharterRules, CharterStatus, TransactionAttempt } from "@/api/types"

export interface CharterPanelProps {
  rules: CharterRules | null
  status: CharterStatus | null
  selectedAttempt?: TransactionAttempt | null
}

export const CharterPanel: React.FC<CharterPanelProps> = ({
  rules,
  status,
  selectedAttempt,
}) => {
  const [counterparties, setCounterparties] = useState<
    { address: string; name: string; status: "allowed" | "denied" }[]
  >([])

  useEffect(() => {
    async function loadCounterparties() {
      try {
        const list = await api.getCharterCounterparties()
        setCounterparties(list)
      } catch (err) {
        console.error("Failed to load counterparties:", err)
      }
    }
    loadCounterparties()
  }, [])

  // Safely compute percentage of daily cap used via BigInt ratio
  const dailyCapRatio = React.useMemo(() => {
    if (!rules || !status) return 0
    try {
      const cap = BigInt(rules.dailyCapWei)
      if (cap === 0n) return 0
      const spent = BigInt(status.spentInWindowWei)
      return Math.min(100, Math.max(0, Number((spent * 100n) / cap)))
    } catch {
      return 0
    }
  }, [rules, status])

  // Is selected attempt a blocked event?
  const isSelectedBlocked = selectedAttempt?.status === "blocked"

  // Compute requested amount ratio relative to max per tx cap for visual policy boundary line crossing animation
  const selectedAttemptBoundaryCrossingRatio = React.useMemo(() => {
    if (!selectedAttempt || !rules) return null
    try {
      const maxPerTx = BigInt(rules.maxPerTxWei)
      if (maxPerTx === 0n) return 100
      const requested = BigInt(selectedAttempt.amountWei)
      return Math.min(150, Math.max(0, Number((requested * 100n) / maxPerTx)))
    } catch {
      return null
    }
  }, [selectedAttempt, rules])

  return (
    <Card className="w-full bg-[#101432]/90 border-indigo-900/40 shadow-2xl p-5 flex flex-col space-y-5">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1d163e]/90 border border-violet-500/50 flex items-center justify-center shadow-[0_0_18px_rgba(124,108,245,0.3)]">
            <Lock className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-mono text-[#f1f2ff] uppercase tracking-wider">
                Spending Charter
              </h3>
              <Badge variant="violet" className="text-[10px] py-0 px-1.5">
                ON-CHAIN ENFORCEMENT
              </Badge>
            </div>
            <p className="text-xs text-[#c4c7dc]">
              Hard-coded Solidity rules outside LLM boundary
            </p>
          </div>
        </div>

        {/* Contract Address & Status Card */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {isSelectedBlocked ? (
            <Badge variant="red" className="gap-1 shadow-[0_0_15px_rgba(251,79,99,0.3)] animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
              BLOCKED EVENT ACTIVE
            </Badge>
          ) : dailyCapRatio > 80 ? (
            <Badge variant="amber" className="gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              LIMIT APPROACHING
            </Badge>
          ) : (
            <Badge variant="emerald" className="gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              ENFORCEMENT ACTIVE
            </Badge>
          )}
        </div>
      </div>

      {/* BLOCKED TRANSACTION POLICY BOUNDARY CROSSING VISUALIZATION */}
      {isSelectedBlocked && selectedAttempt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="p-4 bg-[#250d19]/90 border border-rose-500/60 rounded-xl space-y-3 shadow-[0_0_20px_rgba(251,79,99,0.2)]"
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
              <span>CHARTER REJECTED: #{selectedAttempt.blockReasonCode} {REASON_CODE_LABELS[selectedAttempt.blockReasonCode || 0]}</span>
            </div>
            <span className="text-rose-400 font-bold">
              Attempt: {formatNativeAmount(selectedAttempt.amountWei, 18, "MST")}
            </span>
          </div>

          <p className="text-xs text-rose-200 font-sans">
            {selectedAttempt.blockReason || REASON_CODE_HUMAN_TEXT[selectedAttempt.blockReasonCode || 0]}
          </p>

          {/* Visual Boundary Line Crossing Animation */}
          <div className="relative pt-4 pb-2">
            <div className="text-[10px] font-mono text-[#c4c7dc] flex justify-between mb-1">
              <span>0 MST</span>
              <span className="text-cyan-400 font-bold">Limit: {formatNativeAmount(rules?.maxPerTxWei, 18, "MST")}</span>
              <span className="text-rose-400 font-bold">Requested: {formatNativeAmount(selectedAttempt.amountWei, 18, "MST")}</span>
            </div>

            {/* Base Bar */}
            <div className="w-full h-3 bg-[#080a16] rounded-full overflow-hidden relative border border-indigo-900/40">
              {/* Allowed Policy Limit zone */}
              <div className="absolute left-0 top-0 bottom-0 bg-cyan-950/80 border-r-2 border-cyan-400 w-2/3" />
              
              {/* Requested Amount Bar crossing the limit */}
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(100, (selectedAttemptBoundaryCrossingRatio || 120) * 0.75)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-rose-600 to-rose-500 shadow-[0_0_15px_rgba(251,79,99,0.8)]"
              />
            </div>

            {/* Warning Shield Marker */}
            <div className="absolute right-4 top-2 text-rose-400 font-mono text-[10px] font-bold uppercase flex items-center gap-1">
              <span>⚠️ POLICY BOUNDARY EXCEEDED</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rules & Limits Grid Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        
        {/* Gauge 1: Max Per Tx */}
        <div className="p-4 bg-[#0a0d24]/80 border border-indigo-900/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#c4c7dc]">MAX PER TX</span>
            <span className="text-cyan-300 font-bold">
              {formatNativeAmount(rules?.maxPerTxWei, 18, "MST")}
            </span>
          </div>
          <div className="w-full h-2 bg-[#080a16] rounded-full overflow-hidden border border-indigo-900/40">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 w-full" />
          </div>
          <span className="text-[10px] text-[#858aa6] block">
            Non-negotiable per-tx hard cap
          </span>
        </div>

        {/* Gauge 2: Human Approval Threshold */}
        <div className="p-4 bg-[#0a0d24]/80 border border-indigo-900/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#c4c7dc]">HUMAN APPROVAL</span>
            <span className="text-amber-300 font-bold">
              {formatNativeAmount(rules?.humanApprovalThresholdWei, 18, "MST")}
            </span>
          </div>
          <div className="w-full h-2 bg-[#080a16] rounded-full overflow-hidden border border-indigo-900/40">
            <div className="h-full bg-gradient-to-r from-amber-500 to-violet-500 w-3/4" />
          </div>
          <span className="text-[10px] text-[#858aa6] block">
            Requires human confirmation above threshold
          </span>
        </div>

        {/* Gauge 3: Daily Cap & Usage Gauge */}
        <div className="p-4 bg-[#0a0d24]/80 border border-indigo-900/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#c4c7dc]">DAILY CAP USAGE</span>
            <span className="text-emerald-300 font-bold">
              {dailyCapRatio}% SPENT
            </span>
          </div>

          <div className="w-full h-2 bg-[#080a16] rounded-full overflow-hidden border border-indigo-900/40">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dailyCapRatio}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-400"
            />
          </div>

          <div className="flex justify-between text-[10px] text-[#858aa6]">
            <span>Spent: {formatNativeAmount(status?.spentInWindowWei, 18, "MST")}</span>
            <span>Rem: {formatNativeAmount(status?.remainingInWindowWei, 18, "MST")}</span>
          </div>
        </div>

      </div>

      {/* Account Balance & Counterparties Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Account Balance & Contract info */}
        <div className="p-4 bg-[#0a0d24]/60 border border-indigo-900/40 rounded-xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#c4c7dc] uppercase">Account Balance</span>
            <span className="text-base font-bold text-[#f1f2ff]">
              {formatNativeAmount(status?.balanceWei, 18, "MST")}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-indigo-900/40 text-[11px]">
            <span className="text-[#858aa6] flex items-center gap-1">
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" /> Contract:
            </span>
            <span className="text-cyan-300">
              {truncateAddress(rules?.contractAddress, 8, 6)}
            </span>
          </div>
        </div>

        {/* Counterparty Allow/Deny List */}
        <div className="p-4 bg-[#0a0d24]/60 border border-indigo-900/40 rounded-xl space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#c4c7dc] uppercase">Counterparty Policy List</span>
            <Badge variant="cyan" className="text-[9px] py-0">
              {rules?.allowListEnabled ? "ALLOW-LIST STRICT" : "DISABLED"}
            </Badge>
          </div>

          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {counterparties.map((cp) => (
              <div
                key={cp.address}
                className="flex items-center justify-between p-1.5 rounded bg-[#080a16]/80 border border-indigo-900/30 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  {cp.status === "allowed" ? (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <UserX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span className="text-[#f1f2ff]">{cp.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#858aa6] text-[10px]">{truncateAddress(cp.address, 6, 4)}</span>
                  <Badge variant={cp.status === "allowed" ? "emerald" : "red"} className="text-[9px] py-0 px-1">
                    {cp.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </Card>
  )
}

