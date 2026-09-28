import React from "react"
import { ShieldCheck, Code2, Terminal } from "lucide-react"

export interface LandingFooterProps {
  onOpenCommandCenter: () => void
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onOpenCommandCenter }) => {
  return (
    <footer className="w-full border-t border-white/12 bg-black py-10 px-4 font-mono text-xs text-white/50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-black border border-[#dfff00]/60 flex items-center justify-center shadow-[0_0_12px_rgba(223,255,0,0.2)]">
            <ShieldCheck className="w-4 h-4 text-[#dfff00]" />
          </div>
          <div>
            <span className="font-bold text-white text-sm font-mono">VERIXIA</span>
            <p className="text-[10px] text-white/50">ON-CHAIN TRUST INFRASTRUCTURE FOR AI AGENTS</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/80">
          <a href="#technology" className="hover:text-[#dfff00] transition-colors">Technology</a>
          <a href="#how-it-works" className="hover:text-[#dfff00] transition-colors">How It Works</a>
          <a href="#security" className="hover:text-[#dfff00] transition-colors">Security</a>
          <a href="#demo" className="hover:text-[#dfff00] transition-colors">Live Demo</a>
          <a
            href="https://github.com/Akash-Rajkumar/verixia"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#dfff00] transition-colors flex items-center gap-1"
          >
            <Code2 className="w-3.5 h-3.5" /> GitHub Repository
          </a>
          <button
            onClick={onOpenCommandCenter}
            className="text-[#dfff00] hover:underline transition-colors flex items-center gap-1 font-bold"
          >
            <Terminal className="w-3.5 h-3.5" /> Command Center
          </button>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-white/10 text-center text-[10px] text-white/40">
        Built for the agentic economy • MST Blockchain 24-Hour Buildathon • Person 4 Frontend Lead
      </div>
    </footer>
  )
}
