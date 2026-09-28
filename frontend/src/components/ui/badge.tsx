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
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide uppercase border backdrop-blur-md transition-all duration-200",
        variant === "cyan" && "bg-black/90 text-[#dfff00] border-[#dfff00]/50 shadow-[0_0_12px_rgba(223,255,0,0.18)]",
        variant === "red" && "bg-[#141208]/90 text-[#dfff00] border-[#dfff00]/70 shadow-[0_0_14px_rgba(223,255,0,0.22)]",
        variant === "emerald" && "bg-black/90 text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.12)]",
        variant === "amber" && "bg-black/90 text-white/90 border-white/20",
        variant === "violet" && "bg-black/90 text-white/80 border-white/20",
        variant === "neutral" && "bg-[#0a0a0a]/90 text-white/70 border-white/12",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
