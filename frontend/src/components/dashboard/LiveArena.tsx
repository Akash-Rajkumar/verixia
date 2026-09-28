import React, { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldAlert, ShieldCheck, Terminal, AlertOctagon, UserX, Cpu } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { truncateAddress } from "@/lib/format"
import { ATTACK_TYPE_HUMAN_LABELS } from "@/api/constants"
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
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  // Helper to map message to its transaction attempt policy result
  const findAttemptForMessage = (msgId: string): TransactionAttempt | undefined => {
    return transactions.find((t) => t.triggerMessageId === msgId)
  }

  return (
    <Card className="w-full bg-slate-950/90 border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[520px]">
      
      {/* Arena Header */}
      <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-slate-200 uppercase">
            Live Adversarial Arena Stream
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono text-cyan-400 font-semibold">
            {messages.length} MESSAGES CAPTURED
          </span>
        </div>
      </div>

      {/* Arena Split Header: BAD AGENT vs GOOD AGENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-900/50 border-b border-slate-800 text-xs font-mono">
        {/* LEFT: BAD AGENT */}
        <div className="p-3 border-r border-slate-800 flex items-center justify-between bg-red-950/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-red-950 border border-red-500/50 flex items-center justify-center">
              <UserX className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <div className="font-bold text-red-400 flex items-center gap-1.5">
                <span>{badAgent?.name || "Malicious Adversary (Bad Agent)"}</span>
                <Badge variant="red" className="text-[9px] py-0 px-1">ADVERSARY</Badge>
              </div>
              <div className="text-[10px] text-slate-400">
                Wallet: {truncateAddress(badAgent?.walletAddress || "0x90F79bf6EB2c4f870365E785982E1f101E93b906")}
              </div>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-red-400" />
            {badAgent?.modelProvider || "Ollama / Attack Script"}
          </div>
        </div>

        {/* RIGHT: GOOD AGENT */}
        <div className="p-3 flex items-center justify-between bg-cyan-950/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <span>{goodAgent?.name || "Verixia Sentinel (Good Agent)"}</span>
                <Badge variant="cyan" className="text-[9px] py-0 px-1">DEFENDER</Badge>
              </div>
              <div className="text-[10px] text-slate-400">
                Wallet: {truncateAddress(goodAgent?.walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F")}
              </div>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            {goodAgent?.modelProvider || "Gemini 1.5 Pro"}
          </div>
        </div>
      </div>

      {/* Messages Feed Container */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/60"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm font-mono space-y-2">
              <ShieldAlert className="w-10 h-10 text-slate-700 animate-pulse" />
              <p>No active message exchanges captured yet.</p>
              <p className="text-xs text-slate-400">Use Demo Controls below to trigger an attack or offer.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isBadAgent = msg.senderAgentId === "agent-bad-01" || msg.messageType === "attack"
              const attempt = findAttemptForMessage(msg.id)

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex flex-col ${isBadAgent ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-xl p-3.5 border transition-all shadow-lg ${
                      msg.messageType === "attack"
                        ? "bg-red-950/40 border-red-500/50 shadow-[0_0_18px_rgba(239,68,68,0.2)]"
                        : isBadAgent
                        ? "bg-slate-900/90 border-slate-800"
                        : "bg-cyan-950/30 border-cyan-500/30"
                    }`}
                  >
                    {/* Header line: Sender, Timestamp, Attack Badge */}
                    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-1.5 mb-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            isBadAgent ? "text-red-400" : "text-cyan-300"
                          }`}
                        >
                          {isBadAgent ? "BAD AGENT" : "GOOD AGENT"}
                        </span>

                        {/* Threat Badge */}
                        {msg.attackType && (
                          <Badge variant="red" className="gap-1 text-[10px]">
                            <AlertOctagon className="w-3 h-3" />
                            {ATTACK_TYPE_HUMAN_LABELS[msg.attackType] || msg.attackType.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Message Body Content */}
                    <p className="text-sm text-slate-200 font-sans leading-relaxed break-words">
                      {msg.content}
                    </p>

                    {/* Outcome Tag if transaction policy result is associated */}
                    {attempt && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                        <span className="text-[11px] text-slate-400">Spending Charter Result:</span>
                        {attempt.status === "blocked" && (
                          <Badge variant="red" className="gap-1 font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                            BLOCKED BY CHARTER ({attempt.blockReasonCode})
                          </Badge>
                        )}
                        {attempt.status === "declined" && (
                          <Badge variant="amber" className="gap-1 font-bold">
                            DECLINED BY AGENT
                          </Badge>
                        )}
                        {attempt.status === "executed" && (
                          <Badge variant="emerald" className="gap-1 font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            EXECUTED ON-CHAIN
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

    </Card>
  )
}
