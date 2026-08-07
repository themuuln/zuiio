"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoreFlipProps {
  /** The numeric value to display. */
  value: number;
  /** Minimum number of digits (zero-padded). Default 2. */
  digits?: number;
  /** Whether this is connected to a live game context. */
  connected?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// CSS keyframes injected once via <style>
// ---------------------------------------------------------------------------

const FLIP_STYLES = `
@keyframes score-flip-top {
  0%   { transform: perspective(300px) rotateX(0deg); }
  100% { transform: perspective(300px) rotateX(-90deg); }
}
@keyframes score-flip-bottom {
  0%   { transform: perspective(300px) rotateX(90deg); }
  100% { transform: perspective(300px) rotateX(0deg); }
}

.score-flip-digit {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1.4em;
  perspective: 300px;
}

/* Static — the digit that stays put when not animating */
.score-flip-static {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 0.15em;
  font-variant-numeric: tabular-nums;
}

/* Animated top half — flips away */
.score-flip-top {
  position: absolute;
  inset: 0;
  bottom: 50%;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-radius: 0.15em 0.15em 0 0;
  backface-visibility: hidden;
  transform-origin: bottom center;
  animation: score-flip-top 0.3s ease-in forwards;
}

/* Animated bottom half — flips in */
.score-flip-bottom {
  position: absolute;
  inset: 0;
  top: 50%;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  border-radius: 0 0 0.15em 0.15em;
  backface-visibility: hidden;
  transform-origin: top center;
  animation: score-flip-bottom 0.3s 0.15s ease-out forwards;
}

/* High-contrast digit text inside animated halves */
.score-flip-top span,
.score-flip-bottom span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200%;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .score-flip-top,
  .score-flip-bottom {
    animation: none !important;
  }
}
`;

// ---------------------------------------------------------------------------
// Single animated digit
// ---------------------------------------------------------------------------

function FlipDigit({
  current,
  previous,
  animate,
}: {
  current: string;
  previous: string;
  animate: boolean;
}) {
  if (!animate) {
    return (
      <span className="score-flip-digit">
        <span className="score-flip-static bg-muted/50 text-foreground">
          {current}
        </span>
      </span>
    );
  }

  return (
    <span className="score-flip-digit">
      {/* Top half flips away showing previous */}
      <span className="score-flip-top bg-muted text-foreground">
        <span>{previous}</span>
      </span>
      {/* Bottom half flips in showing current */}
      <span className="score-flip-bottom bg-muted text-foreground">
        <span>{current}</span>
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Flip-clock style score display.
 *
 * Each digit animates independently when `value` changes,
 * producing a cascading mechanical counter effect.
 * Respects prefers-reduced-motion — falls back to instant swap.
 */
export function ScoreFlip({
  value,
  digits = 2,
  connected = false,
  className,
}: ScoreFlipProps) {
  const padded = String(Math.max(0, Math.floor(value))).padStart(digits, "0");
  const [displayChars, setDisplayChars] = useState<string[]>(() =>
    padded.split(""),
  );
  const [animatedIndices, setAnimatedIndices] = useState<Set<number>>(
    new Set(),
  );
  const prevRef = useRef(padded);
  const styleInjected = useRef(false);

  useEffect(() => {
    if (!connected) return;

    const prev = prevRef.current;
    if (prev === padded) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setDisplayChars(padded.split(""));
      setAnimatedIndices(new Set());
      prevRef.current = padded;
      return;
    }

    // Find which digits changed
    const changed = new Set<number>();
    for (let i = 0; i < padded.length; i++) {
      if (padded[i] !== prev[i]) changed.add(i);
    }

    // Set animated state with previous chars visible in flip
    setDisplayChars(prev.split(""));
    setAnimatedIndices(changed);

    // After animation, update to new values
    const timer = setTimeout(() => {
      setDisplayChars(padded.split(""));
      setAnimatedIndices(new Set());
      prevRef.current = padded;
    }, 450); // 300ms top + 150ms bottom

    return () => clearTimeout(timer);
  }, [padded, connected]);

  // -----------------------------------------------------------------------
  // Not connected to a live context — show blurred preview + Coming Soon.
  // Rendered after all hooks so hook call order stays constant across renders.
  // -----------------------------------------------------------------------

  if (!connected) {
    const chars = padded.split("");
    return (
      <div
        className={cn(
          "relative inline-flex overflow-hidden rounded-xl",
          className,
        )}
      >
        <div className="blur-[2px]">
          <span
            className="inline-flex gap-0.5 font-display tabular-nums opacity-40"
            aria-hidden="true"
          >
            {chars.map((char, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: digit columns are position-keyed
              <span key={i} className="score-flip-digit">
                <span className="score-flip-static bg-muted/50 text-foreground">
                  {char}
                </span>
              </span>
            ))}
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
          <div className="rounded-lg border bg-background px-4 py-2 text-center shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Тун удахгүй
            </p>
            <p className="text-xs text-muted-foreground/60">Coming Soon</p>
          </div>
        </div>
      </div>
    );
  }

  // Inject styles once
  if (!styleInjected.current && typeof document !== "undefined") {
    const existing = document.getElementById("score-flip-keyframes");
    if (!existing) {
      const style = document.createElement("style");
      style.id = "score-flip-keyframes";
      style.textContent = FLIP_STYLES;
      document.head.appendChild(style);
    }
    styleInjected.current = true;
  }

  return (
    <span
      className={cn("inline-flex gap-0.5 font-display tabular-nums", className)}
      aria-label={`Score: ${value}`}
      role="status"
    >
      {displayChars.map((char, i) => (
        <FlipDigit
          // biome-ignore lint/suspicious/noArrayIndexKey: digit columns are position-keyed for flip animation
          key={i}
          current={animatedIndices.has(i) ? (padded[i] ?? char) : char}
          previous={char}
          animate={animatedIndices.has(i)}
        />
      ))}
    </span>
  );
}
