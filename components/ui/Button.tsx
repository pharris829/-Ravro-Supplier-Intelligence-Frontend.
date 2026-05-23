"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size    = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:  "bg-mint text-obsidian font-semibold hover:bg-mint-dim active:scale-95 shadow-mint",
  secondary:"bg-surface-2 border border-surface-3 text-text-primary hover:border-mint hover:text-mint",
  ghost:    "bg-transparent text-text-secondary hover:text-mint hover:bg-surface",
  danger:   "bg-red text-white font-semibold hover:opacity-90 active:scale-95 shadow-red",
  outline:  "bg-transparent border border-mint text-mint hover:bg-mint hover:text-obsidian",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded gap-1.5",
  md: "px-4 py-2   text-sm rounded-md gap-2",
  lg: "px-6 py-3   text-sm rounded-lg gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size    = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-mint/30
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
