import React from "react"
import { ShieldAlert, ArrowRight, FileCode } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const TransactionConsoleSection: React.FC = () => {
  return (
    <section className="w-full py-16 lg:py-20 px-4 max-w-5xl mx-auto">
      
      <Card className="p-6 lg:p-8 bg-black border border-white/15 shadow-2xl space-y-6 rounded-2xl">
        
        {/* Console Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/12 pb-4 font-mono">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#dfff00]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              ENFORCEMENT CONSOLE CONSTRUCT (ILLUSTRATIVE EXAMPLE)
            </h3>
          </div>
          <Badge variant="cyan" className="text-[10px]">
            POLICY INTERCEPTION DEMO
          </Badge>
        </div>

        {/* 3 Step Interception Chain */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center font-mono text-xs">
          
          {/* 1. AGENT REQUEST */}
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/12 space-y-1 text-center">
            <span className="text-[10px] text-white/50 uppercase">1. Agent Proposal</span>
            <div className="text-base font-bold text-white">1.8 MST</div>
            <p className="text-[10px] text-white/60 font-sans">Manipulated LLM proposal</p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex justify-center text-white/30">
            <ArrowRight className="w-5 h-5 text-[#dfff00]" />
          </div>

          {/* 2. SPENDING CHARTER CHECK */}
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#dfff00]/50 space-y-1 text-center">
            <span className="text-[10px] text-white/50 uppercase">2. On-Chain Check</span>
            <div className="text-base font-bold text-[#dfff00]">Max Per Tx: 1.0 MST</div>
            <p className="text-[10px] text-white/60 font-sans">Hard Solidity Policy Boundary</p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex justify-center text-white/30">
            <ArrowRight className="w-5 h-5 text-[#dfff00]" />
          </div>

          {/* 3. BLOCKED OUTCOME */}
          <div className="p-4 rounded-xl bg-black border-2 border-[#dfff00] space-y-1 text-center shadow-[0_0_20px_rgba(223,255,0,0.2)]">
            <div className="flex items-center justify-center gap-1 text-[#dfff00] font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>BLOCKED</span>
            </div>
            <div className="text-xs font-bold text-[#dfff00]">EXCEEDS_MAX_PER_TX</div>
            <p className="text-[10px] text-white/70 font-sans">Per-transaction limit exceeded</p>
          </div>

        </div>

      </Card>

    </section>
  )
}
