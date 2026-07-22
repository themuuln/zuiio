"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FlipDigitProps {
  value: number;
  className?: string;
}

export function FlipDigit({ value, className }: FlipDigitProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setFlipping(true);
      // After flip animation midpoint, update the displayed digit
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setFlipping(false);
      }, 300);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span
      className={cn("relative inline-block overflow-hidden", className)}
      aria-hidden="true"
    >
      <span
        className={cn(
          "block transition-transform duration-300",
          flipping && "-translate-y-full rotate-x-180",
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {displayValue}
      </span>
    </span>
  );
}
