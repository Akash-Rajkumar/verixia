import React, { useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { truncateAddress } from "@/lib/format"
import { ATTACK_TYPE_HUMAN_LABELS, REASON_CODE_LABELS } from "@/api/constants"
import type { Agent, Message, TransactionAttempt } from "@/api/types"

export interface LiveArenaProps {
  goodAgent: Agent | null
  badAgent: Agent | null
  messages: Message[]
  transactions?: TransactionAttempt[]
}

interface EventPair {
  id: string
  badMessage?: Message
  goodMessage?: Message
  attempt?: TransactionAttempt
  isSystem?: boolean
  systemContent?: string
  timestamp: string
}

export const LiveArena: React.FC<LiveArenaProps> = ({
  goodAgent,
  badAgent,
  messages,
  transactions = [],
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Helper to map message to its transaction attempt policy result
  const findAttemptForMessage = (msgId: string): TransactionAttempt | undefined => {
    return transactions.find((t) => t.triggerMessageId === msgId)
  }

  // Classify if message originated from Bad Agent
  const isBadAgentMessage = (msg: Message): boolean => {
    return (
      msg.senderAgentId === "agent-bad-01" ||
      msg.messageType === "attack" ||
      msg.attackType !== null
    )
  }

  // Group messages into paired EventRows (Bad Attack + Good Sentinel Response + Security Result)
  const eventPairs = useMemo<EventPair[]>(() => {
    const pairs: EventPair[] = []
    let i = 0

    while (i < messages.length) {
      const msg = messages[i]

      // Case 1: System Event Message
      if (msg.messageType === "system") {
        pairs.push({
          id: msg.id,
          isSystem: true,
          systemContent: msg.content,
          timestamp: msg.createdAt,
        })
        i++
        continue
      }

      // Case 2: Bad Agent Attack Message
      if (isBadAgentMessage(msg)) {
        const nextMsg = messages[i + 1]
        let pairedGoodMsg: Message | undefined = undefined

        // Check if next message is the Good Agent reply/response
        if (nextMsg && !isBadAgentMessage(nextMsg) && nextMsg.messageType !== "system") {
          pairedGoodMsg = nextMsg
        }

        const attempt =
          findAttemptForMessage(msg.id) ||
          (pairedGoodMsg ? findAttemptForMessage(pairedGoodMsg.id) : undefined)

        pairs.push({
          id: `pair-${msg.id}`,
          badMessage: msg,
          goodMessage: pairedGoodMsg,
          attempt,
          timestamp: msg.createdAt,
        })

        i += pairedGoodMsg ? 2 : 1
        continue
      }

      // Case 3: Standalone Good Agent / Counterparty Message (e.g., Legitimate Offer)
      const attempt = findAttemptForMessage(msg.id)
      pairs.push({
        id: `pair-${msg.id}`,
        goodMessage: msg,
        attempt,
        timestamp: msg.createdAt,
      })
      i++
    }

    return pairs
  }, [messages, transactions])

  // Auto-scroll to bottom of single scroll container when events update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [eventPairs.length])

  return (
    <Card className="w-full bg-[#040609] border-slate-800/80 shadow-2xl overflow-hidden flex flex-col h-[580px] rounded-2xl">
      
      {/* 1. ARENA HEADER */}
      <div className="px-5 py-3 bg-[#070a0f] border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs font-bold font-mono tracking-widest text-zinc-200 uppercase flex items-center gap-2">
            <span>LIVE ATTACK SIMULATION</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 font-medium">
          <span className="text-zinc-300 font-semibold">{messages.length}</span>
          <span>events · LIVE</span>
        </div>
      </div>

      {/* 2. AGENT SUB-HEADERS (FIXED TOP ROW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-[#06080e] border-b border-slate-800/80 shrink-0 text-xs font-mono">
        
        {/* LEFT SUB-HEADER: BAD AGENT */}
        <div className="p-3 border-b md:border-b-0 md:border-r border-slate-800/80 flex items-center justify-between bg-[#0e0709]/80">
          <div className="flex items-center gap-2.5">
            <span className="text-sm">🔴</span>
            <div>
              <div className="font-bold text-red-400 flex items-center gap-2">
                <span>{badAgent?.name || "Malicious Adversary"}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950/60 border border-red-900/40 text-red-400 font-mono">
                  BAD AGENT
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                {truncateAddress(badAgent?.walletAddress || "0x90F79bf6EB2c4f870365E785982E1f101E93b906")} · {badAgent?.modelProvider?.toUpperCase() || "OLLAMA"}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SUB-HEADER: GOOD AGENT */}
        <div className="p-3 flex items-center justify-between bg-[#060d16]/80">
          <div className="flex items-center gap-2.5">
            <span className="text-sm">🔵</span>
            <div>
              <div className="font-bold text-cyan-300 flex items-center gap-2">
                <span>{goodAgent?.name || "Verixia Sentinel"}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-900/40 text-cyan-400 font-mono">
                  GOOD AGENT
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                {truncateAddress(goodAgent?.walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F")} · {goodAgent?.modelProvider?.toUpperCase() || "GEMINI"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONVERSATIONAL STREAM (ONE SHARED SCROLL CONTAINER) */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#030507] scrollbar-thin scrollbar-thumb-slate-800/60"
      >
        {eventPairs.length === 0 ? (
          /* EMPTY STATE */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-zinc-500">
              <ShieldAlert className="w-6 h-6 text-zinc-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider">
                Waiting for an adversarial request...
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">
                Run an attack sequence from the Demo Controls panel below to observe real-time policy enforcement.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {eventPairs.map((pair) => {
              // System event rendering
              if (pair.isSystem) {
                return (
                  <motion.div
                    key={pair.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center my-2"
                  >
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-slate-900/40 border border-slate-800/60 px-3 py-1 rounded-full">
                      ─── {pair.systemContent} ───
                    </div>
                  </motion.div>
                )
              }

              const attackLabel = pair.badMessage?.attackType
                ? ATTACK_TYPE_HUMAN_LABELS[pair.badMessage.attackType] || pair.badMessage.attackType.toUpperCase()
                : "MALICIOUS REQUEST"

              const isOffer = pair.goodMessage?.messageType === "offer"

              return (
                <motion.div
                  key={pair.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-xl border border-slate-800/40 bg-[#06080d]/60 p-3.5 hover:border-slate-700/50 transition-colors shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    
                    {/* LEFT COLUMN: BAD AGENT ATTACK BUBBLE */}
                    <div className="w-full">
                      {pair.badMessage ? (
                        <div className="bg-[#13090b] border border-red-900/30 rounded-xl p-3 text-xs text-zinc-200 shadow-sm">
                          <div className="flex items-center justify-between border-b border-red-950/60 pb-1.5 mb-2 text-[10px] font-mono">
                            <span className="font-semibold text-red-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              {attackLabel}
                            </span>
                            <span className="text-zinc-500 font-mono">
                              {new Date(pair.badMessage.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="font-sans leading-relaxed text-zinc-200">
                            "{pair.badMessage.content}"
                          </p>
                        </div>
                      ) : (
                        <div className="hidden md:block opacity-0"></div>
                      )}
                    </div>

                    {/* CENTER COLUMN: OUTCOME / POLICY INDICATOR */}
                    <div className="flex items-center justify-center my-1 md:my-0 px-2 shrink-0">
                      {pair.attempt?.status === "blocked" && (
                        <div className="flex flex-col items-center justify-center text-center px-2.5 py-1.5 bg-red-950/70 border border-red-500/40 rounded-xl shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                          <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                            <ShieldX className="w-3.5 h-3.5 text-red-400" />
                            <span>BLOCKED BY CHARTER</span>
                          </div>
                          <span className="text-[9px] font-mono text-red-300/80 mt-0.5 uppercase tracking-tight">
                            {pair.attempt.blockReasonCode !== null
                              ? REASON_CODE_LABELS[pair.attempt.blockReasonCode] || `CODE_${pair.attempt.blockReasonCode}`
                              : "POLICY_VIOLATION"}
                          </span>
                        </div>
                      )}

                      {pair.attempt?.status === "executed" && (
                        <div className="flex flex-col items-center justify-center text-center px-2.5 py-1.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>EXECUTED ON-CHAIN</span>
                          </div>
                        </div>
                      )}

                      {pair.attempt?.status === "declined" && (
                        <div className="flex flex-col items-center justify-center text-center px-2.5 py-1.5 bg-amber-950/70 border border-amber-500/40 rounded-xl">
                          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                            <span>DECLINED BY AGENT</span>
                          </div>
                        </div>
                      )}

                      {!pair.attempt && (
                        <div className="text-zinc-600 font-mono text-xs flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 opacity-40" />
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: GOOD AGENT RESPONSE BUBBLE */}
                    <div className="w-full">
                      {pair.goodMessage ? (
                        <div
                          className={`rounded-xl p-3 text-xs text-zinc-200 border shadow-sm ${
                            isOffer
                              ? "bg-[#051710] border-emerald-900/40"
                              : "bg-[#09111a] border-cyan-900/40"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2 text-[10px] font-mono">
                            <span
                              className={`font-semibold flex items-center gap-1.5 ${
                                isOffer ? "text-emerald-400" : "text-cyan-400"
                              }`}
                            >
                              {isOffer ? (
                                <>
                                  <Zap className="w-3 h-3 text-emerald-400" />
                                  COUNTERPARTY OFFER
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                                  VERIXIA SENTINEL
                                </>
                              )}
                            </span>
                            <span className="text-zinc-500 font-mono">
                              {new Date(pair.goodMessage.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="font-sans leading-relaxed text-zinc-200">
                            {pair.goodMessage.content}
                          </p>
                        </div>
                      ) : (
                        <div className="hidden md:block opacity-0"></div>
                      )}
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
