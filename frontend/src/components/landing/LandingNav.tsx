import React from "react"
import { ShieldCheck, Terminal, Lock, Shield, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface LandingNavProps {
  onOpenCommandCenter: () => void
}

export const LandingNav: React.FC<LandingNavProps> = ({ onOpenCommandCenter }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-black/85 border-b border-white/12 backdrop-blur-2xl px-4 lg:px-8 py-3.5 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-lg bg-black border border-[#dfff00]/60 flex items-center justify-center shadow-[0_0_15px_rgba(223,255,0,0.25)] relative group">
            <div className="absolute inset-0 rounded-lg bg-[#dfff00]/10 blur-sm pointer-events-none" />
            <ShieldCheck className="w-5 h-5 text-[#dfff00] relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-white font-mono">
                VERIXIA
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#101010] text-[#dfff00] border border-[#dfff00]/40 hidden sm:inline-block">
                TRUST LAYER
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-mono tracking-tight hidden sm:block">
              ON-CHAIN TRUST INFRASTRUCTURE
            </p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 font-mono text-xs text-white">
          <a href="#technology" className="hover:text-[#dfff00] transition-colors flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-[#dfff00]" /> Technology
          </a>
          <a href="#how-it-works" className="hover:text-[#dfff00] transition-colors flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-white/70" /> How It Works
          </a>
          <a href="#security" className="hover:text-[#dfff00] transition-colors flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-white/70" /> Security
          </a>
          <a href="#demo" className="hover:text-[#dfff00] transition-colors flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#dfff00]" /> Live Demo
          </a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCommandCenter}
            className="font-mono text-xs font-bold gap-2 bg-black text-white hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/60 shadow-[0_0_18px_rgba(223,255,0,0.2)] py-2 px-4 transition-all duration-300"
          >
            <Terminal className="w-4 h-4 text-[#dfff00] group-hover:text-black" />
            OPEN COMMAND CENTER
          </Button>
        </div>

      </div>
    </header>
  )
}
