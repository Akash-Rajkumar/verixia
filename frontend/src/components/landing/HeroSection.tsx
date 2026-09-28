import React from "react"
import { motion } from "framer-motion"
import { Lock, ShieldCheck, FileCheck, ArrowRight, Play, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SplineScene } from "@/components/ui/splite"
import { Spotlight } from "@/components/ui/spotlight"

export interface HeroSectionProps {
  onOpenCommandCenter: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenCommandCenter }) => {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden py-12 lg:py-16 bg-[#080a16]">
      
      {/* Background Ambient Glow & Spotlight */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(34, 211, 238, 0.15)" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* LEFT COLUMN: Messaging (~45% width = col-span-5) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:col-span-5 space-y-6 text-left"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2">
            <Badge variant="cyan" className="py-1 px-3 gap-1.5 text-xs tracking-wider shadow-[0_0_12px_rgba(34,211,238,0.25)] bg-[#0a1b35] border-cyan-500/40 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              ON-CHAIN TRUST LAYER FOR AI AGENTS
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#f1f2ff] leading-[1.1] font-sans">
            AI CAN DECIDE.{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(34,211,238,0.35)] font-mono">
              BLOCKCHAIN
            </span>{" "}
            DECIDES WHAT IT'S ALLOWED TO DO.
          </h1>

          {/* Supporting Paragraph */}
          <p className="text-base sm:text-lg text-[#c4c7dc] font-sans leading-relaxed max-w-xl">
            Autonomous AI agents are beginning to transact on behalf of people and organizations. Verixia adds a programmable trust and enforcement layer that keeps financial authority outside the model.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              variant="danger"
              size="lg"
              onClick={onOpenCommandCenter}
              className="font-mono text-sm font-bold tracking-wider uppercase gap-2.5 px-6 py-3.5 bg-gradient-to-r from-red-600 via-burgundy-700 to-crimson-600 hover:from-red-500 hover:to-pink-600 text-white shadow-[0_0_25px_rgba(251,79,99,0.4)] border border-red-500/40"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              ENTER LIVE DEMO
            </Button>

            <a
              href="#trust-layer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-indigo-500/40 bg-[#0f1433]/80 hover:bg-[#151c47] text-[#f1f2ff] text-sm font-mono transition-all shadow-[0_4px_16px_rgba(15,20,51,0.5)]"
            >
              EXPLORE THE TRUST LAYER
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </a>
          </div>

          {/* Hero Trust Pillars Row */}
          <div className="pt-6 border-t border-[#1f264d] grid grid-cols-3 gap-2 sm:gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-[#c4c7dc]">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>ON-CHAIN ENFORCEMENT</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#c4c7dc]">
              <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
              <span>MULTI-AXIS REPUTATION</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#c4c7dc]">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>REASONING RECEIPTS</span>
            </div>
          </div>

          {/* Thesis Bottom Signal */}
          <div className="pt-2 text-xs font-mono text-cyan-400/90 tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>THE MODEL CAN PROPOSE. THE CHARTER ENFORCES.</span>
          </div>

        </motion.div>

        {/* RIGHT COLUMN: Interactive 3D Spline Canvas (~55% width = col-span-7) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-7 relative h-[420px] sm:h-[500px] lg:h-[560px] w-full rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#0c1024]/80 shadow-[0_0_40px_rgba(34,211,238,0.15)] group"
        >
          {/* Spotlight Effect over 3D Canvas */}
          <Spotlight fill="rgba(124, 108, 245, 0.25)" />

          {/* 3D Spline Scene */}
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />

          {/* Floating Status Card (Bottom-Right Overlay) */}
          <div className="absolute bottom-4 right-4 z-20 bg-[#0a0d1d]/90 border border-emerald-500/30 backdrop-blur-xl p-3.5 rounded-xl shadow-2xl flex items-center gap-3 font-mono">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <div>
              <span className="text-[10px] text-[#858aa6] uppercase tracking-wider block">
                VERIXIA TRUST LAYER
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase">
                STATUS: ENFORCEMENT ACTIVE
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
