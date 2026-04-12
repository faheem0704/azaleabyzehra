"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, onClick, type, ...rest }, ref) => {
    const base =
      "inline-flex items-center justify-center font-inter tracking-wider uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden";

    const variants = {
      primary: "bg-rose-gold text-white hover:bg-rose-gold-dark active:scale-95",
      outline: "border border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-white active:scale-95",
      ghost: "text-charcoal hover:text-rose-gold",
      danger: "bg-red-500 text-white hover:bg-red-600 active:scale-95",
    };

    const sizes = {
      sm: "px-5 py-2 text-xs",
      md: "px-8 py-3 text-sm",
      lg: "px-10 py-4 text-sm",
    };

    return (
      <button
        ref={ref}
        type={type || "button"}
        onClick={onClick}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
