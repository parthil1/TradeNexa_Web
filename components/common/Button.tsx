"use client";

import React from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-[var(--shadow-button)] hover:bg-primary-hover active:scale-[0.98]",
  secondary:
    "bg-white text-foreground border border-border hover:bg-muted hover:border-border-strong active:scale-[0.98]",
  ghost: "bg-transparent text-muted-fg hover:bg-primary-soft hover:text-primary",
  danger: "bg-error text-white hover:bg-error-hover active:scale-[0.98]",
  outline:
    "bg-transparent text-primary border border-primary/25 hover:bg-primary-soft hover:border-primary/40 active:scale-[0.98]",
  accent:
    "bg-accent text-white shadow-sm hover:bg-accent-hover active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold",
  md: "h-10 px-4 text-sm gap-2 rounded-lg font-semibold",
  lg: "h-11 px-5 text-sm gap-2 rounded-lg font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  fullWidth = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
