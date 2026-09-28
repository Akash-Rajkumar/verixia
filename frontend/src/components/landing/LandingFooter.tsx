import React from "react"
import { ShieldCheck, Code2, Terminal } from "lucide-react"

export interface LandingFooterProps {
  onOpenCommandCenter: () => void
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onOpenCommandCenter }) => {
  return (
    <footer className="w-full border-t border-slate-800 bg-[#030507] py-10 px-4 font-mono text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-bold text-white text-sm font-mono">VERIXIA</span>
            <p className="text-[10px] text-slate-400">ON-CHAIN TRUST INFRASTRUCTURE FOR AI AGENTS</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
          <a href="#technology" className="hover:text-cyan-400 transition-colors">Technology</a>
          <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
          <a href="#security" className="hover:text-cyan-400 transition-colors">Security</a>
          <a href="#demo" className="hover:text-cyan-400 transition-colors">Live Demo</a>
          <a
            href="https://github.com/Akash-Rajkumar/verixia"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            <Code2 className="w-3.5 h-3.5" /> GitHub Repository
          </a>
          <button
            onClick={onOpenCommandCenter}
            className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-bold"
          >
            <Terminal className="w-3.5 h-3.5" /> Command Center
          </button>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-slate-800/60 text-center text-[10px] text-slate-400">
        Built for the agentic economy • MST Blockchain 24-Hour Buildathon • Person 4 Frontend Lead
      </div>
    </footer>
  )
}
