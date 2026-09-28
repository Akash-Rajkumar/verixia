import React from "react"
import { ShieldCheck, Lock, FileCheck, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const SecuritySection: React.FC = () => {
  return (
    <section id="security" className="w-full py-16 lg:py-24 px-4 max-w-7xl mx-auto">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: Large Shield War-Room Visual (~40%) */}
        <div className="lg:col-span-5 flex justify-center">
          <Card variant="glow-cyan" className="p-8 w-full max-w-md flex flex-col items-center text-center space-y-6 bg-slate-950/90 border-cyan-500/40">
            <div className="w-24 h-24 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.35)] animate-pulse">
              <ShieldCheck className="w-14 h-14 text-cyan-400" />
            </div>

            <div className="space-y-2 font-mono">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">
                ENFORCEMENT BOUNDARY
              </span>
              <h4 className="text-lg font-bold text-white uppercase">
                HARD SMART CONTRACT RULES
              </h4>
              <p className="text-xs text-slate-400 font-sans">
                Outside LLM Context Window & Memory
              </p>
            </div>

            <Badge variant="emerald" className="py-1 px-3 text-xs font-bold">
              ✓ NON-NEGOTIABLE POLICY
            </Badge>
          </Card>
        </div>

        {/* RIGHT COLUMN: Messaging & Guarantees (~60%) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          <Badge variant="cyan" className="py-1 px-3 text-xs tracking-wider">
            SECURITY PRINCIPLE
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight leading-tight">
            AI IS THE DECISION MAKER.{" "}
            <span className="text-cyan-400">IT IS NOT THE AUTHORITY.</span>
          </h2>

          <p className="text-base text-slate-300 font-sans leading-relaxed">
            The model can propose an action, but financial policy lives outside the model in an immutable Solidity smart contract. No matter how clever the prompt injection, the on-chain Spending Charter remains authoritative.
          </p>

          <div className="pt-4 space-y-3 font-mono text-sm text-slate-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>POLICY OUTSIDE THE LLM</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <FileCheck className="w-5 h-5 text-violet-400 shrink-0" />
              <span>CRYPTOGRAPHIC REASONING RECEIPTS</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>100% AUDITABLE TRANSACTIONS</span>
            </div>
          </div>

        </div>

      </div>

    </section>
  )
}
