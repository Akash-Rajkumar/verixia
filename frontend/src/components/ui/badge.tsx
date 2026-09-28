import React from "react"
import { clsx } from "clsx"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "cyan" | "red" | "emerald" | "amber" | "violet" | "neutral"
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  children,
  ...props
}) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide uppercase border backdrop-blur-md",
        variant === "cyan" && "bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.15)]",
        variant === "red" && "bg-rose-950/85 text-rose-300 border-rose-500/45 shadow-[0_0_12px_rgba(251,79,99,0.25)]",
        variant === "emerald" && "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.15)]",
        variant === "amber" && "bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.15)]",
        variant === "violet" && "bg-violet-950/80 text-violet-300 border-violet-500/40 shadow-[0_0_10px_rgba(124,108,245,0.15)]",
        variant === "neutral" && "bg-[#121630]/90 text-[#c4c7dc] border-[#22284c]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

