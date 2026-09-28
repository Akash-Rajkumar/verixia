import React from "react"
import { clsx } from "clsx"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "amber" | "ghost"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center font-mono font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]",
          size === "sm" && "px-3.5 py-2 text-xs",
          size === "md" && "px-4.5 py-2.5 text-sm",
          size === "lg" && "px-6 py-3.5 text-base tracking-wider uppercase",
          variant === "primary" &&
            "bg-black text-white hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/60 shadow-[0_0_20px_rgba(223,255,0,0.15)] focus:ring-[#dfff00]",
          variant === "secondary" &&
            "bg-black/80 text-white hover:bg-white/10 border border-white/20 focus:ring-white",
          variant === "danger" &&
            "bg-black text-[#dfff00] hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/80 shadow-[0_0_24px_rgba(223,255,0,0.25)] focus:ring-[#dfff00]",
          variant === "amber" &&
            "bg-black text-white hover:bg-white/15 border border-white/30 focus:ring-white",
          variant === "ghost" &&
            "bg-transparent hover:bg-white/10 text-white/70 hover:text-white border border-transparent",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin -ml-1 mr-1 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>PROCESSING...</span>
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = "Button"
