import React from "react"
import { ShieldAlert, AlertTriangle, Lock, UserX, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const ProblemSection: React.FC = () => {
  return (
    <section className="w-full py-16 lg:py-24 px-4 max-w-7xl mx-auto space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <Badge variant="cyan" className="py-1 px-3 text-xs tracking-wider">
          THE SECURITY PROBLEM
        </Badge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight">
          WHEN THE MODEL GETS MANIPULATED
        </h2>
        <p className="text-base text-white/70 font-sans max-w-2xl mx-auto">
          Prompt injections and urgent pretexts trick LLMs into attempting unauthorized transactions. Verixia intercepts them at the smart contract boundary.
        </p>
      </div>

      {/* Attack Story Visual Chain */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center font-mono">
        
        {/* Step 1: Bad Agent */}
        <Card className="p-4 flex flex-col items-center text-center space-y-2 bg-black border border-white/15">
          <UserX className="w-8 h-8 text-[#dfff00]" />
          <span className="text-xs font-bold text-[#dfff00] uppercase">BAD AGENT</span>
          <span className="text-[10px] text-white/50">Adversarial Attacker</span>
        </Card>

        {/* Arrow */}
        <div className="hidden md:flex justify-center text-[#dfff00]">
          <ArrowRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Step 2: Prompt Injection / Urgent Pretext */}
        <Card className="p-4 flex flex-col items-center text-center space-y-2 bg-black border border-white/15">
          <AlertTriangle className="w-8 h-8 text-[#dfff00]" />
          <span className="text-xs font-bold text-[#dfff00] uppercase">PROMPT INJECTION</span>
          <span className="text-[10px] text-white/50">Urgent Pretext Attack</span>
        </Card>

        {/* Arrow */}
        <div className="hidden md:flex justify-center text-[#dfff00]">
          <ArrowRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Step 3: Interrupted by Spending Charter */}
        <Card className="p-4 flex flex-col items-center text-center space-y-2 md:col-span-1 bg-black border-2 border-[#dfff00] shadow-[0_0_20px_rgba(223,255,0,0.2)]">
          <div className="w-10 h-10 rounded-full bg-black border border-[#dfff00] flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[#dfff00]" />
          </div>
          <span className="text-xs font-bold text-white uppercase">SPENDING CHARTER</span>
          <Badge variant="red" className="text-[10px] font-bold">
            BLOCKED BY CHARTER
          </Badge>
        </Card>

      </div>

      {/* Explainer Footer Note */}
      <div className="p-4 bg-black border border-white/15 rounded-xl text-center text-xs font-mono text-white/80 flex items-center justify-center gap-2 max-w-3xl mx-auto shadow-sm">
        <Lock className="w-4 h-4 text-[#dfff00]" />
        <span>Even if the LLM is 100% manipulated, the Spending Charter smart contract rejects the transaction on-chain.</span>
      </div>

    </section>
  )
}
