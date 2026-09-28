import React from "react"
import { Lock, Award, FileCheck, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const ThreeMechanismsSection: React.FC = () => {
  return (
    <section id="trust-layer" className="w-full py-16 lg:py-24 px-4 max-w-7xl mx-auto space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <Badge variant="cyan" className="py-1 px-3 text-xs tracking-wider">
          CORE MECHANISMS
        </Badge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight">
          THE TRUST LAYER
        </h2>
        <p className="text-base text-slate-400 font-sans max-w-2xl mx-auto">
          Three non-negotiable architectural mechanisms working together to guarantee agent financial safety.
        </p>
      </div>

      {/* 3 Core Mechanism Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* CARD 1: SPENDING CHARTER */}
        <Card variant="glow-cyan" className="p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Lock className="w-6 h-6 text-cyan-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-mono text-white uppercase tracking-wider">
                1. Spending Charter
              </h3>
              <p className="text-xs font-mono text-cyan-400">
                Hard On-Chain Policy Rules
              </p>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Solidity smart contract rules enforcing hard spending boundaries completely outside the LLM context.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2 font-mono text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Max Per-Transaction Limit</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Daily Cumulative Cap</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Human Approval Threshold</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Allow / Deny Counterparty List</span>
            </div>
          </div>
        </Card>

        {/* CARD 2: MULTI-AXIS REPUTATION */}
        <Card variant="glow-cyan" className="p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <Award className="w-6 h-6 text-violet-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-mono text-white uppercase tracking-wider">
                2. Multi-Axis Reputation
              </h3>
              <p className="text-xs font-mono text-violet-400">
                Independent Trust Signals
              </p>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Stake-and-slash feedback registry tracking independent performance axes without aggregate scores.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2 font-mono text-xs text-slate-400">
            <div className="flex items-center justify-between text-slate-300">
              <span>Competence</span>
              <span className="text-cyan-400 font-bold">0 – 100</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Honesty</span>
              <span className="text-emerald-400 font-bold">0 – 100</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Compliance</span>
              <span className="text-violet-400 font-bold">0 – 100</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Reliability</span>
              <span className="text-amber-400 font-bold">0 – 100</span>
            </div>
          </div>
        </Card>

        {/* CARD 3: REASONING RECEIPTS */}
        <Card variant="glow-cyan" className="p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <FileCheck className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-mono text-white uppercase tracking-wider">
                3. Reasoning Receipts
              </h3>
              <p className="text-xs font-mono text-emerald-400">
                Cryptographic Audit Proofs
              </p>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Every attempt records an on-chain reasoning hash and audit rationale without leaking raw chain-of-thought.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2 font-mono text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Decision Status Label</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reasoning Audit Summary</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cryptographic Reasoning Hash</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>On-Chain Receipt Verification</span>
            </div>
          </div>
        </Card>

      </div>

    </section>
  )
}
