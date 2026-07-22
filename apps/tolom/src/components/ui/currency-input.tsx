"use client";

import { clamp, formatCurrency, parseCurrencyInput } from "@zuiio/core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<
    React.ComponentProps<"input">,
    | "value"
    | "onChange"
    | "onBlur"
    | "type"
    | "size"
    | "min"
    | "max"
    | "className"
    | "disabled"
    | "readOnly"
    | "placeholder"
  > {
  /** Current value in MNT. Pass undefined to show placeholder (empty state). */
  value: number | undefined;
  /** Called with parsed number on blur / after save interaction */
  onChange?: (value: number) => void;
  /** Called on blur (e.g. for validation) */
  onBlur?: () => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Disable editing */
  disabled?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** Additional classes for the input */
  className?: string;
  /** Input size variant */
  size?: "sm" | "md" | "lg";
  /** Text alignment */
  align?: "left" | "right";
  /** Show ₮ prefix (default: true) */
  showPrefix?: boolean;
  /** Select all text on focus for quick replacement (default: true) */
  autoSelect?: boolean;
  /** Accessible label */
  "aria-label"?: string;
}

const sizeStyles: Record<string, string> = {
  sm: "h-8 text-xs",
  md: "h-10 text-sm",
  lg: "h-11 text-base",
};

const alignStyles: Record<string, string> = {
  left: "text-left",
  right: "text-right tabular-nums",
};

/**
 * Controlled currency input for MNT amounts.
 *
 * Fixes the "can't edit price" bug caused by React's `<input type="number">`
 * by using `type="text" inputMode="numeric"` and maintaining internal string
 * state while the user is typing. The parsed number is only committed on blur.
 *
 * - Shows ₮ prefix via InputGroupAddon
 * - Auto-selects value on focus for quick replacement
 * - Formats with comma separators when idle, shows raw text while editing
 * - Handles zero correctly (no `0 || ""` erasure)
 */
export function CurrencyInput({
  value,
  onChange,
  onBlur,
  placeholder = "₮ 0",
  min = 0,
  max = Infinity,
  disabled = false,
  readOnly = false,
  className,
  size = "md",
  align = "right",
  showPrefix = true,
  autoSelect = true,
  "aria-label": ariaLabel = "Currency",
  onFocus: externalOnFocus,
  onKeyDown: externalOnKeyDown,
  ...rest
}: CurrencyInputProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const committedRef = useRef(value);
  const isCommittingRef = useRef(false);

  // Sync when external value changes (but not during our own commit)
  useEffect(() => {
    if (!isCommittingRef.current && value !== committedRef.current) {
      committedRef.current = value;
    }
  }, [value]);

  const displayText = editing
    ? editText
    : value != null
      ? formatCurrency(value)
      : "";

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (readOnly || disabled) return;
      setEditing(true);
      // Show raw number without formatting for editing
      setEditText(value != null ? String(value) : "");
      // Select all on focus for quick replacement
      if (autoSelect) {
        e.target.select();
      }
    },
    [value, readOnly, disabled, autoSelect],
  );

  const commitValue = useCallback(
    (raw: string) => {
      setEditing(false);
      const parsed = clamp(parseCurrencyInput(raw), min, max);
      if (parsed !== committedRef.current) {
        isCommittingRef.current = true;
        committedRef.current = parsed;
        onChange?.(parsed);
        // Reset the flag after React processes the update
        setTimeout(() => {
          isCommittingRef.current = false;
        }, 0);
      }
    },
    [onChange, min, max],
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
  }, []);

  const input = (
    <InputGroupInput
      {...rest}
      type="text"
      inputMode="numeric"
      value={displayText}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      onFocus={(e) => {
        externalOnFocus?.(e);
        handleFocus(e);
      }}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        externalOnKeyDown?.(e);
        handleKeyDown(e);
      }}
      onChange={handleChange}
      className={cn(
        sizeStyles[size],
        alignStyles[align],
        // Remove spin buttons
        "[-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        className,
      )}
      aria-label={ariaLabel}
    />
  );

  if (showPrefix) {
    return (
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <span className="text-xs text-muted-foreground/70">₮</span>
        </InputGroupAddon>
        {input}
      </InputGroup>
    );
  }

  return input;
}
