"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 text-sm rounded-md
            bg-surface-2 border text-text-primary
            placeholder:text-text-dim
            transition-all duration-150 outline-none
            ${error
              ? "border-red focus:border-red focus:ring-2 focus:ring-red/20"
              : "border-surface-3 hover:border-silver/30 focus:border-mint focus:ring-2 focus:ring-mint/20"
            }
            disabled:opacity-40 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red">{error}</p>}
        {hint && !error && <p className="text-xs text-text-dim">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
