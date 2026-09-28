import React from "react"
import { ShieldCheck, Terminal, Lock, Shield, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface LandingNavProps {
  onOpenCommandCenter: () => void
}

export const LandingNav: React.FC<LandingNavProps> = ({ onOpenCommandCenter }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#030507]/90 border-b border-slate-800/80 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <ShieldCheck className="w-5.5 h-5.5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-white font-mono">
                VERIXIA
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 hidden sm:inline-block">
                TRUST LAYER
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              ON-CHAIN TRUST INFRASTRUCTURE
            </p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 font-mono text-xs text-slate-300">
          <a href="#technology" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Technology
          </a>
          <a href="#how-it-works" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-violet-400" /> How It Works
          </a>
          <a href="#security" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Security
          </a>
          <a href="#demo" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-red-400" /> Live Demo
          </a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCommandCenter}
            className="font-mono text-xs font-bold gap-2 bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] py-2 px-4"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            OPEN COMMAND CENTER
          </Button>
        </div>

      </div>
    </header>
  )
}
