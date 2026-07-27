"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// CSS keyframes — injected once via <style>
// ---------------------------------------------------------------------------

const FLIP_STYLES = `
@keyframes flip-digit-top {
  0%   { transform: perspective(300px) rotateX(0deg); }
  100% { transform: perspective(300px) rotateX(-90deg); }
}
@keyframes flip-digit-bottom {
  0%   { transform: perspective(300px) rotateX(90deg); }
  100% { transform: perspective(300px) rotateX(0deg); }
}

.flip-digit-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  perspective: 300px;
}

.flip-digit-static {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flip-digit-top {
  position: absolute;
  inset: 0;
  bottom: 50%;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-radius: 0.1em 0.1em 0 0;
  backface-visibility: hidden;
  transform-origin: bottom center;
  animation: flip-digit-top 0.3s ease-in forwards;
}

.flip-digit-bottom {
  position: absolute;
  inset: 0;
  top: 50%;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  border-radius: 0 0 0.1em 0.1em;
  backface-visibility: hidden;
  transform-origin: top center;
  animation: flip-digit-bottom 0.3s 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.flip-digit-top span,
.flip-digit-bottom span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200%;
}

@media (prefers-reduced-motion: reduce) {
  .flip-digit-top,
  .flip-digit-bottom {
    animation: none !important;
  }
}
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlipDigitProps {
  /** The digit string to display */
  digit: string;
  /** The previous digit value (used as animation start state) */
  prevDigit?: string;
  className?: string;
}

interface FlipDigitInnerProps {
  current: string;
  previous: string;
  animate: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Inner — renders a single digit with optional flip halves
// ---------------------------------------------------------------------------

function FlipDigitInner({
  current,
  previous,
  animate,
  className,
}: FlipDigitInnerProps) {
  if (!animate) {
    return (
      <span className={cn("flip-digit-root", className)}>
        <span className="flip-digit-static">{current}</span>
      </span>
    );
  }

  return (
    <span className={cn("flip-digit-root", className)} aria-hidden="true">
      {/* Top half — shows previous digit, flips away */}
      <span className="flip-digit-top">
        <span>{previous}</span>
      </span>
      {/* Bottom half — shows current digit, flips in */}
      <span className="flip-digit-bottom">
        <span>{current}</span>
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Public component — manages animation state for one digit position
// ---------------------------------------------------------------------------

export function FlipDigit({ digit, prevDigit, className }: FlipDigitProps) {
  const [displayDigit, setDisplayDigit] = useState(digit);
  const [animating, setAnimating] = useState(false);
  const prevRef = useRef(prevDigit ?? digit);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const styleInjected = useRef(false);

  // Inject CSS keyframes once
  if (!styleInjected.current && typeof document !== "undefined") {
    const existing = document.getElementById("flip-digit-keyframes");
    if (!existing) {
      const style = document.createElement("style");
      style.id = "flip-digit-keyframes";
      style.textContent = FLIP_STYLES;
      document.head.appendChild(style);
    }
    styleInjected.current = true;
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (digit === prevRef.current) return;

    // Cancel any in-flight animation (animation lock)
    clearTimeout(timeoutRef.current);

    // Check reduced motion preference
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setDisplayDigit(digit);
      prevRef.current = digit;
      return;
    }

    // Start animation — top half flips away (old digit), bottom half flips in (new digit)
    setAnimating(true);

    timeoutRef.current = setTimeout(() => {
      setDisplayDigit(digit);
      setAnimating(false);
      prevRef.current = digit;
    }, 450); // 300ms top + 150ms delay = 450ms total

    return () => clearTimeout(timeoutRef.current);
  }, [digit]);

  return (
    <FlipDigitInner
      current={animating ? digit : displayDigit}
      previous={prevRef.current}
      animate={animating}
      className={className}
    />
  );
}
