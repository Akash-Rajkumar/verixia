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
    <div className="min-h-screen bg-[#030507] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      
      {/* 1. NAV */}
      <LandingNav onOpenCommandCenter={onOpenCommandCenter} />

      {/* 2. HERO + SPLINE 3D */}
      <HeroSection onOpenCommandCenter={onOpenCommandCenter} />

      {/* 3. TRUST BAND */}
      <TrustBand />

      {/* 4. PROBLEM SECTION */}
      <ProblemSection />

      {/* 5. THREE TRUST-LAYER MECHANISMS */}
      <ThreeMechanismsSection />

      {/* 6. HOW IT WORKS */}
      <HowItWorksSection />

      {/* 7. SECURITY PRINCIPLE */}
      <SecuritySection />

      {/* 8. TRY TO BREAK IT (ATTACK DEMO TEASER) */}
      <AttackDemoSection onOpenCommandCenter={onOpenCommandCenter} />

      {/* 9. ILLUSTRATIVE TRANSACTION CONSOLE */}
      <TransactionConsoleSection />

      {/* 10. FINAL CTA */}
      <FinalCTASection onOpenCommandCenter={onOpenCommandCenter} />

      {/* 11. FOOTER */}
      <LandingFooter onOpenCommandCenter={onOpenCommandCenter} />

    </div>
  )
}
