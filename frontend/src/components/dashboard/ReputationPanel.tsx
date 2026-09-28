import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"
import {
  Award,
  HelpCircle,
  Database,
  Gavel,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNativeAmount, truncateAddress, truncateHash } from "@/lib/format"
import { api } from "@/api"
import type { FeedbackEvent, PublicConfig, Reputation, TransactionAttempt } from "@/api/types"

export interface ReputationPanelProps {
  config: PublicConfig | null
  selectedAttempt?: TransactionAttempt | null
}

export const ReputationPanel: React.FC<ReputationPanelProps> = ({
  config,
  selectedAttempt,
}) => {
  const [reputation, setReputation] = useState<Reputation | null>(null)
  const [feedbackEvents, setFeedbackEvents] = useState<FeedbackEvent[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [disputingId, setDisputingId] = useState<number | null>(null)

  // Address to query: counterparty from selected attempt or default agent
  const targetAddress =
    selectedAttempt?.counterpartyAddress || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

  // Fetch reputation profile & feedback events
  useEffect(() => {
    let isMounted = true
    async function loadReputationData() {
      if (config?.features.reputation === false) return
      setIsLoading(true)
      try {
        const [rep, feedback] = await Promise.all([
          api.getReputationByAddress(targetAddress),
          api.getReputationFeedback({ address: targetAddress }),
        ])
        if (isMounted) {
          setReputation(rep)
          setFeedbackEvents(feedback)
        }
      } catch (err) {
        console.error("Failed to load reputation panel data:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadReputationData()
    return () => {
      isMounted = false
    }
  }, [targetAddress, config])

  // Handle dispute feedback
  const handleDispute = async (feedbackId: number) => {
    setDisputingId(feedbackId)
    try {
      const updated = await api.disputeReputationFeedback(feedbackId)
      setFeedbackEvents((prev) =>
        prev.map((f) => (f.feedbackId === feedbackId ? updated : f))
      )
    } catch (err) {
      console.error("Failed to dispute feedback:", err)
    } finally {
      setDisputingId(null)
    }
  }

  // Feature Flag Check: Hide panel completely if reputation module is disabled
  if (config?.features.reputation === false) {
    return null
  }

  // Determine if axes are null (NO FEEDBACK YET state)
  const hasAxes =
    reputation?.axes &&
    reputation.axes.competence !== null &&
    reputation.axes.honesty !== null &&
    reputation.axes.compliance !== null &&
    reputation.axes.reliability !== null

  // Radar chart data transformation (EXACTLY 4 AXES)
  const radarData = hasAxes
    ? [
        { axis: "Competence", value: reputation.axes.competence || 0 },
        { axis: "Honesty", value: reputation.axes.honesty || 0 },
        { axis: "Compliance", value: reputation.axes.compliance || 0 },
        { axis: "Reliability", value: reputation.axes.reliability || 0 },
      ]
    : []

  return (
    <Card className="w-full bg-slate-950/90 border-slate-800 shadow-2xl p-5 flex flex-col h-[520px] overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-950/80 border border-violet-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.25)]">
            <Award className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                Reputation Registry
              </h3>
              <Badge variant="violet" className="text-[10px] py-0 px-1.5">
                MULTI-AXIS SIGNALS
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              On-chain non-aggregate agent competence & compliance metrics
            </p>
          </div>
        </div>

        {/* Address badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <Badge variant="neutral" className="gap-1">
            <Database className="w-3 h-3 text-cyan-400" />
            {truncateAddress(targetAddress, 6, 4)}
          </Badge>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        
        {/* Radar Chart & Axis Metrics Split View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-900/40 p-4 border border-slate-800/80 rounded-xl">
          
          {/* Radar Chart Visual */}
          <div className="h-56 w-full flex items-center justify-center relative">
            {isLoading ? (
              <div className="text-xs font-mono text-slate-500 animate-pulse">
                Loading reputation signals...
              </div>
            ) : !hasAxes ? (
              /* REQUIRED: NO FEEDBACK YET STATE */
              <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-700" />
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  NO FEEDBACK YET
                </span>
                <p className="text-[11px] font-sans text-slate-400 max-w-xs">
                  No verified on-chain feedback events exist for this address. Axes remain unrated until stake-backed ratings are recorded.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="axis" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={false} />
                  <Radar
                    name="Reputation"
                    dataKey="value"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 4 Independent Axes Breakdown (NO AGGREGATE DISPLAY) */}
          <div className="space-y-2.5 font-mono text-xs">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
              Independent Axis Ratings (0-100)
            </span>

            {[
              { label: "Competence", val: reputation?.axes?.competence, color: "text-cyan-400", bg: "bg-cyan-500" },
              { label: "Honesty", val: reputation?.axes?.honesty, color: "text-emerald-400", bg: "bg-emerald-500" },
              { label: "Compliance", val: reputation?.axes?.compliance, color: "text-violet-400", bg: "bg-violet-500" },
              { label: "Reliability", val: reputation?.axes?.reliability, color: "text-amber-400", bg: "bg-amber-500" },
            ].map((axis) => (
              <div key={axis.label} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">{axis.label}</span>
                  <span className={`font-bold ${axis.color}`}>
                    {axis.val !== null && axis.val !== undefined ? `${axis.val} / 100` : "NO DATA"}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${axis.val || 0}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${axis.bg}`}
                  />
                </div>
              </div>
            ))}

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Feedback Count: {reputation?.feedbackCount || 0}</span>
              <span>Source: {reputation?.source || "chain"}</span>
            </div>
          </div>

        </div>

        {/* STAKE + SLASH FEEDBACK SECTION (CONDITIONAL ON config.features.stakeSlash === true) */}
        {config?.features.stakeSlash !== false && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5 text-amber-400" />
                Stake & Slash Feedback Events
              </span>
              <Badge variant="amber" className="text-[9px] py-0">
                STAKE-BACKED RATINGS
              </Badge>
            </div>

            {feedbackEvents.length === 0 ? (
              <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg text-center text-xs text-slate-400">
                No active feedback events recorded for this address.
              </div>
            ) : (
              <div className="space-y-2">
                {feedbackEvents.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">
                          Event #{fb.feedbackId}
                        </span>
                        <span className="text-[11px] text-cyan-400">
                          Stake: {formatNativeAmount(fb.stakeWei, 18, "MST")}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Author: {truncateAddress(fb.authorAddress, 6, 4)} | Tx: {truncateHash(fb.txHash, 6, 4)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          fb.status === "active"
                            ? "emerald"
                            : fb.status === "disputed"
                            ? "amber"
                            : fb.status === "slashed"
                            ? "red"
                            : "neutral"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {fb.status}
                      </Badge>

                      {/* Dispute Button: ONLY when status is active */}
                      {fb.status === "active" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={disputingId === fb.feedbackId}
                          onClick={() => handleDispute(fb.feedbackId)}
                          className="text-[10px] font-mono py-0.5 px-2 border-amber-500/40 text-amber-300 hover:bg-amber-950/40"
                        >
                          Dispute
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </Card>
  )
}
