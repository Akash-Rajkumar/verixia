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
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide uppercase border",
        variant === "cyan" && "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        variant === "red" && "bg-red-500/15 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
        variant === "emerald" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        variant === "amber" && "bg-amber-500/10 text-amber-400 border-amber-500/30",
        variant === "violet" && "bg-violet-500/10 text-violet-400 border-violet-500/30",
        variant === "neutral" && "bg-slate-800/80 text-slate-300 border-slate-700",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
