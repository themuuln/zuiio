"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface InlineEditableFieldProps {
  /** Current display value */
  value: number;
  /** Called with parsed value on blur/Enter */
  onSave: (value: number) => void;
  /** Format value for display (e.g. formatMNT) */
  formatDisplay?: (value: number) => string;
  /** Parse input string to number */
  parseInput?: (raw: string) => number;
  /** Input type — "number" for numeric, "text" for strings */
  type?: "number" | "text";
  /** Additional classes for the display button */
  className?: string;
  /** Additional classes for the editing input */
  inputClassName?: string;
}

/**
 * Reusable inline-editable field.
 *
 * Displays as a ghost button that switches to an input on click.
 * Saves on blur/Enter, cancels on Escape.
 */
export function InlineEditableField({
  value,
  onSave,
  formatDisplay,
  parseInput,
  type = "number",
  className = "",
  inputClassName = "",
}: InlineEditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStart = useCallback(() => {
    const raw = formatDisplay ? formatDisplay(value) : String(value);
    setEditValue(raw);
    setEditing(true);
  }, [value, formatDisplay]);

  const handleSave = useCallback(() => {
    setEditing(false);
    const parsed = parseInput ? parseInput(editValue) : Number(editValue);
    if (!Number.isNaN(parsed)) {
      onSave(parsed);
    }
  }, [editValue, parseInput, onSave]);

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  if (editing) {
    const isNumber = type === "number";
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode={isNumber ? "numeric" : "text"}
        className={`inline-flex h-auto w-auto min-w-0 px-0.5 text-xs font-semibold tabular-nums rounded-sm border border-transparent bg-transparent outline-none ring-0 focus:border-primary/60 focus:ring-0 ${
          isNumber
            ? "[-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            : ""
        } ${inputClassName}`}
        style={{ width: Math.max(String(editValue).length, 2) + "ch" }}
        value={editValue}
        onChange={(e) =>
          setEditValue(
            isNumber ? e.target.value.replace(/^0+(?=\d)/, "") : e.target.value,
          )
        }
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
        autoFocus
        onFocus={(e) => e.target.select()}
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleStart}
      className={`font-semibold tabular-nums h-auto px-0.5 rounded-sm hover:underline hover:decoration-dashed hover:underline-offset-2 ${className}`}
    >
      {formatDisplay ? formatDisplay(value) : String(value)}
    </Button>
  );
}
