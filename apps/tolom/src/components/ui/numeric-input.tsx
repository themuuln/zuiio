"use client";

import { clamp } from "@zuiio/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface NumericInputProps
  extends Omit<
    React.ComponentProps<"input">,
    | "value"
    | "onChange"
    | "onBlur"
    | "type"
    | "size"
    | "min"
    | "max"
    | "step"
    | "className"
    | "disabled"
    | "readOnly"
    | "placeholder"
  > {
  /** Current numeric value */
  value: number;
  /** Called with parsed number on blur / Enter */
  onChange?: (value: number) => void;
  /** Called on blur */
  onBlur?: () => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Minimum allowed value (default: 0) */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step size (1 = integer, 0.01 = decimal, etc.) */
  step?: number;
  /** Disable editing */
  disabled?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** Additional classes */
  className?: string;
  /** Input size variant */
  size?: "sm" | "md" | "lg";
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Select all text on focus (default: false for qty, true for single-field) */
  autoSelect?: boolean;
  /** Accessible label */
  "aria-label"?: string;
  /** Minimum width in characters */
  minWidth?: number;
}

const sizeStyles: Record<string, string> = {
  sm: "h-8 text-xs",
  md: "h-10 text-sm",
  lg: "h-11 text-base",
};

const alignStyles: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right tabular-nums",
};

/**
 * Controlled numeric input that avoids the React `<input type="number">` pitfalls.
 *
 * Uses `type="text" inputMode="numeric"` and maintains internal string state
 * while editing. The validated number is only committed on blur or Enter.
 *
 * - Handles zero correctly (no `0 || ""` erasure)
 * - No native spin buttons
 * - Supports integer (step≥1) and decimal (step<1) modes
 * - Clamps to [min, max] on commit
 * - Auto-selects on focus for quick replacement
 */
export function NumericInput({
  value,
  onChange,
  onBlur,
  placeholder,
  min = 0,
  max = Infinity,
  step = 1,
  disabled = false,
  readOnly = false,
  className,
  size = "md",
  align = "left",
  autoSelect = false,
  "aria-label": ariaLabel = "Numeric",
  minWidth,
  onFocus: externalOnFocus,
  onKeyDown: externalOnKeyDown,
  ...rest
}: NumericInputProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(value);
  const isCommittingRef = useRef(false);
  const isInteger = step >= 1;

  // Sync when external value changes (but not during our own commit)
  useEffect(() => {
    if (!isCommittingRef.current && value !== committedRef.current) {
      committedRef.current = value;
    }
  }, [value]);

  const displayText = editing ? editText : String(value);

  const handleFocus = useCallback(() => {
    if (readOnly || disabled) return;
    setEditing(true);
    setEditText(String(value));
    if (autoSelect) {
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [value, readOnly, disabled, autoSelect]);

  const commitValue = useCallback(
    (raw: string) => {
      setEditing(false);
      if (raw === "") {
        if (committedRef.current !== 0) {
          isCommittingRef.current = true;
          committedRef.current = 0;
          onChange?.(0);
          setTimeout(() => {
            isCommittingRef.current = false;
          }, 0);
        }
        return;
      }
      const parsed = isInteger ? Math.round(Number(raw)) : Number(raw);
      if (Number.isNaN(parsed)) return;
      const clamped = clamp(parsed, min, max);
      if (clamped !== committedRef.current) {
        isCommittingRef.current = true;
        committedRef.current = clamped;
        onChange?.(clamped);
        setTimeout(() => {
          isCommittingRef.current = false;
        }, 0);
      }
    },
    [onChange, min, max, isInteger],
  );

  const handleBlur = useCallback(() => {
    commitValue(editText);
    onBlur?.();
  }, [editText, commitValue, onBlur]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        setEditing(false);
      }
    },
    [],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Only allow digits, decimal point, and minus sign
      if (isInteger) {
        if (/^-?\d*$/.test(raw)) setEditText(raw);
      } else {
        if (/^-?\d*\.?\d*$/.test(raw)) setEditText(raw);
      }
    },
    [isInteger],
  );

  return (
    <input
      {...rest}
      ref={inputRef}
      type="text"
      inputMode={isInteger ? "numeric" : "decimal"}
      value={displayText}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      onFocus={(e) => {
        externalOnFocus?.(e);
        handleFocus();
      }}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        externalOnKeyDown?.(e);
        handleKeyDown(e);
      }}
      onChange={handleChange}
      data-slot="input"
      className={cn(
        // Base — matches shadcn Input styling
        "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        // Remove spin buttons
        "[-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        sizeStyles[size],
        alignStyles[align],
        minWidth ? `min-w-[${minWidth}ch]` : "",
        className,
      )}
      aria-label={ariaLabel}
    />
  );
}
