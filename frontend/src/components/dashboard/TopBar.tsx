import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Cpu, Database, AlertTriangle, Radio, Maximize2, Minimize2, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PublicConfig } from "@/api/types"
import type { ConnectionMode } from "@/hooks/useLiveFeed"

export interface TopBarProps {
  config: PublicConfig | null
  connectionMode: ConnectionMode
  scoreboard: {
    blocked: number
    declined: number
    succeeded: number
  }
  fellBackToOllama?: boolean
  isPresentationMode?: boolean
  onTogglePresentationMode?: () => void
  onBackToLanding?: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  config,
  connectionMode,
  scoreboard,
  fellBackToOllama = false,
  isPresentationMode = false,
  onTogglePresentationMode,
  onBackToLanding,
}) => {
  return (
    <header className="w-full bg-black/85 border-b border-white/12 backdrop-blur-2xl px-4 lg:px-8 py-3.5 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* LEFT: Branding & Live Metadata Badges */}
        <div className="flex items-center flex-wrap gap-3">
          
          {/* Back to Landing Button */}
          {onBackToLanding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLanding}
              className="text-xs font-mono gap-1 text-white/70 hover:text-[#dfff00] p-1.5 hover:bg-white/10"
              title="Return to Verixia Landing Page"
            >
              <ArrowLeft className="w-4 h-4 text-[#dfff00]" />
              <span className="hidden sm:inline">Landing</span>
            </Button>
          )}

          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-2">
            <div className="w-8 h-8 rounded-lg bg-black border border-[#dfff00]/60 flex items-center justify-center shadow-[0_0_15px_rgba(223,255,0,0.25)] relative group">
              <div className="absolute inset-0 rounded-lg bg-[#dfff00]/10 blur-sm pointer-events-none" />
              <ShieldCheck className="w-5 h-5 text-[#dfff00] relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white font-mono">
                  VERIXIA
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#101010] text-[#dfff00] border border-[#dfff00]/40">
                  ENFORCEMENT LAYER
                </span>
              </div>
              <p className="text-[11px] text-white/60 font-sans">
                On-Chain Autonomous AI Agent Spending Safeguard
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/12 hidden sm:block" />

          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5">
            {connectionMode === "realtime" && (
              <Badge variant="cyan" className="gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#dfff00] animate-pulse shadow-[0_0_8px_rgba(223,255,0,0.8)]" />
                <Radio className="w-3 h-3" />
                REALTIME
              </Badge>
            )}
            {connectionMode === "polling" && (
              <Badge variant="amber" className="gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                <Radio className="w-3 h-3" />
                POLLING
              </Badge>
            )}
            {connectionMode === "disconnected" && (
              <Badge variant="neutral" className="gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/30" />
                DISCONNECTED
              </Badge>
            )}
          </div>

          {/* Chain Badge */}
          <Badge variant="neutral" className="gap-1">
            <Database className="w-3 h-3 text-[#dfff00]" />
            MST • CHAIN {config?.mstChainId || config?.chainId || "——"}
          </Badge>

          {/* Model Provider Badge */}
          <Badge variant="neutral" className="gap-1">
            <Cpu className="w-3 h-3 text-white/80" />
            {(config?.modelProvider || "GEMINI").toUpperCase()}
          </Badge>

          {/* Fell Back to Ollama Warning Badge */}
          {fellBackToOllama && (
            <Badge variant="cyan" className="gap-1">
              <AlertTriangle className="w-3 h-3 text-[#dfff00]" />
              FELL BACK TO OLLAMA
            </Badge>
          )}

          {/* Presentation Mode Toggle Button */}
          {onTogglePresentationMode && (
            <Button
              variant={isPresentationMode ? "primary" : "secondary"}
              size="sm"
              onClick={onTogglePresentationMode}
              className="text-xs font-mono gap-1.5 py-1 px-2.5 ml-1 border-white/20"
              title="Toggle Judge Presentation Mode (Press 'P')"
            >
              {isPresentationMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  Exit Demo (P)
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#dfff00]" />
                  Presentation (P)
                </>
              )}
            </Button>
          )}
        </div>

        {/* RIGHT: GIANT LIVE SCOREBOARD */}
        <div className="flex items-center gap-3 bg-black/90 border border-white/15 rounded-xl p-1.5 shadow-2xl">
          
          {/* 1. ATTACKS BLOCKED (Neon Yellow Warning Accent) */}
          <div className="flex flex-col items-center px-3.5 py-1 rounded-lg bg-[#0a0a0a] border border-[#dfff00]/50 shadow-[0_0_15px_rgba(223,255,0,0.12)]">
            <span className="text-[10px] font-mono font-bold text-[#dfff00] uppercase tracking-wider">
              Attacks Blocked
            </span>
            <div className="text-2xl font-bold font-mono text-[#dfff00] min-w-[2.5rem] text-center">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={scoreboard.blocked}
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 12, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block"
                >
                  {scoreboard.blocked.toString().padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* 2. DECLINED BY AGENT (White Accent) */}
          <div className="flex flex-col items-center px-3.5 py-1 rounded-lg bg-[#0a0a0a] border border-white/20">
            <span className="text-[10px] font-mono font-medium text-white/70 uppercase tracking-wider">
              Declined
            </span>
            <div className="text-2xl font-bold font-mono text-white min-w-[2.5rem] text-center">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={scoreboard.declined}
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 12, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block"
                >
                  {scoreboard.declined.toString().padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* 3. SUCCEEDED - SHOWN WITH WHITE + YELLOW HIGHLIGHT */}
          <div className="flex flex-col items-center px-3.5 py-1 rounded-lg bg-[#0a0a0a] border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                Succeeded
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white min-w-[2.5rem] text-center">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={scoreboard.succeeded}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="inline-block"
                >
                  {scoreboard.succeeded.toString().padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </header>
  )
}
