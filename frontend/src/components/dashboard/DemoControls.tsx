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
    <Card className="w-full bg-black border-white/15 p-4 lg:p-5 shadow-2xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Controls Info & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black border border-[#dfff00]/60 flex items-center justify-center shadow-[0_0_18px_rgba(223,255,0,0.2)]">
            <ShieldAlert className="w-5 h-5 text-[#dfff00]" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
              Adversarial Security Arena Controls
            </h3>
            <p className="text-xs text-white/60">
              Trigger autonomous attacks or legitimate vendor proposals to demonstrate Spending Charter enforcement
            </p>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          
          {/* 1. RUN ATTACK SEQUENCE (MAIN DEMO BUTTON) */}
          <Button
            variant="primary"
            size="md"
            isLoading={activeAction === "sequence" || isProcessing}
            onClick={handleSequence}
            className="font-mono font-bold tracking-wider uppercase gap-2 px-5 py-2.5 text-xs bg-black text-white hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/80 shadow-[0_0_25px_rgba(223,255,0,0.25)] transition-all duration-300"
          >
            <Play className="w-4 h-4 fill-current text-[#dfff00] group-hover:text-black" />
            {activeAction === "sequence" ? "RUNNING SEQUENCE..." : "⚡ RUN ATTACK SEQUENCE"}
          </Button>

          <div className="h-6 w-px bg-white/15 hidden sm:block" />

          {/* 2. INDIVIDUAL ATTACK BUTTONS */}
          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "urgent_pretext"}
            disabled={isProcessing}
            onClick={() => handleAttack("urgent_pretext")}
            className="text-xs font-mono bg-black border-white/20 hover:border-[#dfff00]/60 hover:text-[#dfff00] text-white/90"
          >
            Urgent Pretext
          </Button>

          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "prompt_injection"}
            disabled={isProcessing}
            onClick={() => handleAttack("prompt_injection")}
            className="text-xs font-mono bg-black border-white/20 hover:border-[#dfff00]/60 hover:text-[#dfff00] text-white/90"
          >
            Prompt Injection
          </Button>

          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "fake_trust_claim"}
            disabled={isProcessing}
            onClick={() => handleAttack("fake_trust_claim")}
            className="text-xs font-mono bg-black border-white/20 hover:border-[#dfff00]/60 hover:text-[#dfff00] text-white/90"
          >
            Fake Trust Claim
          </Button>

          <div className="h-6 w-px bg-white/15 hidden sm:block" />

          {/* 3. LEGITIMATE OFFER BUTTON */}
          <Button
            variant="secondary"
            size="sm"
            isLoading={activeAction === "offer"}
            disabled={isProcessing}
            onClick={handleOffer}
            className="text-xs font-mono gap-1.5 bg-black text-white border-white/30 hover:border-white hover:bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.08)]"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#dfff00]" />
            Legitimate Offer (1.5 MST)
          </Button>

        </div>

      </div>
    </Card>
  )
}
