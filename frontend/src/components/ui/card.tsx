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
          "rounded-xl transition-all duration-200 border backdrop-blur-xl",
          variant === "default" && "bg-[#0c1024]/85 border-indigo-900/30 shadow-[0_4px_24px_rgba(8,10,22,0.6)]",
          variant === "glow-cyan" && "bg-[#0a172c]/85 border-cyan-500/35 shadow-[0_0_25px_rgba(34,211,238,0.12)]",
          variant === "glow-red" && "bg-[#250d19]/85 border-rose-500/40 shadow-[0_0_25px_rgba(251,79,99,0.15)]",
          variant === "glow-violet" && "bg-[#1d163e]/85 border-violet-500/35 shadow-[0_0_25px_rgba(124,108,245,0.15)]",
          variant === "glow-emerald" && "bg-[#092723]/85 border-emerald-500/35 shadow-[0_0_25px_rgba(52,211,153,0.12)]",
          variant === "outline" && "bg-transparent border-indigo-900/40",
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

