import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Maximize2,
  Lock,
  CheckCircle2,
  ArrowRight,
  Info,
  Radio,
  Zap,
} from "lucide-react"
import { TopBar } from "./TopBar"
import { LiveArena } from "./LiveArena"
import { DemoControls } from "./DemoControls"
import { TransactionLedger } from "./TransactionLedger"
import { CharterPanel } from "./CharterPanel"
import { ReputationPanel } from "./ReputationPanel"
import { ReasoningReceiptViewer } from "./ReasoningReceiptViewer"
import { ExplainerStrip } from "./ExplainerStrip"
import { TransactionDetail } from "./TransactionDetail"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLiveFeed } from "@/hooks/useLiveFeed"
import { api } from "@/api"
import { formatNativeAmount, truncateAddress } from "@/lib/format"
import { REASON_CODE_LABELS, REASON_CODE_HUMAN_TEXT, ATTACK_TYPE_HUMAN_LABELS } from "@/api/constants"
import type { Agent, CharterRules, CharterStatus, Message, PublicConfig, TransactionAttempt } from "@/api/types"

export interface VerixiaCommandCenterProps {
  onBackToLanding?: () => void
}

export const VerixiaCommandCenter: React.FC<VerixiaCommandCenterProps> = ({ onBackToLanding }) => {
  const { connectionMode, refreshSignal, refetchNow } = useLiveFeed()

  const [config, setConfig] = useState<PublicConfig | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [transactions, setTransactions] = useState<TransactionAttempt[]>([])
  const [charterRules, setCharterRules] = useState<CharterRules | null>(null)
  const [charterStatus, setCharterStatus] = useState<CharterStatus | null>(null)

  // Single source of truth for selected transaction attempt
  const [selectedAttempt, setSelectedAttempt] = useState<TransactionAttempt | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

  // Presentation Mode & Fullscreen state
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Load initial dashboard data from API abstraction
  const loadData = useCallback(async () => {
    try {
      setApiError(null)
      const [cfg, agtList, msgList, txRes, rulesRes, statusRes] = await Promise.all([
        api.getPublicConfig(),
        api.getAgents(),
        api.getConversationMessages("conv-demo-01"),
        api.getTransactions({ limit: 50 }),
        api.getCharterRules(),
        api.getCharterStatus(),
      ])

      setConfig(cfg)
      setAgents(agtList)
      setMessages(msgList)
      setTransactions(txRes.items)
      setCharterRules(rulesRes)
      setCharterStatus(statusRes)

      // Auto-select first transaction if none selected
      if (!selectedAttempt && txRes.items.length > 0) {
        setSelectedAttempt(txRes.items[0])
      }
    } catch (err: unknown) {
      console.error("Failed to load command center data:", err)
      setApiError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [selectedAttempt])

  // Initial boot load & refetch when live feed signal triggers
  useEffect(() => {
    loadData()
  }, [loadData, refreshSignal])

  // Good and Bad agent instances
  const goodAgent = useMemo(
    () => agents.find((a) => a.role === "good") || null,
    [agents]
  )
  const badAgent = useMemo(
    () => agents.find((a) => a.role === "bad") || null,
    [agents]
  )

  // Compute dynamic scoreboard stats from authoritative transaction data
  const scoreboard = useMemo(() => {
    let blocked = 0
    let declined = 0
    let succeeded = 0

    transactions.forEach((tx) => {
      if (tx.status === "blocked") blocked++
      else if (tx.status === "declined") declined++
      else if (tx.status === "executed") succeeded++
    })

    return { blocked, declined, succeeded }
  }, [transactions])

  // Most recent attempt for the active banner summary
  const heroAttempt = useMemo(() => {
    if (selectedAttempt) return selectedAttempt
    return transactions.length > 0 ? transactions[0] : null
  }, [selectedAttempt, transactions])

  // Dynamic Status Sentence explaining "WHAT IS HAPPENING RIGHT NOW"
  const dynamicStatusSentence = useMemo(() => {
    if (!heroAttempt) {
      return "Waiting for adversarial attack activity or payment proposal..."
    }
    const formattedAmount = formatNativeAmount(heroAttempt.amountWei, 18, "MST")
    if (heroAttempt.status === "blocked") {
      const humanReason = heroAttempt.blockReasonCode !== null
        ? REASON_CODE_HUMAN_TEXT[heroAttempt.blockReasonCode] || heroAttempt.blockReason
        : "Policy boundary enforced"
      return `Adversarial transfer request of ${formattedAmount} BLOCKED by Spending Charter — ${humanReason}.`
    }
    if (heroAttempt.status === "executed") {
      return `Payment of ${formattedAmount} EXECUTED ON-CHAIN after satisfying Spending Charter rules.`
    }
    if (heroAttempt.status === "declined") {
      return `Transaction proposal of ${formattedAmount} DECLINED by Sentinel reasoning engine.`
    }
    return `Evaluating ${formattedAmount} transaction proposal against Spending Charter...`
  }, [heroAttempt])

  // Handle selecting transaction row
  const handleSelectAttempt = (attempt: TransactionAttempt) => {
    setSelectedAttempt(attempt)
    setIsDetailOpen(true)
  }

  // Toggle Presentation Mode & Fullscreen API
  const togglePresentationMode = useCallback(() => {
    setIsPresentationMode((prev) => {
      const next = !prev
      if (next) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {})
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {})
        }
      }
      return next
    })
  }, [])

  // Keyboard shortcut listener ('P' toggles Presentation Mode, 'Escape' exits)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toUpperCase()
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return
      }

      if (e.key === "p" || e.key === "P") {
        e.preventDefault()
        togglePresentationMode()
      } else if (e.key === "Escape" && isPresentationMode) {
        setIsPresentationMode(false)
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {})
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [togglePresentationMode, isPresentationMode])

  // ACTION HANDLERS
  const handleRunSequence = async () => {
    setIsProcessingAction(true)
    try {
      const res = await api.runAttackSequence({ conversationId: "conv-demo-01" })
      await loadData()
      refetchNow()
      if (res.runs.length > 0 && res.runs[0].attempt) {
        setSelectedAttempt(res.runs[0].attempt)
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to run attack sequence")
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleRunAttack = async (
    attackType: "urgent_pretext" | "prompt_injection" | "fake_trust_claim"
  ) => {
    setIsProcessingAction(true)
    try {
      const res = await api.runBadAgentAttack({
        conversationId: "conv-demo-01",
        attackType,
      })
      await loadData()
      refetchNow()
      if (res.attempt) {
        setSelectedAttempt(res.attempt)
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : `Failed to execute ${attackType} attack`)
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleLegitimateOffer = async () => {
    setIsProcessingAction(true)
    try {
      const res = await api.createCounterpartyOffer({
        conversationId: "conv-demo-01",
        counterpartyAgentId: "agent-vendor-01",
        amountWei: "1500000000000000000", // 1.5 MST
        description: "Requesting payment of 1.5 MST for verified batch inference compute job #8841.",
      })
      await loadData()
      refetchNow()
      if (res.attempt) {
        setSelectedAttempt(res.attempt)
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to submit legitimate offer")
    } finally {
      setIsProcessingAction(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-4 font-mono">
        <div className="w-12 h-12 rounded-2xl bg-black border border-[#dfff00] flex items-center justify-center animate-spin shadow-[0_0_25px_rgba(223,255,0,0.35)]">
          <ShieldCheck className="w-6 h-6 text-[#dfff00]" />
        </div>
        <p className="text-xs tracking-widest text-[#dfff00] uppercase animate-pulse">
          BOOTING VERIXIA ENFORCEMENT COMMAND CENTER...
        </p>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#dfff00] selection:text-black relative overflow-x-hidden transition-all ${
        isPresentationMode ? "p-2 lg:p-4 bg-black" : ""
      }`}
    >
      {/* Subtle Living Background Glow (Black + White Haze + Soft Yellow Glow) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(223,255,0,0.035)_0%,transparent_70%)] blur-3xl opacity-75" />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,255,255,0.015)_0%,transparent_65%)] blur-3xl" />
        <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(223,255,0,0.02)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Top Bar with Scoreboard & Presentation Toggle */}
        <TopBar
          config={config}
          connectionMode={connectionMode}
          scoreboard={scoreboard}
          isPresentationMode={isPresentationMode}
          onTogglePresentationMode={togglePresentationMode}
          onBackToLanding={onBackToLanding}
        />

        {/* Dynamic Security Event Headline Banner */}
        <div className="w-full bg-[#050505] border-b border-white/12 py-2.5 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#dfff00] animate-pulse shrink-0 shadow-[0_0_8px_rgba(223,255,0,0.8)]" />
              <span className="font-bold text-[#dfff00] uppercase tracking-wider shrink-0">
                LIVE SECURITY EVENT:
              </span>
              <span className="text-white/90 truncate font-sans text-xs sm:text-sm">
                {dynamicStatusSentence}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/50 shrink-0">
              <Radio className="w-3 h-3 text-[#dfff00]" />
              <span>CHAIN 1337</span>
            </div>
          </div>
        </div>

        {/* Main Command Center Viewport */}
        <main
          className={`flex-1 w-full mx-auto space-y-8 transition-all ${
            isPresentationMode ? "max-w-[100vw] p-2" : "max-w-7xl p-4 lg:p-8"
          }`}
        >
          
          {/* Error Envelope Alert Banner if API failure occurs */}
          {apiError && (
            <Card variant="glow-red" className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#dfff00] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold font-mono text-[#dfff00] uppercase">
                    SYSTEM API ERROR ENVELOPE
                  </h4>
                  <p className="text-xs text-white/80">{apiError}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={loadData}
                className="text-xs font-mono gap-1.5 border-white/20 text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </Button>
            </Card>
          )}

          {/* PRESENTATION MODE JUDGE LAYOUT TRANSFORM */}
          <AnimatePresence mode="wait">
            {isPresentationMode ? (
              /* JUDGE DEMO PRESENTATION LAYOUT */
              <motion.div
                key="presentation-mode-layout"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Presentation Mode Header Tag */}
                <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#dfff00]/40 p-3 rounded-xl shadow-[0_0_20px_rgba(223,255,0,0.15)]">
                  <span className="text-xs font-mono font-bold text-[#dfff00] uppercase flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-[#dfff00] animate-pulse" />
                    PROJECTOR DEMO VIEW ACTIVE • PRESS 'P' OR ESCAPE TO EXIT
                  </span>
                  <Button variant="ghost" size="sm" onClick={togglePresentationMode} className="text-xs font-mono text-white/70 hover:text-white">
                    Exit Fullscreen
                  </Button>
                </div>

                {/* 1. Enlarged Live Arena Stream */}
                <LiveArena
                  goodAgent={goodAgent}
                  badAgent={badAgent}
                  messages={messages}
                  transactions={transactions}
                />

                {/* 2. Primary Demo Controls */}
                <DemoControls
                  onRunSequence={handleRunSequence}
                  onRunAttack={handleRunAttack}
                  onLegitimateOffer={handleLegitimateOffer}
                  isProcessing={isProcessingAction}
                />

                {/* 3. Hero Decision & Reasoning Receipt Viewer */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ReasoningReceiptViewer
                    config={config}
                    selectedAttempt={selectedAttempt}
                  />
                  <CharterPanel
                    rules={charterRules}
                    status={charterStatus}
                    selectedAttempt={selectedAttempt}
                  />
                </div>

                {/* Explainer Strip */}
                <ExplainerStrip selectedAttempt={selectedAttempt} />
              </motion.div>
            ) : (
              /* STANDARD COMMAND CENTER LAYOUT */
              <motion.div
                key="standard-mode-layout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* LEVEL 1 (HERO): LIVE ARENA SPLIT STAGE */}
                <section className="w-full space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs text-white/60">
                    <span className="flex items-center gap-2 font-bold uppercase text-white">
                      <Zap className="w-4 h-4 text-[#dfff00]" />
                      PRIMARY DEMO STAGE • LIVE ARENA
                    </span>
                    <span className="text-[11px] text-white/40">
                      BAD AGENT (LEFT) vs VERIXIA SENTINEL (RIGHT)
                    </span>
                  </div>

                  <LiveArena
                    goodAgent={goodAgent}
                    badAgent={badAgent}
                    messages={messages}
                    transactions={transactions}
                  />
                </section>

                {/* LEVEL 1 (HERO CTA): ADVERSARIAL ARENA CONTROLS */}
                <section className="w-full">
                  <DemoControls
                    onRunSequence={handleRunSequence}
                    onRunAttack={handleRunAttack}
                    onLegitimateOffer={handleLegitimateOffer}
                    isProcessing={isProcessingAction}
                  />
                </section>

                {/* CURRENT SECURITY DECISION & WHY? SUMMARY BOX */}
                {heroAttempt && (
                  <section className="w-full">
                    <Card className="bg-[#050505] border-white/20 p-5 md:p-6 rounded-2xl shadow-2xl space-y-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(223,255,0,0.04)_0%,transparent_60%)] pointer-events-none" />
                      
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/12 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black border border-[#dfff00] flex items-center justify-center text-[#dfff00] shadow-[0_0_18px_rgba(223,255,0,0.25)]">
                            {heroAttempt.status === "blocked" && <ShieldAlert className="w-6 h-6 text-[#dfff00] animate-pulse" />}
                            {heroAttempt.status === "executed" && <CheckCircle2 className="w-6 h-6 text-white" />}
                            {heroAttempt.status === "declined" && <ArrowRight className="w-6 h-6 text-white/80" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                                CURRENT SECURITY DECISION SUMMARY
                              </span>
                              <Badge variant="cyan" className="text-[9px] py-0 px-1.5">
                                ATTEMPT #{heroAttempt.id}
                              </Badge>
                            </div>
                            <p className="text-xs text-white/60 font-sans mt-0.5">
                              {new Date(heroAttempt.createdAt).toLocaleTimeString()} • {formatNativeAmount(heroAttempt.amountWei, 18, "MST")} REQUESTED
                            </p>
                          </div>
                        </div>

                        {/* Large Status Result Pill */}
                        <div>
                          {heroAttempt.status === "blocked" && (
                            <div className="px-4 py-2 bg-black border border-[#dfff00] rounded-xl text-center shadow-[0_0_20px_rgba(223,255,0,0.2)]">
                              <span className="text-xs font-extrabold font-mono text-[#dfff00] uppercase tracking-wider block">
                                🛡 BLOCKED BY SPENDING CHARTER
                              </span>
                              <span className="text-[10px] font-mono text-white/70 block">
                                {heroAttempt.blockReasonCode !== null && heroAttempt.blockReasonCode !== undefined && heroAttempt.blockReasonCode !== 0
                                  ? REASON_CODE_LABELS[heroAttempt.blockReasonCode] || `CODE_${heroAttempt.blockReasonCode}`
                                  : "EXCEEDS_MAX_PER_TX"}
                              </span>
                            </div>
                          )}
                          {heroAttempt.status === "executed" && (
                            <div className="px-4 py-2 bg-black border border-white/40 rounded-xl text-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                              <span className="text-xs font-extrabold font-mono text-white uppercase tracking-wider block">
                                ✓ EXECUTED ON-CHAIN
                              </span>
                              <span className="text-[10px] font-mono text-white/60 block">
                                All policy checks satisfied
                              </span>
                            </div>
                          )}
                          {heroAttempt.status === "declined" && (
                            <div className="px-4 py-2 bg-black border border-white/20 rounded-xl text-center">
                              <span className="text-xs font-extrabold font-mono text-white/80 uppercase tracking-wider block">
                                → DECLINED BY AGENT
                              </span>
                              <span className="text-[10px] font-mono text-white/50 block">
                                Rejected during reasoning
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Human Explanation & "WHY?" Box */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center font-mono">
                        <div className="md:col-span-4 p-3.5 bg-black border border-white/12 rounded-xl">
                          <span className="text-[10px] text-[#dfff00] font-bold uppercase tracking-wider block mb-1">
                            WHY WAS THIS DECISION MADE?
                          </span>
                          <p className="text-xs font-sans text-white/90 leading-relaxed">
                            {heroAttempt.status === "blocked"
                              ? (heroAttempt.blockReasonCode !== null && heroAttempt.blockReasonCode !== undefined && heroAttempt.blockReasonCode !== 0
                                  ? REASON_CODE_HUMAN_TEXT[heroAttempt.blockReasonCode] || heroAttempt.blockReason
                                  : "Per-transaction spending limit exceeded.")
                              : heroAttempt.status === "executed"
                              ? "Requested amount is within the maximum per-transaction limit and daily spending cap."
                              : "Sentinel agent reasoning engine declined the transaction proposal."}
                          </p>
                        </div>

                        <div className="md:col-span-8 p-3.5 bg-black border border-white/12 rounded-xl flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] text-white/50 uppercase tracking-wider block">
                              ATTEMPT DETAILS
                            </span>
                            <div className="text-xs text-white font-mono flex items-center gap-3 flex-wrap">
                              <span>Amount: <strong className="text-[#dfff00]">{formatNativeAmount(heroAttempt.amountWei, 18, "MST")}</strong></span>
                              <span>Target: <strong className="text-white">{heroAttempt.counterpartyAddress ? truncateAddress(heroAttempt.counterpartyAddress, 6, 4) : "0x90F7...B906"}</strong></span>
                              {heroAttempt.attackType && (
                                <span>Attack: <strong className="text-[#dfff00]">{ATTACK_TYPE_HUMAN_LABELS[heroAttempt.attackType] || heroAttempt.attackType}</strong></span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSelectAttempt(heroAttempt)}
                            className="text-xs font-mono shrink-0 border-white/20 hover:border-[#dfff00]"
                          >
                            Inspect Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </section>
                )}

                {/* LEVEL 2 (SUPPORTING): TRANSACTION LEDGER & SPENDING CHARTER */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                  {/* Transaction Ledger */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono text-xs text-white/60">
                      <span className="font-bold uppercase text-white flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-[#dfff00]" /> TRANSACTION LEDGER
                      </span>
                      <span>Real-time Audit Trail</span>
                    </div>
                    <TransactionLedger
                      transactions={transactions}
                      selectedAttemptId={selectedAttempt?.id}
                      onSelectAttempt={handleSelectAttempt}
                      isLoading={false}
                      error={null}
                      onRetry={loadData}
                    />
                  </div>

                  {/* Spending Charter Panel */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono text-xs text-white/60">
                      <span className="font-bold uppercase text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#dfff00]" /> SPENDING CHARTER ENFORCEMENT
                      </span>
                      <span>On-Chain Limits</span>
                    </div>
                    <CharterPanel
                      rules={charterRules}
                      status={charterStatus}
                      selectedAttempt={selectedAttempt}
                    />
                  </div>
                </section>

                {/* LEVEL 3 (PROOF & DEEP DETAIL): REPUTATION & REASONING RECEIPTS */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                  {/* Reputation Panel */}
                  <ReputationPanel
                    config={config}
                    selectedAttempt={selectedAttempt}
                  />

                  {/* Reasoning Receipt Viewer */}
                  <ReasoningReceiptViewer
                    config={config}
                    selectedAttempt={selectedAttempt}
                  />
                </section>

                {/* EXPLAINER STRIP */}
                <section className="w-full">
                  <ExplainerStrip selectedAttempt={selectedAttempt} />
                </section>
              </motion.div>
            )}
          </AnimatePresence>

        </main>

        {/* Transaction Detail Modal Inspection Drawer */}
        {isDetailOpen && selectedAttempt && (
          <TransactionDetail
            attempt={selectedAttempt}
            config={config}
            onClose={() => setIsDetailOpen(false)}
          />
        )}

        {/* Footer */}
        <footer className="w-full border-t border-white/12 bg-black py-4 text-center text-[11px] font-mono text-white/50 relative z-10">
          VERIXIA • ON-CHAIN AI SPENDING SAFEGUARD • MST BUILDATHON 2026
        </footer>

      </div>
    </div>
  )
}

