import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, AlertTriangle, RefreshCw, Maximize2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { useLiveFeed } from "@/hooks/useLiveFeed"
import { api } from "@/api"
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
      <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center animate-spin shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
        </div>
        <p className="font-mono text-sm tracking-wider text-cyan-400 animate-pulse">
          BOOTING VERIXIA ENFORCEMENT COMMAND CENTER...
        </p>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-[#05070a] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black transition-all ${
        isPresentationMode ? "p-2 lg:p-4 bg-[#030407]" : ""
      }`}
    >
      
      {/* Top Bar with Scoreboard & Presentation Toggle */}
      <TopBar
        config={config}
        connectionMode={connectionMode}
        scoreboard={scoreboard}
        isPresentationMode={isPresentationMode}
        onTogglePresentationMode={togglePresentationMode}
        onBackToLanding={onBackToLanding}
      />

      {/* Main Command Center Viewport */}
      <main
        className={`flex-1 w-full mx-auto space-y-6 transition-all ${
          isPresentationMode ? "max-w-[100vw] p-2" : "max-w-7xl p-4 lg:p-8"
        }`}
      >
        
        {/* Error Envelope Alert Banner if API failure occurs */}
        {apiError && (
          <Card variant="glow-red" className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold font-mono text-red-300 uppercase">
                  SYSTEM API ERROR ENVELOPE
                </h4>
                <p className="text-xs text-red-200">{apiError}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadData}
              className="text-xs font-mono gap-1.5"
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
              <div className="flex items-center justify-between bg-cyan-950/60 border border-cyan-500/40 p-3 rounded-xl">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                  PROJECTOR DEMO VIEW ACTIVE • PRESS 'P' OR ESCAPE TO EXIT
                </span>
                <Button variant="ghost" size="sm" onClick={togglePresentationMode} className="text-xs font-mono">
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

              {/* 3. Reasoning Receipt Viewer & Explainer Strip prominent focus */}
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
              className="space-y-6"
            >
              {/* Phase 10: Live Arena Split Screen */}
              <section className="w-full">
                <LiveArena
                  goodAgent={goodAgent}
                  badAgent={badAgent}
                  messages={messages}
                  transactions={transactions}
                />
              </section>

              {/* Phase 11: Demo Controls */}
              <section className="w-full">
                <DemoControls
                  onRunSequence={handleRunSequence}
                  onRunAttack={handleRunAttack}
                  onLegitimateOffer={handleLegitimateOffer}
                  isProcessing={isProcessingAction}
                />
              </section>

              {/* Phase 12 & Phase 13: Transaction Ledger + Charter Panel Grid Row */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* Phase 12: Transaction Ledger */}
                <TransactionLedger
                  transactions={transactions}
                  selectedAttemptId={selectedAttempt?.id}
                  onSelectAttempt={handleSelectAttempt}
                  isLoading={false}
                  error={null}
                  onRetry={loadData}
                />

                {/* Phase 13: Spending Charter Panel */}
                <CharterPanel
                  rules={charterRules}
                  status={charterStatus}
                  selectedAttempt={selectedAttempt}
                />
              </section>

              {/* Phase 14 & Phase 15: Reputation Panel + Reasoning Receipt Viewer Grid Row */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* Phase 14: Reputation Panel */}
                <ReputationPanel
                  config={config}
                  selectedAttempt={selectedAttempt}
                />

                {/* Phase 15: Reasoning Receipt Viewer */}
                <ReasoningReceiptViewer
                  config={config}
                  selectedAttempt={selectedAttempt}
                />
              </section>

              {/* Phase 17: Explainer Strip */}
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
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-3 text-center text-[11px] font-mono text-slate-400">
        VERIXIA • MST BLOCKCHAIN BUILDATHON 2026 • PERSON 4 DASHBOARD & INTEGRATION LEAD
      </footer>

    </div>
  )
}
