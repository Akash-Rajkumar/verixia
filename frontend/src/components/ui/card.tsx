import React from "react"
import { clsx } from "clsx"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glow-cyan" | "glow-red" | "glow-emerald" | "glow-violet" | "outline"
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-2xl transition-all duration-300 border backdrop-blur-2xl",
          variant === "default" && "bg-[#0a0a0a]/90 border-white/12 shadow-[0_10px_40px_rgba(0,0,0,0.8)]",
          variant === "glow-cyan" && "bg-[#0f0f0f]/95 border-[#dfff00]/50 shadow-[0_0_30px_rgba(223,255,0,0.10)]",
          variant === "glow-red" && "bg-[#141208]/95 border-[#dfff00]/60 shadow-[0_0_30px_rgba(223,255,0,0.14)]",
          variant === "glow-violet" && "bg-[#0d0d0d]/90 border-white/20 shadow-[0_0_24px_rgba(255,255,255,0.06)]",
          variant === "glow-emerald" && "bg-[#0a0a0a]/95 border-white/30 shadow-[0_0_24px_rgba(255,255,255,0.08)]",
          variant === "outline" && "bg-transparent border-white/15",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = "Card"
