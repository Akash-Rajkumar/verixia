import React, { useEffect, useState } from "react"
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
import { formatNativeAmount, truncateAddress } from "@/lib/format"
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
    <Card className="w-full bg-black border-white/15 shadow-2xl p-5 flex flex-col h-[520px] overflow-hidden rounded-2xl">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/12 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-black border border-[#dfff00]/60 flex items-center justify-center shadow-[0_0_18px_rgba(223,255,0,0.2)]">
            <Award className="w-5 h-5 text-[#dfff00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Reputation Registry
              </h3>
              <Badge variant="cyan" className="text-[10px] py-0 px-1.5">
                MULTI-AXIS SIGNALS
              </Badge>
            </div>
            <p className="text-[11px] text-white/60">
              On-chain non-aggregate agent competence & compliance metrics
            </p>
          </div>
        </div>

        {/* Address badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <Badge variant="neutral" className="gap-1">
            <Database className="w-3 h-3 text-[#dfff00]" />
            {truncateAddress(targetAddress, 6, 4)}
          </Badge>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin scrollbar-thumb-white/20">
        
        {/* Radar Chart & Axis Metrics Split View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-[#0a0a0a] p-4 border border-white/12 rounded-xl">
          
          {/* Radar Chart Visual */}
          <div className="h-56 w-full flex items-center justify-center relative">
            {isLoading ? (
              <div className="text-xs font-mono text-white/50 animate-pulse">
                Loading reputation signals...
              </div>
            ) : !hasAxes ? (
              /* REQUIRED: NO FEEDBACK YET STATE */
              <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
                <HelpCircle className="w-8 h-8 text-white/40" />
                <span className="text-xs font-mono font-bold text-[#dfff00] uppercase tracking-wider">
                  NO FEEDBACK YET
                </span>
                <p className="text-[11px] font-sans text-white/70 max-w-xs">
                  No verified on-chain feedback events exist for this address. Axes remain unrated until stake-backed ratings are recorded.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#333333" />
                  <PolarAngleAxis dataKey="axis" stroke="#ffffff" tick={{ fill: "#ffffff", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#444444" tick={false} />
                  <Radar
                    name="Reputation"
                    dataKey="value"
                    stroke="#dfff00"
                    fill="#ffffff"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 4 Independent Axes Grid */}
          <div className="space-y-2.5 font-mono">
            <span className="text-[10px] text-white/50 uppercase tracking-wider block">
              Independent Axis Ratings
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-black border border-white/12 rounded-lg">
                <span className="text-[10px] text-white/60 block">COMPETENCE</span>
                <span className="text-sm font-bold text-[#dfff00]">
                  {reputation?.axes?.competence ?? "N/A"}
                </span>
              </div>

              <div className="p-2.5 bg-black border border-white/12 rounded-lg">
                <span className="text-[10px] text-white/60 block">HONESTY</span>
                <span className="text-sm font-bold text-white">
                  {reputation?.axes?.honesty ?? "N/A"}
                </span>
              </div>

              <div className="p-2.5 bg-black border border-white/12 rounded-lg">
                <span className="text-[10px] text-white/60 block">COMPLIANCE</span>
                <span className="text-sm font-bold text-white">
                  {reputation?.axes?.compliance ?? "N/A"}
                </span>
              </div>

              <div className="p-2.5 bg-black border border-white/12 rounded-lg">
                <span className="text-[10px] text-white/60 block">RELIABILITY</span>
                <span className="text-sm font-bold text-[#dfff00]">
                  {reputation?.axes?.reliability ?? "N/A"}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-white/50 pt-1">
              Feedback Count: {reputation?.feedbackCount || 0} event(s)
            </div>
          </div>

        </div>

        {/* Feedback History & Dispute Actions */}
        <div className="space-y-2 font-mono text-xs">
          <span className="text-[10px] text-white/50 uppercase tracking-wider block">
            Stake & Slash Feedback Log
          </span>

          {feedbackEvents.length === 0 ? (
            <div className="p-3 bg-[#0a0a0a] border border-white/12 rounded-xl text-center text-[11px] text-white/50">
              No stake/slash feedback events recorded for this counterparty.
            </div>
          ) : (
            <div className="space-y-2">
              {feedbackEvents.map((fb) => (
                <div
                  key={fb.feedbackId}
                  className="p-3 bg-[#0a0a0a] border border-white/12 rounded-xl flex items-center justify-between gap-3 text-[11px]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        From: {truncateAddress(fb.authorAddress, 6, 4)}
                      </span>
                      <Badge variant="cyan" className="text-[9px] py-0">
                        {fb.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-white/70 font-sans text-xs">
                      {fb.evidenceHash ? `Evidence Hash: ${fb.evidenceHash}` : "Verified on-chain feedback signal"}
                    </p>
                    <div className="text-[10px] text-white/50">
                      Stake: {formatNativeAmount(fb.stakeWei, 18, "MST")}
                    </div>
                  </div>

                  {fb.status === "active" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={disputingId === fb.feedbackId}
                      onClick={() => handleDispute(fb.feedbackId)}
                      className="text-[10px] py-1 px-2.5 gap-1 border-white/30 text-white hover:border-[#dfff00] hover:text-[#dfff00]"
                    >
                      <Gavel className="w-3 h-3" /> Dispute
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Card>
  )
}
