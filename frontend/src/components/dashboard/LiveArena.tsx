import React, { useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  AlertOctagon,
  UserX,
  Cpu,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { truncateAddress } from "@/lib/format"
import { ATTACK_TYPE_HUMAN_LABELS, REASON_CODE_LABELS } from "@/api/constants"
import type { Agent, Message, TransactionAttempt } from "@/api/types"

export interface LiveArenaProps {
  goodAgent: Agent | null
  badAgent: Agent | null
  messages: Message[]
  transactions?: TransactionAttempt[]
}

export const LiveArena: React.FC<LiveArenaProps> = ({
  goodAgent,
  badAgent,
  messages,
  transactions = [],
}) => {
  const badScrollRef = useRef<HTMLDivElement>(null)
  const goodScrollRef = useRef<HTMLDivElement>(null)

  // Classify messages into Bad Agent (Left) vs Good Agent (Right)
  const isBadAgentMessage = (msg: Message): boolean => {
    return (
      msg.senderAgentId === "agent-bad-01" ||
      msg.messageType === "attack" ||
      msg.attackType !== null
    )
  }

  const badAgentMessages = useMemo(() => {
    return messages.filter((m) => isBadAgentMessage(m))
  }, [messages])

  const goodAgentMessages = useMemo(() => {
    return messages.filter((m) => !isBadAgentMessage(m))
  }, [messages])

  // Independent auto-scrolling per lane
  useEffect(() => {
    if (badScrollRef.current) {
      badScrollRef.current.scrollTop = badScrollRef.current.scrollHeight
    }
  }, [badAgentMessages.length])

  useEffect(() => {
    if (goodScrollRef.current) {
      goodScrollRef.current.scrollTop = goodScrollRef.current.scrollHeight
    }
  }, [goodAgentMessages.length])

  // Helper to map message to its transaction attempt policy result
  const findAttemptForMessage = (msgId: string): TransactionAttempt | undefined => {
    return transactions.find((t) => t.triggerMessageId === msgId)
  }

  // Check if latest transaction attempt was blocked for the central security pulse indicator
  const latestAttempt = transactions.length > 0 ? transactions[transactions.length - 1] : null
  const isLatestBlocked = latestAttempt?.status === "blocked"

  return (
    <Card className="w-full bg-[#05070a] border-slate-800/90 shadow-2xl overflow-hidden flex flex-col h-[580px] rounded-2xl">
      
      {/* 1. ARENA HEADER */}
      <div className="px-5 py-3 bg-[#070a0f] border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-mono tracking-widest text-slate-100 uppercase flex items-center gap-2">
              <span>&gt;_ LIVE ADVERSARIAL ARENA</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-mono text-cyan-400 font-semibold tracking-wider">
              {messages.length} EVENTS CAPTURED // LIVE
            </span>
          </div>
        </div>
      </div>

      {/* 2. AGENT IDENTITY HEADERS (SPLIT TOP BAR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-[#06080d] border-b border-slate-800/80 shrink-0 text-xs font-mono">
        
        {/* LEFT HEADER: BAD AGENT */}
        <div className="p-3.5 border-b md:border-b-0 md:border-r border-slate-800/80 flex items-center justify-between bg-[#0f0608]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]">
              <UserX className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="font-bold text-red-400 flex items-center gap-2">
                <span className="text-sm tracking-wide">{badAgent?.name || "Malicious Adversary"}</span>
                <Badge variant="red" className="text-[9px] py-0 px-1.5 font-mono">
                  BAD AGENT
                </Badge>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>WALLET: <span className="text-slate-300 font-semibold">{truncateAddress(badAgent?.walletAddress || "0x90F79bf6EB2c4f870365E785982E1f101E93b906")}</span></span>
              </div>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400 flex items-center gap-1.5 bg-red-950/30 border border-red-900/40 px-2 py-1 rounded">
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            <span className="font-semibold text-slate-300">{badAgent?.modelProvider?.toUpperCase() || "OLLAMA"}</span>
          </div>
        </div>

        {/* RIGHT HEADER: GOOD AGENT */}
        <div className="p-3.5 flex items-center justify-between bg-[#050e17]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="font-bold text-cyan-300 flex items-center gap-2">
                <span className="text-sm tracking-wide">{goodAgent?.name || "Verixia Sentinel"}</span>
                <Badge variant="cyan" className="text-[9px] py-0 px-1.5 font-mono">
                  GOOD AGENT
                </Badge>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>WALLET: <span className="text-slate-300 font-semibold">{truncateAddress(goodAgent?.walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F")}</span></span>
              </div>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400 flex items-center gap-1.5 bg-cyan-950/30 border border-cyan-900/40 px-2 py-1 rounded">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">{goodAgent?.modelProvider?.toUpperCase() || "GEMINI 1.5 PRO"}</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN ARENA CONTENT CONTAINER (2-COLUMN SPLIT WITH CENTRAL DIVIDER) */}
      <div className="flex-1 relative overflow-hidden bg-[#040609]">
        
        {messages.length === 0 ? (
          /* EMPTY STATE */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold font-mono text-slate-200 tracking-wider uppercase mb-1">
              WAITING FOR ADVERSARIAL ACTIVITY
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Run an attack sequence from the Demo Controls panel below to test Verixia's on-chain Spending Charter enforcement in real time.
            </p>
          </div>
        ) : (
          <div className="h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 relative">
            
            {/* CENTRAL SECURITY DIVIDER OVERLAY (DESKTOP ONLY) */}
            <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex-col items-center justify-between py-4">
              <div className="bg-[#0b1019] border border-slate-700/80 text-cyan-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-lg tracking-widest">
                VS
              </div>

              {/* Animated Shield Trigger on Blocked State */}
              <AnimatePresence>
                {isLatestBlocked && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-red-950/90 border border-red-500/80 text-red-400 px-2.5 py-1 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.5)] flex flex-col items-center gap-0.5"
                  >
                    <Shield className="w-4 h-4 text-red-400 animate-bounce" />
                    <span className="text-[9px] font-mono font-extrabold uppercase tracking-tighter">
                      CHARTER BLOCKED
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-[#0b1019] border border-slate-800 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-tighter opacity-80">
                SECURITY BOUNDARY
              </div>
            </div>

            {/* LEFT LANE: BAD AGENT (ATTACKS) */}
            <div
              ref={badScrollRef}
              className="p-4 overflow-y-auto space-y-3.5 bg-[#0a0507]/40 h-full scrollbar-thin scrollbar-thumb-slate-800"
            >
              <div className="text-[10px] font-mono font-semibold text-red-500/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertOctagon className="w-3 h-3 text-red-400" />
                <span>ATTACK STREAM ({badAgentMessages.length})</span>
              </div>

              <AnimatePresence initial={false}>
                {badAgentMessages.map((msg) => {
                  const attempt = findAttemptForMessage(msg.id)
                  const attackLabel = msg.attackType
                    ? ATTACK_TYPE_HUMAN_LABELS[msg.attackType] || msg.attackType.toUpperCase()
                    : "MALICIOUS PROMPT"

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-full"
                    >
                      <div className="rounded-xl p-3.5 bg-[#16080b]/90 border border-red-500/40 text-slate-100 shadow-[0_0_18px_rgba(239,68,68,0.15)] transition-all hover:border-red-500/60">
                        
                        {/* Header: Attack Label & Timestamp */}
                        <div className="flex items-center justify-between gap-2 border-b border-red-500/20 pb-2 mb-2 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <Badge variant="red" className="gap-1 text-[10px] font-bold tracking-wider py-0.5">
                              <AlertOctagon className="w-3 h-3" />
                              {attackLabel}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-red-300/60 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Attack Content Prompt */}
                        <p className="text-xs text-slate-200 font-mono leading-relaxed break-words bg-black/40 p-2.5 rounded-lg border border-red-950/60">
                          "{msg.content}"
                        </p>

                        {/* Status Footer */}
                        <div className="mt-2.5 pt-2 border-t border-red-500/20 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 text-[10px]">THREAT STATUS:</span>
                          {attempt?.status === "blocked" ? (
                            <Badge variant="red" className="gap-1 font-bold text-[10px] shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                              <Shield className="w-3 h-3 text-red-400" />
                              BLOCKED BY CHARTER
                            </Badge>
                          ) : (
                            <Badge variant="red" className="gap-1 font-bold text-[10px]">
                              <AlertTriangle className="w-3 h-3" />
                              ATTACK DETECTED
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* RIGHT LANE: GOOD AGENT (RESPONSES & EVALUATIONS) */}
            <div
              ref={goodScrollRef}
              className="p-4 overflow-y-auto space-y-3.5 bg-[#050b14]/40 h-full scrollbar-thin scrollbar-thumb-slate-800"
            >
              <div className="text-[10px] font-mono font-semibold text-cyan-500/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>SENTINEL RESPONSE STREAM ({goodAgentMessages.length})</span>
              </div>

              <AnimatePresence initial={false}>
                {goodAgentMessages.map((msg) => {
                  const attempt = findAttemptForMessage(msg.id)
                  const isOffer = msg.messageType === "offer"

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 20, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-full"
                    >
                      <div
                        className={`rounded-xl p-3.5 border transition-all shadow-lg ${
                          isOffer
                            ? "bg-[#051710]/90 border-emerald-500/40 text-slate-100 shadow-[0_0_18px_rgba(16,185,129,0.15)] hover:border-emerald-500/60"
                            : "bg-[#07131e]/90 border-cyan-500/40 text-slate-100 shadow-[0_0_18px_rgba(6,182,212,0.15)] hover:border-cyan-500/60"
                        }`}
                      >
                        {/* Header: Sentinel / Offer Tag & Timestamp */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            {isOffer ? (
                              <Badge variant="emerald" className="gap-1 text-[10px] font-bold tracking-wider py-0.5">
                                <Zap className="w-3 h-3 text-emerald-400" />
                                COUNTERPARTY OFFER
                              </Badge>
                            ) : (
                              <Badge variant="cyan" className="gap-1 text-[10px] font-bold tracking-wider py-0.5">
                                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                                VERIXIA SENTINEL
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Content Text */}
                        <p className="text-xs text-slate-200 font-mono leading-relaxed break-words bg-black/40 p-2.5 rounded-lg border border-slate-800">
                          {msg.content}
                        </p>

                        {/* Status Footer */}
                        {attempt && (
                          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-400 text-[10px]">CHARTER RESULT:</span>

                            {attempt.status === "blocked" && (
                              <Badge variant="red" className="gap-1 font-bold text-[10px] shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                <XCircle className="w-3 h-3 text-red-400" />
                                BLOCKED ({attempt.blockReasonCode !== null ? REASON_CODE_LABELS[attempt.blockReasonCode] || attempt.blockReasonCode : "POLICY"})
                              </Badge>
                            )}

                            {attempt.status === "declined" && (
                              <Badge variant="amber" className="gap-1 font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                DECLINED BY AGENT
                              </Badge>
                            )}

                            {attempt.status === "executed" && (
                              <Badge variant="emerald" className="gap-1 font-bold text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                EXECUTED ON-CHAIN
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

    </Card>
  )
}
