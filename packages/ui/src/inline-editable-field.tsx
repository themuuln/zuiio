import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
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
  autoFocus = false,
}: InlineEditableFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isNumber = type === "number";
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const commitRef = useRef(value);
  const cursorRef = useRef<number | null>(null);
  // Synchronous ref for the latest edit text — avoids stale closure
  // when Enter -> blur fires before React commits setEditText.
  const editTextRef = useRef("");

  // Auto-focus on mount for newly added items
  useEffect(() => {
    if (autoFocus) {
      // Small delay to ensure the drawer animation has settled
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [autoFocus]);

  const displayText = formatDisplay ? formatDisplay(value) : String(value);

  const inputValue = editing ? editText : displayText;

  const handleFocus = useCallback(() => {
    const initial = formatDisplay ? formatDisplay(value) : String(value);
    editTextRef.current = initial;
    setEditText(initial);
    setEditing(true);
  }, [value, formatDisplay]);
  useEffect(() => {
    if (!editing) {
      commitRef.current = value;
    }
  }, [editing, value]);
  // Restore cursor after React re-renders the re-formatted input value.
  useLayoutEffect(() => {
    if (editing && cursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  }, [editing, editText]);

  const handleSave = useCallback(() => {
    setEditing(false);
    const raw =
      editTextRef.current !== "" ? editTextRef.current : (inputRef.current?.value ?? editText);
    // Empty -> revert, don't save 0 (lets user clear then Escape or blur without losing value)
    if (raw.trim() === "") {
      const revert = formatDisplay ? formatDisplay(commitRef.current) : String(commitRef.current);
      editTextRef.current = revert;
      setEditText(revert);
      return;
    }
    const parsed = parseInput ? parseInput(raw) : Number(raw);
    if (!Number.isNaN(parsed) && parsed !== commitRef.current) {
      commitRef.current = parsed;
      onSave(parsed);
      return;
    }
    // No change or invalid — keep commitRef as-is so the effect
    // doesn't overwrite it when the parent re-renders.
  }, [editText, parseInput, onSave, formatDisplay]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        // Revert to last committed value and exit without saving
        const revert = formatDisplay ? formatDisplay(commitRef.current) : String(commitRef.current);
        editTextRef.current = revert;
        setEditText(revert);
        setEditing(false);
        (e.target as HTMLInputElement).blur();
      }
    },
    [formatDisplay],
  );
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow empty while typing — don't jump to ₮ 0
      if (raw.trim() === "") {
        editTextRef.current = "";
        setEditText("");
        return;
      }
      const num = parseInput ? parseInput(raw) : Number(raw);
      const selStart = e.target.selectionStart ?? 0;

      if (formatDisplay && !Number.isNaN(num)) {
        // Reformat so commas/₮ stay visible during editing.
        const formatted = formatDisplay(num);

        // If cursor was at the end of the raw input, keep it at the end
        // after formatting (e.g. typing "400k" → "₮ 400,000" keeps cursor after "000").
        if (selStart >= raw.length) {
          cursorRef.current = formatted.length;
        } else {
          // Mid-string edit: map cursor by digit count — preserves position when commas shift.
          const rawBeforeCursor = raw.slice(0, selStart);
          const digitsBefore = (rawBeforeCursor.match(/\d/g) || []).length;
          let pos = 0;
          let count = 0;
          for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) {
              count++;
              if (count > digitsBefore) {
                pos = i;
                break;
              }
            }
            pos = i + 1;
          }
          if (count <= digitsBefore) pos = formatted.length;
          cursorRef.current = pos;
        }
        editTextRef.current = formatted;
        setEditText(formatted);
      } else {
        editTextRef.current = raw;
        setEditText(raw);
      }

      if (!Number.isNaN(num)) onChange?.(num);
    },
    [formatDisplay, parseInput, onChange],
  );

  // Width: content-sized but capped to avoid row jump. Parent w-* (e.g. w-20) caps it.
  const widthCh = Math.max(String(inputValue).length + 1, 4);
  const hasFixedWidth = /\bw-\d/.test(className);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={isNumber ? "numeric" : "text"}
      value={inputValue}
      onFocus={handleFocus}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      className={[
        // Base
        "inline-flex items-center min-w-0 px-1 py-0.5 rounded-md",
        "text-xs font-semibold tabular-nums font-sans leading-none",
        "bg-transparent border border-transparent",
        "transition-colors duration-150",
        isNumber
          ? "[-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          : "",
        // Display: subtle affordance
        !editing
          ? "cursor-pointer hover:bg-muted/60 hover:border-border/60"
          : "",
        // Editing: clear focus ring
        editing
          ? "bg-background border-input shadow-sm outline-none ring-1 ring-ring/20 focus:ring-2 focus:ring-ring/30 focus:border-ring"
          : "outline-none",
        className,
      ].join(" ")}
      style={
        hasFixedWidth
          ? undefined
          : { width: `${Math.min(widthCh, 14)}ch`, maxWidth: "14ch" }
      }
      aria-label={displayText}
      aria-valuenow={isNumber ? value : undefined}
      title={displayText}
    />
  );
}
