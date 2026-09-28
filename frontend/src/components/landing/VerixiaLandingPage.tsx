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
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#dfff00] selection:text-black overflow-x-hidden">
      
      {/* 1. NAV */}
      <LandingNav onOpenCommandCenter={onOpenCommandCenter} />

      {/* 2. HERO + SPLINE 3D (Pure Black) */}
      <div className="bg-black">
        <HeroSection onOpenCommandCenter={onOpenCommandCenter} />
      </div>

      {/* 3. TRUST BAND (Soft Black #050505) */}
      <div className="bg-[#050505] border-y border-white/12">
        <TrustBand />
      </div>

      {/* 4. PROBLEM SECTION (Black) */}
      <div className="bg-black">
        <ProblemSection />
      </div>

      {/* 5. THREE TRUST-LAYER MECHANISMS (Soft Black #050505) */}
      <div className="bg-[#050505]">
        <ThreeMechanismsSection />
      </div>

      {/* 6. HOW IT WORKS (Black) */}
      <div className="bg-black">
        <HowItWorksSection />
      </div>

      {/* 7. SECURITY PRINCIPLE (Soft Black #050505) */}
      <div className="bg-[#050505]">
        <SecuritySection />
      </div>

      {/* 8. TRY TO BREAK IT (ATTACK DEMO TEASER) (Black) */}
      <div className="bg-black">
        <AttackDemoSection onOpenCommandCenter={onOpenCommandCenter} />
      </div>

      {/* 9. ILLUSTRATIVE TRANSACTION CONSOLE (Soft Black #050505) */}
      <div className="bg-[#050505]">
        <TransactionConsoleSection />
      </div>

      {/* 10. FINAL CTA (Black) */}
      <div className="bg-black">
        <FinalCTASection onOpenCommandCenter={onOpenCommandCenter} />
      </div>

      {/* 11. FOOTER (Soft Black #050505) */}
      <div className="bg-[#050505]">
        <LandingFooter onOpenCommandCenter={onOpenCommandCenter} />
      </div>

    </div>
  )
}
