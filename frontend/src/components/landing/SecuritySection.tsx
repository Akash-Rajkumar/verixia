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
          <Card className="p-8 w-full max-w-md flex flex-col items-center text-center space-y-6 bg-black border border-white/15">
            <div className="w-24 h-24 rounded-2xl bg-black border-2 border-[#dfff00] flex items-center justify-center shadow-[0_0_35px_rgba(223,255,0,0.3)] animate-pulse">
              <ShieldCheck className="w-14 h-14 text-[#dfff00]" />
            </div>

            <div className="space-y-2 font-mono">
              <span className="text-xs font-bold text-[#dfff00] uppercase tracking-widest block">
                ENFORCEMENT BOUNDARY
              </span>
              <h4 className="text-lg font-bold text-white uppercase">
                HARD SMART CONTRACT RULES
              </h4>
              <p className="text-xs text-white/60 font-sans">
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
            <span className="text-[#dfff00]">IT IS NOT THE AUTHORITY.</span>
          </h2>

          <p className="text-base text-white/70 font-sans leading-relaxed">
            The model can propose an action, but financial policy lives outside the model in an immutable Solidity smart contract. No matter how clever the prompt injection, the on-chain Spending Charter remains authoritative.
          </p>

          <div className="pt-4 space-y-3 font-mono text-sm text-white">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black border border-white/15">
              <Lock className="w-5 h-5 text-[#dfff00] shrink-0" />
              <span>POLICY OUTSIDE THE LLM</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-black border border-white/15">
              <FileCheck className="w-5 h-5 text-white shrink-0" />
              <span>CRYPTOGRAPHIC REASONING RECEIPTS</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-black border border-white/15">
              <CheckCircle2 className="w-5 h-5 text-[#dfff00] shrink-0" />
              <span>100% AUDITABLE TRANSACTIONS</span>
            </div>
          </div>

        </div>

      </div>

    </section>
  )
}
