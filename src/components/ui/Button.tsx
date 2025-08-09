"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gradient";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantToClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0EA5E9] hover:bg-[#0C94CF] text-white shadow-sm disabled:opacity-50 disabled:hover:bg-[#0EA5E9]",
  secondary:
    "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 disabled:opacity-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  danger: "bg-[#EF4444] hover:bg-[#DC2626] text-white disabled:opacity-50",
  gradient:
    "text-white shadow-sm bg-[linear-gradient(90deg,#0EA5E9_0%,#0C94CF_100%)] hover:brightness-95 disabled:opacity-50",
};

const sizeToClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className = "",
  fullWidth,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]",
        sizeToClass[size],
        variantToClass[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}

export default Button;
