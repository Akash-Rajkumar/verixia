import React from "react"
import { motion } from "framer-motion"
import { Terminal, Lock, ShieldCheck, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "COUNTERPARTY REQUESTS PAYMENT",
      desc: "An external AI agent or vendor submits a payment proposal or service invoice.",
      icon: Terminal,
      color: "text-cyan-400",
    },
    {
      num: "02",
      title: "AGENT EVALUATES THE REQUEST",
      desc: "The Good Agent LLM analyzes the proposal against intent and potential prompt injection signals.",
      icon: ShieldCheck,
      color: "text-violet-400",
    },
    {
      num: "03",
      title: "REPUTATION SIGNALS ARE CHECKED",
      desc: "Multi-axis registry metrics (competence, honesty, compliance, reliability) are evaluated.",
      icon: ShieldCheck,
      color: "text-amber-400",
    },
    {
      num: "04",
      title: "SPENDING CHARTER ENFORCES POLICY",
      desc: "Solidity smart contract executes hard policy checks (max per tx, daily cap, allow list).",
      icon: Lock,
      color: "text-cyan-400",
    },
    {
      num: "05",
      title: "EXECUTE OR BLOCK",
      desc: "Transaction is either executed on-chain or instantly blocked by policy rejection.",
      icon: Lock,
      color: "text-red-400 font-bold",
      highlight: true,
    },
    {
      num: "06",
      title: "REASONING RECEIPT IS RECORDED",
      desc: "Cryptographic reasoning hash and rationale summary are anchored permanently on-chain.",
      icon: ShieldCheck,
      color: "text-emerald-400",
    },
  ]

  return (
    <section id="how-it-works" className="w-full py-16 lg:py-24 px-4 max-w-7xl mx-auto space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <Badge variant="violet" className="py-1 px-3 text-xs tracking-wider">
          SYSTEM ARCHITECTURE
        </Badge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight">
          HOW VERIXIA WORKS
        </h2>
        <p className="text-base text-slate-400 font-sans max-w-2xl mx-auto">
          Six deterministic stages from initial payment request to verified on-chain execution or block.
        </p>
      </div>

      {/* 6 Step Sequence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
        {steps.map((step, idx) => {
          const IconComponent = step.icon

          return (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                step.highlight
                  ? "bg-red-950/30 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                  : "bg-slate-950/80 border-slate-800/90 hover:border-cyan-500/40"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-slate-400 font-mono">
                    {step.num}
                  </span>
                  <IconComponent className={`w-5 h-5 ${step.color}`} />
                </div>

                <h3 className={`text-xs font-bold uppercase tracking-wider ${step.color}`}>
                  {step.title}
                </h3>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="pt-2 flex justify-end text-slate-600">
                  <ArrowDown className="w-4 h-4 text-slate-500" />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

    </section>
  )
}
