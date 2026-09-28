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
    <header className="w-full bg-slate-950/90 border-b border-slate-800/90 backdrop-blur-xl px-4 lg:px-8 py-3.5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* LEFT: Branding & Live Metadata Badges */}
        <div className="flex items-center flex-wrap gap-3">
          
          {/* Back to Landing Button */}
          {onBackToLanding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLanding}
              className="text-xs font-mono gap-1 text-slate-400 hover:text-cyan-400 p-1.5"
              title="Return to Verixia Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Landing</span>
            </Button>
          )}

          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <ShieldCheck className="w-5.5 h-5.5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white font-mono">
                  VERIXIA
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  ENFORCEMENT LAYER
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                On-Chain Autonomous AI Agent Spending Safeguard
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5">
            {connectionMode === "realtime" && (
              <Badge variant="emerald" className="gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Radio className="w-3 h-3" />
                REALTIME
              </Badge>
            )}
            {connectionMode === "polling" && (
              <Badge variant="amber" className="gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <Radio className="w-3 h-3" />
                POLLING
              </Badge>
            )}
            {connectionMode === "disconnected" && (
              <Badge variant="red" className="gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                DISCONNECTED
              </Badge>
            )}
          </div>

          {/* Chain Badge */}
          <Badge variant="cyan" className="gap-1">
            <Database className="w-3 h-3" />
            MST • CHAIN {config?.chainId || 1337}
          </Badge>

          {/* Model Provider Badge */}
          <Badge variant="violet" className="gap-1">
            <Cpu className="w-3 h-3" />
            {(config?.modelProvider || "GEMINI").toUpperCase()}
          </Badge>

          {/* Fell Back to Ollama Warning Badge */}
          {fellBackToOllama && (
            <Badge variant="amber" className="gap-1 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              FELL BACK TO OLLAMA
            </Badge>
          )}

          {/* Presentation Mode Toggle Button */}
          {onTogglePresentationMode && (
            <Button
              variant={isPresentationMode ? "primary" : "secondary"}
              size="sm"
              onClick={onTogglePresentationMode}
              className="text-xs font-mono gap-1.5 py-1 px-2.5 ml-1 border-cyan-500/40"
              title="Toggle Judge Presentation Mode (Press 'P')"
            >
              {isPresentationMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  Exit Demo (P)
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  Presentation (P)
                </>
              )}
            </Button>
          )}
        </div>

        {/* RIGHT: GIANT LIVE SCOREBOARD */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 shadow-inner">
          {/* 1. ATTACKS BLOCKED */}
          <div className="flex flex-col items-center px-3 border-r border-slate-800">
            <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
              Attacks Blocked
            </span>
            <div className="text-2xl font-bold font-mono text-cyan-400 min-w-[2.5rem] text-center">
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

          {/* 2. DECLINED BY AGENT */}
          <div className="flex flex-col items-center px-3 border-r border-slate-800">
            <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
              Declined
            </span>
            <div className="text-2xl font-bold font-mono text-amber-400 min-w-[2.5rem] text-center">
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

          {/* 3. SUCCEEDED - RED ALARM (CRITICAL REQUIREMENT: ALWAYS SHOWN) */}
          <div className="flex flex-col items-center px-3 py-0.5 rounded-lg bg-red-950/80 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-pulse">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-red-300 uppercase tracking-wider">
                Succeeded 🔴
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-red-400 min-w-[2.5rem] text-center">
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
