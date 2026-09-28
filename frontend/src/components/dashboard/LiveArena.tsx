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
    <Card className="w-full bg-black border-white/15 shadow-2xl overflow-hidden flex flex-col h-[580px] rounded-2xl">
      
      {/* 1. ARENA HEADER */}
      <div className="px-5 py-3.5 bg-[#0a0a0a] border-b border-white/12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#dfff00] animate-pulse shadow-[0_0_8px_rgba(223,255,0,0.8)]" />
          <h2 className="text-xs font-bold font-mono tracking-widest text-white uppercase flex items-center gap-2">
            <span>LIVE ATTACK SIMULATION</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/70 font-medium">
          <span className="text-[#dfff00] font-bold">{messages.length}</span>
          <span>events · LIVE</span>
        </div>
      </div>

      {/* 2. AGENT SUB-HEADERS (FIXED TOP ROW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-[#050505] border-b border-white/12 shrink-0 text-xs font-mono">
        
        {/* LEFT SUB-HEADER: BAD AGENT */}
        <div className="p-3.5 border-b md:border-b-0 md:border-r border-white/12 flex items-center justify-between bg-black/90">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#dfff00] animate-ping" />
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{badAgent?.name || "Malicious Adversary"}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black border border-[#dfff00]/60 text-[#dfff00] font-mono font-bold">
                  BAD AGENT
                </span>
              </div>
              <div className="text-[10px] text-white/50 mt-0.5 font-mono">
                {truncateAddress(badAgent?.walletAddress || "0x90F79bf6EB2c4f870365E785982E1f101E93b906")} · {badAgent?.modelProvider?.toUpperCase() || "OLLAMA"}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SUB-HEADER: GOOD AGENT */}
        <div className="p-3.5 flex items-center justify-between bg-black/90">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{goodAgent?.name || "Verixia Sentinel"}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black border border-white/30 text-white font-mono">
                  GOOD AGENT
                </span>
              </div>
              <div className="text-[10px] text-white/50 mt-0.5 font-mono">
                {truncateAddress(goodAgent?.walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F")} · {goodAgent?.modelProvider?.toUpperCase() || "GEMINI"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONVERSATIONAL STREAM */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-black scrollbar-thin scrollbar-thumb-white/20"
      >
        {eventPairs.length === 0 ? (
          /* EMPTY STATE */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-black border border-[#dfff00]/50 flex items-center justify-center text-[#dfff00] shadow-[0_0_20px_rgba(223,255,0,0.2)]">
              <ShieldAlert className="w-6 h-6 text-[#dfff00] animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Waiting for an adversarial request...
              </h3>
              <p className="text-[11px] text-white/60 mt-1 max-w-sm">
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
                    <div className="text-[10px] font-mono text-white/60 uppercase tracking-widest bg-black border border-white/15 px-3 py-1 rounded-full">
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
                  className="rounded-xl border border-white/12 bg-[#050505] p-3.5 hover:border-white/25 transition-colors shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    
                    {/* LEFT COLUMN: BAD AGENT ATTACK BUBBLE */}
                    <div className="w-full">
                      {pair.badMessage ? (
                        <div className="bg-black border border-[#dfff00]/50 rounded-xl p-3 text-xs text-white shadow-[0_0_15px_rgba(223,255,0,0.1)]">
                          <div className="flex items-center justify-between border-b border-white/12 pb-1.5 mb-2 text-[10px] font-mono">
                            <span className="font-bold text-[#dfff00] flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-[#dfff00]" />
                              {attackLabel}
                            </span>
                            <span className="text-white/50 font-mono">
                              {new Date(pair.badMessage.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="font-sans leading-relaxed text-white">
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
                        <div className="flex flex-col items-center justify-center text-center px-3 py-1.5 bg-black border border-[#dfff00]/70 rounded-xl shadow-[0_0_20px_rgba(223,255,0,0.2)] animate-pulse">
                          <div className="flex items-center gap-1.5 text-[#dfff00] text-[10px] font-mono font-bold uppercase tracking-wider">
                            <ShieldX className="w-3.5 h-3.5 text-[#dfff00]" />
                            <span>BLOCKED BY CHARTER</span>
                          </div>
                          <span className="text-[9px] font-mono text-white/70 mt-0.5 uppercase tracking-tight">
                            {pair.attempt.blockReasonCode !== null
                              ? REASON_CODE_LABELS[pair.attempt.blockReasonCode] || `CODE_${pair.attempt.blockReasonCode}`
                              : "POLICY_VIOLATION"}
                          </span>
                        </div>
                      )}

                      {pair.attempt?.status === "executed" && (
                        <div className="flex flex-col items-center justify-center text-center px-3 py-1.5 bg-black border border-white/40 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                          <div className="flex items-center gap-1.5 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>EXECUTED ON-CHAIN</span>
                          </div>
                        </div>
                      )}

                      {pair.attempt?.status === "declined" && (
                        <div className="flex flex-col items-center justify-center text-center px-3 py-1.5 bg-black border border-white/25 rounded-xl">
                          <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-mono font-bold uppercase tracking-wider">
                            <ArrowRight className="w-3.5 h-3.5 text-white/70" />
                            <span>DECLINED BY AGENT</span>
                          </div>
                        </div>
                      )}

                      {!pair.attempt && (
                        <div className="text-white/40 font-mono text-xs flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 opacity-40 text-[#dfff00]" />
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: GOOD AGENT RESPONSE BUBBLE */}
                    <div className="w-full">
                      {pair.goodMessage ? (
                        <div
                          className={`rounded-xl p-3 text-xs text-white border shadow-sm bg-black ${
                            isOffer
                              ? "border-[#dfff00]/50 shadow-[0_0_15px_rgba(223,255,0,0.12)]"
                              : "border-white/25"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2 text-[10px] font-mono">
                            <span
                              className={`font-semibold flex items-center gap-1.5 ${
                                isOffer ? "text-[#dfff00]" : "text-white"
                              }`}
                            >
                              {isOffer ? (
                                <>
                                  <Zap className="w-3 h-3 text-[#dfff00]" />
                                  COUNTERPARTY OFFER
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3 h-3 text-white" />
                                  VERIXIA SENTINEL
                                </>
                              )}
                            </span>
                            <span className="text-white/50 font-mono">
                              {new Date(pair.goodMessage.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="font-sans leading-relaxed text-white">
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
