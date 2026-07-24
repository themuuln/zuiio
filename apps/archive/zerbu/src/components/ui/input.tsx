"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type InputProps = {
  label?: string;
  error?: string;
  helperText?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text dark:text-dark-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-2.5 rounded-full bg-surface dark:bg-dark-surface",
            "border-2 border-secondary/30 dark:border-dark-surface",
            "text-text dark:text-dark-text placeholder:text-text-secondary/50",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
            "transition-all duration-200",
            error && "border-error focus:border-error focus:ring-error/20",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {helperText && !error && <p className="text-xs text-text-secondary">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
