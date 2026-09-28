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
    <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden py-12 lg:py-16 bg-black">
      
      {/* Background Ambient Glow */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(223, 255, 0, 0.08)" />
      
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
            <Badge variant="cyan" className="py-1 px-3 gap-1.5 text-xs tracking-wider shadow-[0_0_12px_rgba(223,255,0,0.2)] bg-black border-[#dfff00]/50 text-[#dfff00]">
              <span className="w-2 h-2 rounded-full bg-[#dfff00] animate-pulse" />
              ON-CHAIN TRUST LAYER FOR AI AGENTS
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
            AI CAN DECIDE.{" "}
            <span className="text-[#dfff00] drop-shadow-[0_0_25px_rgba(223,255,0,0.3)] font-mono">
              BLOCKCHAIN
            </span>{" "}
            DECIDES WHAT IT'S ALLOWED TO DO.
          </h1>

          {/* Supporting Paragraph */}
          <p className="text-base sm:text-lg text-white/70 font-sans leading-relaxed max-w-xl">
            Autonomous AI agents are beginning to transact on behalf of people and organizations. Verixia adds a programmable trust and enforcement layer that keeps financial authority outside the model.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onOpenCommandCenter}
              className="font-mono text-sm font-bold tracking-wider uppercase gap-2.5 px-6 py-3.5 bg-black text-white hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/80 shadow-[0_0_25px_rgba(223,255,0,0.3)] transition-all duration-300"
            >
              <Play className="w-4 h-4 fill-current text-[#dfff00] group-hover:text-black" />
              ENTER LIVE DEMO
            </Button>

            <a
              href="#trust-layer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/20 bg-black hover:bg-white/10 text-white text-sm font-mono transition-all shadow-sm"
            >
              EXPLORE THE TRUST LAYER
              <ArrowRight className="w-4 h-4 text-[#dfff00]" />
            </a>
          </div>

          {/* Hero Trust Pillars Row */}
          <div className="pt-6 border-t border-white/12 grid grid-cols-3 gap-2 sm:gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-white/80">
              <Lock className="w-4 h-4 text-[#dfff00] shrink-0" />
              <span>ON-CHAIN ENFORCEMENT</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/80">
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <span>MULTI-AXIS REPUTATION</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/80">
              <FileCheck className="w-4 h-4 text-[#dfff00] shrink-0" />
              <span>REASONING RECEIPTS</span>
            </div>
          </div>

          {/* Thesis Bottom Signal */}
          <div className="pt-2 text-xs font-mono text-[#dfff00] tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#dfff00]" />
            <span>THE MODEL CAN PROPOSE. THE CHARTER ENFORCES.</span>
          </div>

        </motion.div>

        {/* RIGHT COLUMN: Interactive 3D Spline Canvas (~55% width = col-span-7) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-7 relative h-[420px] sm:h-[500px] lg:h-[560px] w-full rounded-2xl overflow-hidden border border-white/15 hover:border-[#dfff00]/50 bg-black shadow-[0_0_40px_rgba(255,255,255,0.05)] transition-colors group"
        >
          {/* Subtle Radial Yellow Highlight behind 3D Object */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,255,0,0.06)_0%,transparent_60%)] pointer-events-none z-0" />

          {/* Spotlight Effect over 3D Canvas */}
          <Spotlight fill="rgba(255, 255, 255, 0.08)" />

          {/* 3D Spline Scene */}
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full relative z-10"
          />

          {/* Floating Status Card (Bottom-Right Overlay) */}
          <div className="absolute bottom-4 right-4 z-20 bg-black/85 border border-white/20 backdrop-blur-xl p-3.5 rounded-xl shadow-2xl flex items-center gap-3 font-mono">
            <div className="w-2.5 h-2.5 rounded-full bg-[#dfff00] animate-pulse shadow-[0_0_10px_rgba(223,255,0,0.8)]" />
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block">
                VERIXIA TRUST LAYER
              </span>
              <span className="text-xs font-bold text-[#dfff00] uppercase">
                STATUS: ENFORCEMENT ACTIVE
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
