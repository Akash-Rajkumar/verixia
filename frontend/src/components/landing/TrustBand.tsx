import React from "react"
import { Cpu, Lock, FileCheck, ShieldCheck, DollarSign } from "lucide-react"

export const TrustBand: React.FC = () => {
  return (
    <section className="w-full bg-black border-y border-white/12 py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
        
        <span className="text-xs font-bold text-white/50 uppercase tracking-widest shrink-0">
          BUILT FOR AGENTIC COMMERCE
        </span>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/80 font-medium">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#dfff00]" />
            <span>AI AGENTS</span>
          </div>

          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-white" />
            <span>SMART CONTRACTS</span>
          </div>

          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-white" />
            <span>AUDITABILITY</span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#dfff00]" />
            <span>POLICY ENFORCEMENT</span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#dfff00]" />
            <span>MACHINE-TO-MACHINE PAYMENTS</span>
          </div>
        </div>

      </div>
    </section>
  )
}
