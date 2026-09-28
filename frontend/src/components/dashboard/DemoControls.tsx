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
    <Card className="w-full bg-[#0c1024]/90 border-indigo-900/40 p-4 lg:p-5 shadow-[0_4px_24px_rgba(8,10,22,0.6)]">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Controls Info & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#240c19]/90 border border-rose-500/40 flex items-center justify-center shadow-[0_0_18px_rgba(251,79,99,0.3)]">
            <ShieldAlert className="w-5 h-5 text-[#fb4f63]" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-[#f1f2ff] uppercase">
              Adversarial Security Arena Controls
            </h3>
            <p className="text-xs text-[#c4c7dc]">
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
            className="font-mono font-bold tracking-wider uppercase gap-2 px-5 py-2.5 text-xs bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-[0_0_25px_rgba(124,108,245,0.4)] border-none"
          >
            <Play className="w-4 h-4 fill-current text-white" />
            {activeAction === "sequence" ? "RUNNING SEQUENCE..." : "⚡ RUN ATTACK SEQUENCE"}
          </Button>

          <div className="h-6 w-px bg-indigo-900/40 hidden sm:block" />

          {/* 2. INDIVIDUAL ATTACK BUTTONS */}
          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "urgent_pretext"}
            disabled={isProcessing}
            onClick={() => handleAttack("urgent_pretext")}
            className="text-xs font-mono bg-[#250d19]/80 border-rose-500/35 hover:border-rose-500/60 hover:bg-[#30101e] text-rose-300"
          >
            Urgent Pretext
          </Button>

          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "prompt_injection"}
            disabled={isProcessing}
            onClick={() => handleAttack("prompt_injection")}
            className="text-xs font-mono bg-[#2a1a0c]/80 border-amber-500/35 hover:border-amber-500/60 hover:bg-[#35200e] text-amber-300"
          >
            Prompt Injection
          </Button>

          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "fake_trust_claim"}
            disabled={isProcessing}
            onClick={() => handleAttack("fake_trust_claim")}
            className="text-xs font-mono bg-[#1d163e]/80 border-violet-500/35 hover:border-violet-500/60 hover:bg-[#281c54] text-violet-300"
          >
            Fake Trust Claim
          </Button>

          <div className="h-6 w-px bg-indigo-900/40 hidden sm:block" />

          {/* 3. LEGITIMATE OFFER BUTTON */}
          <Button
            variant="primary"
            size="sm"
            isLoading={activeAction === "offer"}
            disabled={isProcessing}
            onClick={handleOffer}
            className="text-xs font-mono gap-1.5 bg-[#092723] hover:bg-[#0c352f] text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Legitimate Offer (1.5 MST)
          </Button>

        </div>

      </div>
    </Card>
  )
}
