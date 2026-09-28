import React from "react"
import { ShieldAlert, ArrowRight, FileCode } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const TransactionConsoleSection: React.FC = () => {
  return (
    <section className="w-full py-16 lg:py-20 px-4 max-w-5xl mx-auto">
      
      <Card variant="glow-red" className="p-6 lg:p-8 bg-slate-950/95 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] space-y-6">
        
        {/* Console Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 font-mono">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              ENFORCEMENT CONSOLE CONSTRUCT (ILLUSTRATIVE EXAMPLE)
            </h3>
          </div>
          <Badge variant="red" className="text-[10px]">
            POLICY INTERCEPTION DEMO
          </Badge>
        </div>

        {/* 3 Step Interception Chain */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center font-mono text-xs">
          
          {/* 1. AGENT REQUEST */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-center">
            <span className="text-[10px] text-slate-400 uppercase">1. Agent Proposal</span>
            <div className="text-base font-bold text-cyan-400">1.8 MST</div>
            <p className="text-[10px] text-slate-400 font-sans">Manipulated LLM proposal</p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className="w-5 h-5 text-cyan-500/60" />
          </div>

          {/* 2. SPENDING CHARTER CHECK */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 space-y-1 text-center">
            <span className="text-[10px] text-slate-400 uppercase">2. On-Chain Check</span>
            <div className="text-base font-bold text-amber-400">Max Per Tx: 1.0 MST</div>
            <p className="text-[10px] text-slate-400 font-sans">Hard Solidity Policy Boundary</p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className="w-5 h-5 text-red-500/60" />
          </div>

          {/* 3. BLOCKED OUTCOME */}
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500 space-y-1 text-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <div className="flex items-center justify-center gap-1 text-red-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>BLOCKED</span>
            </div>
            <div className="text-xs font-bold text-red-300">EXCEEDS_MAX_PER_TX</div>
            <p className="text-[10px] text-red-200 font-sans">Per-transaction limit exceeded</p>
          </div>

        </div>

      </Card>

    </section>
  )
}
