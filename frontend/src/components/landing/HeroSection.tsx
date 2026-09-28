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
    <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden py-12 lg:py-16 bg-[#030507]">
      
      {/* Background Ambient Glow & Spotlight */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(6, 182, 212, 0.12)" />
      
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
            <Badge variant="cyan" className="py-1 px-3 gap-1.5 text-xs tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              ON-CHAIN TRUST LAYER FOR AI AGENTS
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
            AI CAN DECIDE.{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(6,182,212,0.3)]">
              BLOCKCHAIN DECIDES
            </span>{" "}
            WHAT IT'S ALLOWED TO DO.
          </h1>

          {/* Supporting Paragraph */}
          <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
            Autonomous AI agents are beginning to transact on behalf of people and organizations. Verixia adds a programmable trust and enforcement layer that keeps financial authority outside the model.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              variant="danger"
              size="lg"
              onClick={onOpenCommandCenter}
              className="font-mono text-sm font-bold tracking-wider uppercase gap-2.5 px-6 py-3.5 shadow-[0_0_25px_rgba(239,68,68,0.4)]"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              ENTER LIVE DEMO
            </Button>

            <a
              href="#trust-layer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-mono transition-all"
            >
              EXPLORE THE TRUST LAYER
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </a>
          </div>

          {/* Hero Trust Pillars Row */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-2 sm:gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>ON-CHAIN ENFORCEMENT</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
              <span>MULTI-AXIS REPUTATION</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
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
          className="lg:col-span-7 relative h-[420px] sm:h-[500px] lg:h-[560px] w-full rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/70 shadow-[0_0_35px_rgba(6,182,212,0.15)] group"
        >
          {/* Spotlight Effect over 3D Canvas */}
          <Spotlight fill="rgba(139, 92, 246, 0.2)" />

          {/* 3D Spline Scene */}
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />

          {/* Floating Status Card (Bottom-Right Overlay) */}
          <div className="absolute bottom-4 right-4 z-20 bg-slate-950/90 border border-slate-800/90 backdrop-blur-xl p-3.5 rounded-xl shadow-2xl flex items-center gap-3 font-mono">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
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
