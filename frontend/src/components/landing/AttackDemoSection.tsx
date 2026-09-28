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
        <Badge variant="cyan" className="py-1 px-3 text-xs tracking-wider">
          ADVERSARIAL ARENA
        </Badge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight">
          TRY TO BREAK IT.
        </h2>
        <p className="text-base text-white/70 font-sans max-w-2xl mx-auto">
          We built the system to be attacked. Test live adversarial prompt injection attacks directly in the Verixia Command Center.
        </p>
      </div>

      {/* 3 Attack Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        
        {/* Attack 1 */}
        <Card className="p-6 space-y-4 bg-black border border-white/15 hover:border-[#dfff00]/60 transition-all">
          <div className="flex items-center justify-between">
            <AlertOctagon className="w-6 h-6 text-[#dfff00]" />
            <Badge variant="cyan" className="text-[10px]">ATTACK VEC 01</Badge>
          </div>
          <h3 className="text-sm font-bold text-[#dfff00] uppercase">
            Urgent Pretext
          </h3>
          <p className="text-xs text-white/80 font-sans leading-relaxed">
            Simulates emergency server migration pretexts demanding immediate 25.0 MST transfers.
          </p>
          <div className="pt-2 text-[11px] text-[#dfff00] font-mono font-bold">
            RESULT: BLOCKED BY CHARTER (#1 EXCEEDS_MAX_PER_TX)
          </div>
        </Card>

        {/* Attack 2 */}
        <Card className="p-6 space-y-4 bg-black border border-white/15 hover:border-[#dfff00]/60 transition-all">
          <div className="flex items-center justify-between">
            <ShieldAlert className="w-6 h-6 text-[#dfff00]" />
            <Badge variant="cyan" className="text-[10px]">ATTACK VEC 02</Badge>
          </div>
          <h3 className="text-sm font-bold text-[#dfff00] uppercase">
            Prompt Injection
          </h3>
          <p className="text-xs text-white/80 font-sans leading-relaxed">
            Injects system instruction overrides attempting to bypass allow-list checks.
          </p>
          <div className="pt-2 text-[11px] text-[#dfff00] font-mono font-bold">
            RESULT: BLOCKED BY CHARTER (#4 COUNTERPARTY_NOT_ALLOWED)
          </div>
        </Card>

        {/* Attack 3 */}
        <Card className="p-6 space-y-4 bg-black border border-white/15 hover:border-[#dfff00]/60 transition-all">
          <div className="flex items-center justify-between">
            <Terminal className="w-6 h-6 text-[#dfff00]" />
            <Badge variant="cyan" className="text-[10px]">ATTACK VEC 03</Badge>
          </div>
          <h3 className="text-sm font-bold text-[#dfff00] uppercase">
            Fake Trust Claim
          </h3>
          <p className="text-xs text-white/80 font-sans leading-relaxed">
            Forges trust certificate claims attempting to trick the agent into unauthorized transfers.
          </p>
          <div className="pt-2 text-[11px] text-[#dfff00] font-mono font-bold">
            RESULT: DECLINED BY AGENT LLM / CHARTER BLOCKED
          </div>
        </Card>

      </div>

      {/* CTA Button to open command center */}
      <div className="text-center pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={onOpenCommandCenter}
          className="font-mono text-sm font-bold uppercase tracking-wider gap-2.5 px-8 py-4 bg-black text-white hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/80 shadow-[0_0_30px_rgba(223,255,0,0.3)] transition-all duration-300"
        >
          <Play className="w-4 h-4 fill-current text-[#dfff00] group-hover:text-black" />
          LAUNCH ADVERSARIAL ARENA IN COMMAND CENTER
        </Button>
      </div>

    </section>
  )
}
