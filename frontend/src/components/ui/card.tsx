import React from "react"
import { clsx } from "clsx"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glow-cyan" | "glow-red" | "glow-emerald" | "outline"
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-xl transition-all duration-200 border",
          variant === "default" && "bg-slate-950/70 border-slate-800/80 backdrop-blur-md",
          variant === "glow-cyan" && "bg-slate-950/80 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md",
          variant === "glow-red" && "bg-slate-950/80 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.2)] backdrop-blur-md",
          variant === "glow-emerald" && "bg-slate-950/80 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md",
          variant === "outline" && "bg-transparent border-slate-800",
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
