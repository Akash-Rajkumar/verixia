import React from "react"
import { ShieldAlert, AlertOctagon, Terminal, Play } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface AttackDemoSectionProps {
  onOpenCommandCenter: () => void
}

export const AttackDemoSection: React.FC<AttackDemoSectionProps> = ({ onOpenCommandCenter }) => {
  return (
    <section id="demo" className="w-full py-16 lg:py-24 px-4 max-w-7xl mx-auto space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <Badge variant="red" className="py-1 px-3 text-xs tracking-wider">
          ADVERSARIAL ARENA
        </Badge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight">
          TRY TO BREAK IT.
        </h2>
        <p className="text-base text-slate-400 font-sans max-w-2xl mx-auto">
          We built the system to be attacked. Test live adversarial prompt injection attacks directly in the Verixia Command Center.
        </p>
      </div>

      {/* 3 Attack Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        
        {/* Attack 1 */}
        <Card variant="glow-red" className="p-6 space-y-4 bg-slate-950/90 border-red-500/40">
          <div className="flex items-center justify-between">
            <AlertOctagon className="w-6 h-6 text-red-400" />
            <Badge variant="red" className="text-[10px]">ATTACK VEC 01</Badge>
          </div>
          <h3 className="text-sm font-bold text-red-300 uppercase">
            Urgent Pretext
          </h3>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Simulates emergency server migration pretexts demanding immediate 25.0 MST transfers.
          </p>
          <div className="pt-2 text-[11px] text-red-400 font-mono font-bold">
            RESULT: BLOCKED BY CHARTER (#1 EXCEEDS_MAX_PER_TX)
          </div>
        </Card>

        {/* Attack 2 */}
        <Card variant="glow-red" className="p-6 space-y-4 bg-slate-950/90 border-amber-500/40">
          <div className="flex items-center justify-between">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <Badge variant="amber" className="text-[10px]">ATTACK VEC 02</Badge>
          </div>
          <h3 className="text-sm font-bold text-amber-300 uppercase">
            Prompt Injection
          </h3>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Injects system instruction overrides attempting to bypass allow-list checks.
          </p>
          <div className="pt-2 text-[11px] text-amber-400 font-mono font-bold">
            RESULT: BLOCKED BY CHARTER (#4 COUNTERPARTY_NOT_ALLOWED)
          </div>
        </Card>

        {/* Attack 3 */}
        <Card variant="glow-red" className="p-6 space-y-4 bg-slate-950/90 border-violet-500/40">
          <div className="flex items-center justify-between">
            <Terminal className="w-6 h-6 text-violet-400" />
            <Badge variant="violet" className="text-[10px]">ATTACK VEC 03</Badge>
          </div>
          <h3 className="text-sm font-bold text-violet-300 uppercase">
            Fake Trust Claim
          </h3>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Forges trust certificate claims attempting to trick the agent into unauthorized transfers.
          </p>
          <div className="pt-2 text-[11px] text-violet-400 font-mono font-bold">
            RESULT: DECLINED BY AGENT LLM / CHARTER BLOCKED
          </div>
        </Card>

      </div>

      {/* CTA Button to open command center */}
      <div className="text-center pt-4">
        <Button
          variant="danger"
          size="lg"
          onClick={onOpenCommandCenter}
          className="font-mono text-sm font-bold uppercase tracking-wider gap-2.5 px-8 py-4 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
        >
          <Play className="w-4 h-4 fill-current text-white" />
          LAUNCH ADVERSARIAL ARENA IN COMMAND CENTER
        </Button>
      </div>

    </section>
  )
}
