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
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none",
          size === "sm" && "px-3 py-1.5 text-xs font-mono",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-3 text-base font-semibold",
          variant === "primary" &&
            "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] focus:ring-cyan-500 border border-cyan-400/30",
          variant === "secondary" &&
            "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 focus:ring-slate-500",
          variant === "danger" &&
            "bg-red-600/90 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] focus:ring-red-500 border border-red-400/30",
          variant === "amber" &&
            "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] focus:ring-amber-500 border border-amber-400/30",
          variant === "ghost" &&
            "bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white border border-transparent",
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = "Button"
