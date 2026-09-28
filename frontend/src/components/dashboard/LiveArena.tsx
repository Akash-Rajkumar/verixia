import React, { useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  ArrowRight,
  History,
  Lock,
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

  // Map message to transaction attempt policy result
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

  // Group messages into paired EventRows
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

      // Case 3: Standalone Good Agent / Counterparty Message (Legitimate Offer)
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

  // Current / Hero Event Pair (the most recent non-system event)
  const heroEvent = useMemo(() => {
    for (let i = eventPairs.length - 1; i >= 0; i--) {
      if (!eventPairs[i].isSystem) return eventPairs[i]
    }
    return null
  }, [eventPairs])

  // Historical event pairs (excluding current hero event)
  const historicalPairs = useMemo(() => {
    if (!heroEvent) return eventPairs
    return eventPairs.filter((p) => p.id !== heroEvent.id)
  }, [eventPairs, heroEvent])

  // Auto-scroll timeline to top when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [eventPairs.length])

  return (
    <Card className="w-full bg-black border-white/15 shadow-2xl overflow-hidden flex flex-col min-h-[640px] rounded-3xl relative">
      
      {/* 1. ARENA HEADER */}
      <div className="px-6 py-4 bg-[#0a0a0a] border-b border-white/12 flex items-center justify-between shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#dfff00] animate-pulse shadow-[0_0_10px_rgba(223,255,0,0.8)]" />
          <h2 className="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">
            <span>LIVE ADVERSARIAL ARENA</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/70 font-medium">
          <span className="text-[#dfff00] font-bold">{messages.length}</span>
          <span>events · REALTIME STREAM</span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col p-6 space-y-6">
        
        {/* 2. AGENT PROFILE CARDS & CENTRAL VS INTERACTION STAGE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* LEFT: BAD AGENT PROFILE CARD (col-span-5) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-4 bg-[#050505] border border-white/12 hover:border-[#dfff00]/50 rounded-2xl p-5 flex flex-col items-center text-center space-y-3.5 shadow-xl transition-all duration-300 relative group"
          >
            {/* Ambient Yellow Glow */}
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(223,255,0,0.04)_0%,transparent_70%)] pointer-events-none" />

            {/* Large Avatar Circle with Outer Pulse Ring */}
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center my-1">
              <div className="absolute inset-0 rounded-full border border-white/15 animate-spin [animation-duration:12s]" />
              <div className="absolute -inset-1 rounded-full border border-[#dfff00]/40 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-black border border-[#dfff00]/60 flex items-center justify-center shadow-[0_0_20px_rgba(223,255,0,0.25)] relative z-10">
                <ShieldAlert className="w-8 h-8 text-[#dfff00]" />
              </div>
            </div>

            {/* Title & Roles */}
            <div>
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-base font-extrabold font-mono text-white tracking-wider">
                  {badAgent?.name || "Malicious Adversary"}
                </h3>
              </div>
              <p className="text-xs text-white/50 font-sans mt-0.5">
                Adversarial AI Prompt Injector
              </p>
            </div>

            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full bg-black border border-[#dfff00]/60 text-[#dfff00] font-bold">
                ADVERSARIAL
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black border border-white/20 text-white/80">
                ● {badAgent?.modelProvider?.toUpperCase() || "OLLAMA"}
              </span>
            </div>

            <div className="text-[10px] font-mono text-white/40 pt-1">
              {truncateAddress(badAgent?.walletAddress || "0x90F79bf6EB2c4f870365E785982E1f101E93b906", 8, 6)}
            </div>
          </motion.div>

          {/* CENTER: INTERACTION VS & SIGNAL FLOW (col-span-4) */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-3 px-2">
            
            <div className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center font-mono font-extrabold text-xs text-white shadow-md">
              VS
            </div>

            {/* Signal Flow Indicator */}
            <div className="w-full flex items-center justify-center gap-2 font-mono text-[11px] text-[#dfff00]">
              <span className="text-white/40">BAD AGENT</span>
              <span className="animate-pulse">●───────→</span>
              <span className="text-[#dfff00] font-bold">CHARTER</span>
            </div>

            <div className="text-[10px] font-mono text-white/50 tracking-wider">
              REAL-TIME INTERCEPTION PIPELINE
            </div>
          </div>

          {/* RIGHT: GOOD AGENT PROFILE CARD (col-span-5) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-4 bg-[#050505] border border-white/12 hover:border-white/30 rounded-2xl p-5 flex flex-col items-center text-center space-y-3.5 shadow-xl transition-all duration-300 relative group"
          >
            {/* Ambient White Glow */}
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />

            {/* Large Avatar Circle */}
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center my-1">
              <div className="absolute inset-0 rounded-full border border-white/20 animate-spin [animation-duration:15s]" />
              <div className="w-16 h-16 rounded-full bg-black border border-white/40 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] relative z-10">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title & Roles */}
            <div>
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-base font-extrabold font-mono text-white tracking-wider">
                  {goodAgent?.name || "Verixia Sentinel"}
                </h3>
              </div>
              <p className="text-xs text-white/50 font-sans mt-0.5">
                Autonomous Safeguard Sentinel
              </p>
            </div>

            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full bg-black border border-white/40 text-white font-bold">
                DEFENDER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black border border-white/20 text-white/80">
                ● {goodAgent?.modelProvider?.toUpperCase() || "GEMINI"}
              </span>
            </div>

            <div className="text-[10px] font-mono text-white/40 pt-1">
              {truncateAddress(goodAgent?.walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", 8, 6)}
            </div>
          </motion.div>

        </div>

        {/* 3. HERO / CURRENT ACTIVE EVENT SPOTLIGHT CARD */}
        <div className="flex-1 flex flex-col justify-center">
          {eventPairs.length === 0 ? (
            /* EMPTY STATE */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#050505] border border-white/12 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-black border border-[#dfff00]/60 flex items-center justify-center text-[#dfff00] shadow-[0_0_20px_rgba(223,255,0,0.25)]">
                <ShieldAlert className="w-6 h-6 text-[#dfff00] animate-pulse" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                WAITING FOR ADVERSARIAL ACTIVITY
              </h3>
              <p className="text-xs text-white/60 max-w-md font-sans leading-relaxed">
                Run an attack sequence from the Demo Controls panel below to observe real-time Spending Charter enforcement and policy receipts.
              </p>
            </motion.div>
          ) : heroEvent ? (
            /* HERO EVENT PRESENTATION */
            <AnimatePresence mode="wait">
              <motion.div
                key={heroEvent.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="bg-[#050505] border border-white/15 rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl relative overflow-hidden"
              >
                {/* Subtle Glow backdrop */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(223,255,0,0.04)_0%,transparent_65%)] pointer-events-none" />

                {/* Hero Event Top Status & Attack Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/12 pb-3 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50 uppercase tracking-widest block">
                      CURRENT ACTIVE EVENT
                    </span>
                    {heroEvent.badMessage?.attackType && (
                      <Badge variant="cyan" className="text-[10px] py-0.5 px-2">
                        ⚠️ {ATTACK_TYPE_HUMAN_LABELS[heroEvent.badMessage.attackType] || heroEvent.badMessage.attackType.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-white/50">
                    {new Date(heroEvent.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* 2-Column Split: Attack Request vs Policy Outcome */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  
                  {/* Left: Bad Agent Input Attack (col-span-7) */}
                  <div className="md:col-span-7 space-y-2">
                    {heroEvent.badMessage ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-[#dfff00] font-bold uppercase tracking-wider block">
                          ADVERSARIAL PROMPT INJECTION INPUT
                        </span>
                        <div className="p-4 rounded-xl bg-black border border-[#dfff00]/50 shadow-[0_0_15px_rgba(223,255,0,0.12)] text-xs font-sans text-white leading-relaxed">
                          "{heroEvent.badMessage.content}"
                        </div>
                      </div>
                    ) : heroEvent.goodMessage?.messageType === "offer" ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-[#dfff00] font-bold uppercase tracking-wider block">
                          COUNTERPARTY PAYMENT OFFER
                        </span>
                        <div className="p-4 rounded-xl bg-black border border-[#dfff00]/50 text-xs font-sans text-white leading-relaxed">
                          "{heroEvent.goodMessage.content}"
                        </div>
                      </div>
                    ) : null}

                    {/* Good Agent Evaluation Response if paired */}
                    {heroEvent.goodMessage && (
                      <div className="pt-2">
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mb-1">
                          SENTINEL EVALUATION
                        </span>
                        <p className="text-xs font-sans text-white/80 bg-black/60 p-3 rounded-lg border border-white/10">
                          {heroEvent.goodMessage.content}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Charter Outcome Card (col-span-5) */}
                  <div className="md:col-span-5 flex flex-col justify-center items-center text-center p-5 bg-black border border-white/20 rounded-xl space-y-2.5">
                    {heroEvent.attempt?.status === "blocked" && (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-black border border-[#dfff00] flex items-center justify-center text-[#dfff00] shadow-[0_0_20px_rgba(223,255,0,0.3)] animate-pulse">
                          <ShieldX className="w-7 h-7 text-[#dfff00]" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold font-mono text-[#dfff00] uppercase tracking-wider block">
                            BLOCKED BY SPENDING CHARTER
                          </span>
                          <span className="text-[10px] font-mono text-white/70 block mt-0.5">
                            {heroEvent.attempt.blockReasonCode !== null
                              ? REASON_CODE_LABELS[heroEvent.attempt.blockReasonCode] || `CODE_${heroEvent.attempt.blockReasonCode}`
                              : "POLICY_VIOLATION"}
                          </span>
                        </div>
                      </>
                    )}

                    {heroEvent.attempt?.status === "executed" && (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-black border border-white/50 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                          <CheckCircle2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold font-mono text-white uppercase tracking-wider block">
                            EXECUTED ON-CHAIN
                          </span>
                          <span className="text-[10px] font-mono text-white/70 block mt-0.5">
                            Policy checks satisfied
                          </span>
                        </div>
                      </>
                    )}

                    {heroEvent.attempt?.status === "declined" && (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-black border border-white/30 flex items-center justify-center text-white/80">
                          <ArrowRight className="w-7 h-7 text-white/80" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold font-mono text-white/90 uppercase tracking-wider block">
                            DECLINED BY AGENT
                          </span>
                          <span className="text-[10px] font-mono text-white/60 block mt-0.5">
                            Reasoner rejected proposal
                          </span>
                        </div>
                      </>
                    )}

                    {!heroEvent.attempt && (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-black border border-white/15 flex items-center justify-center text-white/40">
                          <Lock className="w-7 h-7 text-white/40" />
                        </div>
                        <span className="text-xs font-bold font-mono text-white/60 uppercase">
                          EVALUATING ON-CHAIN...
                        </span>
                      </>
                    )}
                  </div>

                </div>

              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>

        {/* 4. COMPACT LIVE EVENT TIMELINE HISTORY */}
        <div className="border-t border-white/12 pt-4 space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-white/60">
            <span className="flex items-center gap-1.5 font-bold uppercase text-white">
              <History className="w-3.5 h-3.5 text-[#dfff00]" /> RECENT ARENA EVENTS
            </span>
            <span>{eventPairs.length} total</span>
          </div>

          <div
            ref={scrollRef}
            className="max-h-36 overflow-y-auto space-y-2 pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-white/20"
          >
            {historicalPairs.length === 0 ? (
              <div className="p-3 bg-[#050505] border border-white/10 rounded-xl text-center text-[11px] text-white/40">
                Recent stream events will populate here as attacks execute.
              </div>
            ) : (
              historicalPairs.map((pair) => {
                if (pair.isSystem) return null

                const isBlocked = pair.attempt?.status === "blocked"
                const isExecuted = pair.attempt?.status === "executed"

                return (
                  <div
                    key={pair.id}
                    className="p-2.5 rounded-xl bg-[#050505] border border-white/10 flex items-center justify-between gap-3 hover:border-white/25 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] text-white/40 shrink-0">
                        {new Date(pair.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="font-bold text-white text-xs truncate">
                        {pair.badMessage?.attackType
                          ? ATTACK_TYPE_HUMAN_LABELS[pair.badMessage.attackType]
                          : "AGENT TRANSACTION"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isBlocked && (
                        <Badge variant="red" className="text-[9px] py-0 px-1.5">
                          BLOCKED BY CHARTER
                        </Badge>
                      )}
                      {isExecuted && (
                        <Badge variant="emerald" className="text-[9px] py-0 px-1.5">
                          EXECUTED ON-CHAIN
                        </Badge>
                      )}
                      {!isBlocked && !isExecuted && (
                        <Badge variant="neutral" className="text-[9px] py-0 px-1.5">
                          {pair.attempt?.status.toUpperCase() || "EVENT"}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

    </Card>
  )
}
