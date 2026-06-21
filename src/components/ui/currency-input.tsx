"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value?: number;
  onChange?: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, onFocus, onBlur, ...props }, ref) => {
    const [displayText, setDisplayText] = useState("");
    const isFocusedRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const formatNumber = useCallback((num: number): string => {
      if (num === 0) return "0";
      const parts = String(num).split(".");
      const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
    }, []);

    const parseNumber = useCallback((str: string): number => {
      const cleaned = str.replace(/[^0-9.]/g, "");
      if (cleaned === "" || cleaned === ".") return 0;
      const dotIndex = cleaned.indexOf(".");
      const valid =
        dotIndex === -1
          ? cleaned
          : cleaned.slice(0, dotIndex + 1) +
            cleaned.slice(dotIndex + 1).replace(/\./g, "");
      return Number(valid);
    }, []);

    // Sync display with external value
    useEffect(() => {
      if (!isFocusedRef.current) {
        const num = value ?? 0;
        setDisplayText(formatNumber(num));
      }
    }, [value, formatNumber]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true;
      const num = value ?? 0;
      setDisplayText(num === 0 ? "" : String(num));
      onFocus?.(e);
      requestAnimationFrame(() => {
        inputRef.current?.select();
      });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;
      const num = value ?? 0;
      setDisplayText(formatNumber(num));
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[, ]/g, "");
      const cleaned = raw.replace(/[^0-9.]/g, "");

      // Prevent leading zeros: "01" -> "1", but allow "0" and "0.5"
      let final = cleaned;
      if (cleaned.length > 1 && cleaned[0] === "0" && cleaned[1] !== ".") {
        final = cleaned.replace(/^0+/, "");
      }

      // Prevent multiple decimal points
      const dotIndex = final.indexOf(".");
      if (dotIndex !== -1) {
        final =
          final.slice(0, dotIndex + 1) +
          final.slice(dotIndex + 1).replace(/\./g, "");
      }

      setDisplayText(final);
      const numValue = parseNumber(final);
      onChange?.(numValue);
    };

    const setRefs = useCallback(
      (el: HTMLInputElement | null) => {
        inputRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref],
    );

    return (
      <input
        ref={setRefs}
        type="text"
        inputMode="decimal"
        value={displayText}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-slot="input"
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className,
        )}
        {...props}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
