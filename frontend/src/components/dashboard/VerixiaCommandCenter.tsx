import React, { useCallback, useEffect, useMemo, useState } from "react"
import { ShieldCheck, AlertTriangle, RefreshCw, Layers } from "lucide-react"
import { TopBar } from "./TopBar"
import { LiveArena } from "./LiveArena"
import { DemoControls } from "./DemoControls"
import { TransactionLedger } from "./TransactionLedger"
import { CharterPanel } from "./CharterPanel"
import { TransactionDetail } from "./TransactionDetail"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLiveFeed } from "@/hooks/useLiveFeed"
import { api } from "@/api"
import type { Agent, CharterRules, CharterStatus, Message, PublicConfig, TransactionAttempt } from "@/api/types"

export const VerixiaCommandCenter: React.FC = () => {
  const { connectionMode, refreshSignal, refetchNow } = useLiveFeed()

  const [config, setConfig] = useState<PublicConfig | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [transactions, setTransactions] = useState<TransactionAttempt[]>([])
  const [charterRules, setCharterRules] = useState<CharterRules | null>(null)
  const [charterStatus, setCharterStatus] = useState<CharterStatus | null>(null)

  const [selectedAttempt, setSelectedAttempt] = useState<TransactionAttempt | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

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
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Bar with Scoreboard */}
      <TopBar
        config={config}
        connectionMode={connectionMode}
        scoreboard={scoreboard}
      />

      {/* Main Command Center Dashboard Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
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

        {/* Phase 12 & Phase 13: Transaction Ledger + Charter Panel Grid */}
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

        {/* Placeholder Slot for Phase 14-16 Panels */}
        <section className="w-full p-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
          <Layers className="w-4 h-4 text-cyan-500" />
          <span>Additional Command Panels (Reputation Panel, Reasoning Receipt Viewer, Explainer Strip) slot ready for next phase.</span>
        </section>

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
