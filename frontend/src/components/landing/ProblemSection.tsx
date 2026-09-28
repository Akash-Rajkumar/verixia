import React from "react"
import { ShieldAlert, AlertTriangle, Lock, UserX, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const ProblemSection: React.FC = () => {
  return (
    <section className="w-full py-16 lg:py-24 px-4 max-w-7xl mx-auto space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <Badge variant="red" className="py-1 px-3 text-xs tracking-wider">
          THE SECURITY PROBLEM
        </Badge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight">
          WHEN THE MODEL GETS MANIPULATED
        </h2>
        <p className="text-base text-slate-400 font-sans max-w-2xl mx-auto">
          Prompt injections and urgent pretexts trick LLMs into attempting unauthorized transactions. Verixia intercepts them at the smart contract boundary.
        </p>
      </div>

      {/* Attack Story Visual Chain */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center font-mono">
        
        {/* Step 1: Bad Agent */}
        <Card variant="glow-red" className="p-4 flex flex-col items-center text-center space-y-2">
          <UserX className="w-8 h-8 text-red-400" />
          <span className="text-xs font-bold text-red-400 uppercase">BAD AGENT</span>
          <span className="text-[10px] text-slate-400">Adversarial Attacker</span>
        </Card>

        {/* Arrow */}
        <div className="hidden md:flex justify-center text-red-500/60">
          <ArrowRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Step 2: Prompt Injection / Urgent Pretext */}
        <Card variant="glow-red" className="p-4 flex flex-col items-center text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase">PROMPT INJECTION</span>
          <span className="text-[10px] text-slate-400">Urgent Pretext Attack</span>
        </Card>

        {/* Arrow */}
        <div className="hidden md:flex justify-center text-red-500/60">
          <ArrowRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Step 3: Interrupted by Spending Charter */}
        <Card variant="glow-cyan" className="p-4 flex flex-col items-center text-center space-y-2 md:col-span-1 border-2 border-cyan-400">
          <div className="w-10 h-10 rounded-full bg-red-950 border border-red-500 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <span className="text-xs font-bold text-cyan-300 uppercase">SPENDING CHARTER</span>
          <Badge variant="red" className="text-[10px] font-bold">
            BLOCKED BY CHARTER
          </Badge>
        </Card>

      </div>

      {/* Explainer Footer Note */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-xs font-mono text-slate-300 flex items-center justify-center gap-2 max-w-3xl mx-auto">
        <Lock className="w-4 h-4 text-cyan-400" />
        <span>Even if the LLM is 100% manipulated, the Spending Charter smart contract rejects the transaction on-chain.</span>
      </div>

    </section>
  )
}
