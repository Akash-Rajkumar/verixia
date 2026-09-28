import React from "react"
import { LandingNav } from "./LandingNav"
import { HeroSection } from "./HeroSection"
import { TrustBand } from "./TrustBand"
import { ProblemSection } from "./ProblemSection"
import { ThreeMechanismsSection } from "./ThreeMechanismsSection"
import { HowItWorksSection } from "./HowItWorksSection"
import { SecuritySection } from "./SecuritySection"
import { AttackDemoSection } from "./AttackDemoSection"
import { TransactionConsoleSection } from "./TransactionConsoleSection"
import { FinalCTASection } from "./FinalCTASection"
import { LandingFooter } from "./LandingFooter"

export interface VerixiaLandingPageProps {
  onOpenCommandCenter: () => void
}

export const VerixiaLandingPage: React.FC<VerixiaLandingPageProps> = ({ onOpenCommandCenter }) => {
  return (
    <div className="min-h-screen bg-[#080a16] text-[#f1f2ff] flex flex-col font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      
      {/* 1. NAV */}
      <LandingNav onOpenCommandCenter={onOpenCommandCenter} />

      {/* 2. HERO + SPLINE 3D (Midnight Blue #080A16) */}
      <div className="bg-[#080a16]">
        <HeroSection onOpenCommandCenter={onOpenCommandCenter} />
      </div>

      {/* 3. TRUST BAND (Deep Indigo #0A0D1D) */}
      <div className="bg-[#0a0d1d] border-y border-[#1f264d]/60">
        <TrustBand />
      </div>

      {/* 4. PROBLEM SECTION (Navy-Violet #0C1024) */}
      <div className="bg-[#0c1024]">
        <ProblemSection />
      </div>

      {/* 5. THREE TRUST-LAYER MECHANISMS (Deep Blue #081024) */}
      <div className="bg-[#081024]">
        <ThreeMechanismsSection />
      </div>

      {/* 6. HOW IT WORKS (Indigo #10132B) */}
      <div className="bg-[#10132b]">
        <HowItWorksSection />
      </div>

      {/* 7. SECURITY PRINCIPLE (Midnight Blue #080A16) */}
      <div className="bg-[#080a16]">
        <SecuritySection />
      </div>

      {/* 8. TRY TO BREAK IT (ATTACK DEMO TEASER) (Deep Indigo #0A0D1D) */}
      <div className="bg-[#0a0d1d]">
        <AttackDemoSection onOpenCommandCenter={onOpenCommandCenter} />
      </div>

      {/* 9. ILLUSTRATIVE TRANSACTION CONSOLE (Navy-Violet #0C1024) */}
      <div className="bg-[#0c1024]">
        <TransactionConsoleSection />
      </div>

      {/* 10. FINAL CTA (Deep Blue #081024) */}
      <div className="bg-[#081024]">
        <FinalCTASection onOpenCommandCenter={onOpenCommandCenter} />
      </div>

      {/* 11. FOOTER (Midnight Dark #060812) */}
      <div className="bg-[#060812]">
        <LandingFooter onOpenCommandCenter={onOpenCommandCenter} />
      </div>

    </div>
  )
}
