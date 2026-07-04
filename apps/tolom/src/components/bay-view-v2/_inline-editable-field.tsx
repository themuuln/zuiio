"use client";

import { useCallback, useRef, useState } from "react";

interface InlineEditableFieldProps {
  /** Current display value */
  value: number;
  /** Called with parsed value on blur/Enter */
  onSave: (value: number) => void;
  /** Called on every keystroke with the current parsed numeric value (live preview) */
  onChange?: (value: number) => void;
  /** Format value for display (e.g. formatMNT) */
  formatDisplay?: (value: number) => string;
  /** Parse input string to number */
  parseInput?: (raw: string) => number;
  /** Input type — "number" for numeric, "text" for strings */
  type?: "number" | "text";
  /** Additional classes for the root element */
  className?: string;
}

/**
 * Inline-editable field that avoids any DOM swap or layout shift.
 *
 * Always renders a single `<input>` element. In display mode it looks like
 * plain text (no border, no focus ring, transparent background, cursor
 * pointer). On focus it switches to editable mode. Since it's the same
 * DOM node the whole time, font, padding, and alignment never change.
 */
export function InlineEditableField({
  value,
  onSave,
  onChange,
  formatDisplay,
  parseInput,
  type = "number",
  className = "",
}: InlineEditableFieldProps) {
  const isNumber = type === "number";
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const commitRef = useRef(value);

  const displayText = formatDisplay ? formatDisplay(value) : String(value);

  // Live-format the edit text for display in the input while typing
  const inputValue =
    editing && parseInput && formatDisplay && isNumber
      ? (() => {
          const num = parseInput(editText);
          return Number.isNaN(num) ? editText : formatDisplay(num);
        })()
      : editing
        ? editText
        : displayText;

  const handleFocus = useCallback(() => {
    setEditText(String(value));
    setEditing(true);
  }, [value]);

  const handleSave = useCallback(() => {
    setEditing(false);
    const parsed = parseInput ? parseInput(editText) : Number(editText);
    if (!Number.isNaN(parsed) && parsed !== commitRef.current) {
      commitRef.current = parsed;
      onSave(parsed);
    }
  }, [editText, parseInput, onSave]);

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
      if (parseInput && formatDisplay && isNumber) {
        // Strip formatting and keep raw number string
        const num = parseInput(raw);
        setEditText(Number.isNaN(num) ? raw : num.toString());
        if (!Number.isNaN(num)) onChange?.(num);
      } else {
        setEditText(raw);
        const num = Number(raw);
        if (!Number.isNaN(num)) onChange?.(num);
      }
    },
    [parseInput, formatDisplay, isNumber, onChange],
  );

  return (
    <input
      type="text"
      inputMode={isNumber ? "numeric" : "text"}
      value={inputValue}
      onFocus={handleFocus}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      className={[
        // Shared sizing / font — identical in both modes
        "inline-flex items-center min-w-0 px-0.5",
        "text-xs font-semibold tabular-nums font-sans leading-none h-auto",
        "bg-transparent border-0",
        isNumber
          ? "[-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          : "",
        // Display mode: looks like plain text
        !editing
          ? "cursor-pointer rounded hover:underline hover:decoration-dashed hover:underline-offset-2"
          : "",
        // Editing mode: keep native cursor, no focus ring
        editing ? "outline-none ring-0" : "",
        className,
      ].join(" ")}
      style={{ width: `${Math.max(String(inputValue).length + 2, 4)}ch` }}
      aria-label={displayText}
    />
  );
}
