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
      
      <Card className="p-8 lg:p-12 bg-black border border-white/15 shadow-2xl space-y-6 rounded-2xl">
        
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight leading-tight">
          GIVE AUTONOMOUS AGENTS RULES THEY CANNOT NEGOTIATE.
        </h2>

        <p className="text-base sm:text-lg text-white/70 font-sans max-w-2xl mx-auto">
          Verixia puts programmable financial boundaries beneath the intelligence layer.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={onOpenCommandCenter}
            className="font-mono text-sm font-bold uppercase tracking-wider gap-2.5 px-8 py-4 bg-black text-white hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/80 shadow-[0_0_30px_rgba(223,255,0,0.3)] transition-all duration-300"
          >
            <Play className="w-4 h-4 fill-current text-[#dfff00] group-hover:text-black" />
            ENTER COMMAND CENTER
          </Button>

          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 bg-black hover:bg-white/10 text-white text-sm font-mono transition-all shadow-sm"
          >
            <Terminal className="w-4 h-4 text-[#dfff00]" />
            VIEW HOW IT WORKS
          </a>
        </div>

      </Card>

    </section>
  )
}
