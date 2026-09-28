import React, { useState } from "react"
import { Play, ShieldAlert, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface DemoControlsProps {
  onRunSequence: () => Promise<void>
  onRunAttack: (attackType: "urgent_pretext" | "prompt_injection" | "fake_trust_claim") => Promise<void>
  onLegitimateOffer: () => Promise<void>
  isProcessing: boolean
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  onRunSequence,
  onRunAttack,
  onLegitimateOffer,
  isProcessing,
}) => {
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const handleSequence = async () => {
    setActiveAction("sequence")
    try {
      await onRunSequence()
    } finally {
      setActiveAction(null)
    }
  }

  const handleAttack = async (type: "urgent_pretext" | "prompt_injection" | "fake_trust_claim") => {
    setActiveAction(type)
    try {
      await onRunAttack(type)
    } finally {
      setActiveAction(null)
    }
  }

  const handleOffer = async () => {
    setActiveAction("offer")
    try {
      await onLegitimateOffer()
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <Card className="w-full bg-slate-950/90 border-slate-800 p-4 lg:p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Controls Info & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.25)]">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
              Adversarial Security Arena Controls
            </h3>
            <p className="text-xs text-slate-400">
              Trigger autonomous attacks or legitimate vendor proposals to demonstrate Spending Charter enforcement
            </p>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          
          {/* 1. RUN ATTACK SEQUENCE (MAIN DEMO BUTTON) */}
          <Button
            variant="danger"
            size="md"
            isLoading={activeAction === "sequence" || isProcessing}
            onClick={handleSequence}
            className="font-mono font-bold tracking-wider uppercase gap-2 px-5 py-2.5 text-xs shadow-[0_0_20px_rgba(239,68,68,0.35)]"
          >
            <Play className="w-4 h-4 fill-current text-white" />
            {activeAction === "sequence" ? "RUNNING SEQUENCE..." : "⚡ RUN ATTACK SEQUENCE"}
          </Button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* 2. INDIVIDUAL ATTACK BUTTONS */}
          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "urgent_pretext"}
            disabled={isProcessing}
            onClick={() => handleAttack("urgent_pretext")}
            className="text-xs font-mono border-red-500/30 hover:border-red-500/60 hover:bg-red-950/30 text-red-300"
          >
            Urgent Pretext
          </Button>

          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "prompt_injection"}
            disabled={isProcessing}
            onClick={() => handleAttack("prompt_injection")}
            className="text-xs font-mono border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-950/30 text-amber-300"
          >
            Prompt Injection
          </Button>

          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "fake_trust_claim"}
            disabled={isProcessing}
            onClick={() => handleAttack("fake_trust_claim")}
            className="text-xs font-mono border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-950/30 text-violet-300"
          >
            Fake Trust Claim
          </Button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* 3. LEGITIMATE OFFER BUTTON */}
          <Button
            variant="primary"
            size="sm"
            isLoading={activeAction === "offer"}
            disabled={isProcessing}
            onClick={handleOffer}
            className="text-xs font-mono gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Legitimate Offer (1.5 MST)
          </Button>

        </div>

      </div>
    </Card>
  )
}
