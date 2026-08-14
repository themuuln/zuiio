"use client";

import { type ChangeEvent, type FocusEvent, forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatPlateInput } from "@/lib/form-ux";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import { cn } from "@/lib/utils";

/**
 * Buuz phonetic keyboard layout — Latin key → Cyrillic character.
 * Maps how Mongolians actually type Cyrillic on a standard QWERTY keyboard.
 * Source: https://github.com/odbayar/buuz
 */
const BUUZ_ROWS = [
  [
    ["Q", "Ө"],
    ["W", "Ү"],
    ["E", "Э"],
    ["R", "Р"],
    ["T", "Т"],
    ["Y", "Ы"],
    ["U", "У"],
    ["I", "И"],
    ["O", "О"],
    ["P", "П"],
  ],
  [
    ["A", "А"],
    ["S", "С"],
    ["D", "Д"],
    ["F", "Ф"],
    ["G", "Г"],
    ["H", "Х"],
    ["J", "Ж"],
    ["K", "К"],
    ["L", "Л"],
  ],
  [
    ["Z", "З"],
    ["X", "Х"],
    ["C", "Ц"],
    ["V", "В"],
    ["B", "Б"],
    ["N", "Н"],
    ["M", "М"],
  ],
];

/** Compact Buuz keyboard hint. Use inside a `relative` container. */
function BuuzHint({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 select-none pointer-events-none",
        className,
      )}
    >
      {BUUZ_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-0.5">
          {row.map(([lat, cyr]) => (
            <div
              key={lat}
              className="flex flex-col items-center leading-none rounded bg-muted/60 px-1 py-0.5 min-w-[1.5rem]"
            >
              <span className="text-[10px] font-medium text-muted-foreground/70">
                {lat}
              </span>
              <span className="text-xs font-semibold text-foreground/80">
                {cyr}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export interface PlateInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  /** Controlled value */
  value?: string;
  /** Called with the formatted (digits + transliterated Cyrillic) value */
  onChange?: (value: string) => void;
}

/**
 * Plate number input with Buuz phonetic layout hint.
 *
 * On focus, shows a compact QWERTY keyboard overlay mapping
 * each Latin key to its Cyrillic equivalent (Buuz layout).
 * Automatically transliterates Latin → Cyrillic and formats to `NNNNAAA`.
 *
 * The wrapper `<div class="relative">` lets you place sibling elements
 * (search icons, buttons) using absolute positioning — same as a plain Input.
 */
const PlateInput = forwardRef<HTMLInputElement, PlateInputProps>(
  function PlateInput(
    { value, onChange, onFocus, onBlur, className, ...props },
    ref,
  ) {
    const [focused, setFocused] = useState(false);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const formatted = formatPlateInput(
        transliterateMongolianPlate(e.target.value),
      );
      onChange?.(formatted);
    }

    function handleFocus(e: FocusEvent<HTMLInputElement>) {
      setFocused(true);
      onFocus?.(e);
    }

    function handleBlur(e: FocusEvent<HTMLInputElement>) {
      setFocused(false);
      onBlur?.(e);
    }

    return (
      <>
        <Input
          ref={ref}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn("font-mono uppercase", className)}
          {...props}
        />
        {focused && (
          <div className="absolute left-0 top-full z-50 mt-1.5 rounded-lg bg-popover p-2.5 shadow-md transition-opacity duration-150">
            <BuuzHint />
          </div>
        )}
      </>
    );
  },
);

export { BuuzHint, PlateInput };
