import React from "react"
import { Play, Terminal } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface FinalCTASectionProps {
  onOpenCommandCenter: () => void
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onOpenCommandCenter }) => {
  return (
    <section className="w-full py-16 lg:py-24 px-4 max-w-5xl mx-auto text-center">
      
      <Card variant="glow-cyan" className="p-8 lg:p-12 bg-slate-950/95 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.2)] space-y-6">
        
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight leading-tight">
          GIVE AUTONOMOUS AGENTS RULES THEY CANNOT NEGOTIATE.
        </h2>

        <p className="text-base sm:text-lg text-slate-300 font-sans max-w-2xl mx-auto">
          Verixia puts programmable financial boundaries beneath the intelligence layer.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            variant="danger"
            size="lg"
            onClick={onOpenCommandCenter}
            className="font-mono text-sm font-bold uppercase tracking-wider gap-2.5 px-8 py-4 shadow-[0_0_25px_rgba(239,68,68,0.4)]"
          >
            <Play className="w-4 h-4 fill-current text-white" />
            ENTER COMMAND CENTER
          </Button>

          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-mono transition-all"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            VIEW HOW IT WORKS
          </a>
        </div>

      </Card>

    </section>
  )
}
