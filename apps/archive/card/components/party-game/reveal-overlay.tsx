"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { PARTY_GAME_REVEAL_DELAY_SECONDS } from "@/lib/constants";
import type { PlayerResponse } from "@/lib/party-engine";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface RevealBreakdown {
  value: string;
  players: Array<{ playerId: string; playerName: string }>;
  count: number;
}

export interface RevealResult {
  /** Count of responses per value */
  counts: Record<string, number>;
  /** Per-value breakdown of which players chose which */
  breakdown: RevealBreakdown[];
  /** Total number of responses received */
  totalResponses: number;
}

export interface RevealOverlayProps {
  /** Whether the overlay should be shown */
  open: boolean;
  /** The reveal results to display after countdown */
  result: RevealResult | null;
  /** Current player's response (for highlighting in breakdown) */
  currentPlayerId?: string;
  /** Callback when the reveal animation completes */
  onComplete?: () => void;
  /** Callback to close/dismiss the overlay */
  onClose?: () => void;
  /** Additional class names */
  className?: string;
}

// ──────────────────────────────────────────────
// Countdown Step
// ──────────────────────────────────────────────

function CountdownStep({
  step,
  visible,
}: {
  step: number;
  visible: boolean;
}) {
  const emojis: Record<number, string> = {
    3: "🟢",
    2: "🟠",
    1: "🔴",
  };

  const labels: Record<number, string> = {
    3: "Ready...",
    2: "Steady...",
    1: "Reveal!",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 transition-all duration-300",
        visible ? "scale-100 opacity-100" : "scale-50 opacity-0"
      )}
    >
      <span className="text-7xl sm:text-8xl" aria-hidden="true">
        {emojis[step] ?? "✨"}
      </span>
      <p className="text-2xl font-bold sm:text-3xl">
        {step}
      </p>
      <p className="text-base text-muted-foreground sm:text-lg">
        {labels[step] ?? "..."}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Results Display
// ──────────────────────────────────────────────

interface ResultsDisplayProps {
  result: RevealResult;
  currentPlayerId?: string;
}

function ResultsDisplay({ result, currentPlayerId }: ResultsDisplayProps) {
  const total = result.totalResponses;

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <h2 className="text-center text-xl font-bold sm:text-2xl">
        Results
      </h2>

      {/* Per-value breakdown */}
      {result.breakdown.map((item) => {
        const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;

        return (
          <div key={item.value} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize sm:text-base">
                {item.value === "agree" && "👍 Agree"}
                {item.value === "disagree" && "👎 Disagree"}
                {item.value === "have" && "🔴 Have Done"}
                {item.value === "have-not" && "🟢 Haven't Done"}
                {item.value === "truth" && "💬 Truth"}
                {item.value === "dare" && "💪 Dare"}
                {![
                  "agree",
                  "disagree",
                  "have",
                  "have-not",
                  "truth",
                  "dare",
                ].includes(item.value) && `${item.value} (voted)`}
              </span>
              <span className="text-sm font-bold">
                {percentage}% ({item.count}/{total})
              </span>
            </div>

            {/* Visual bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Player names */}
            {item.players.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.players.map((player) => (
                  <span
                    key={player.playerId}
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      player.playerId === currentPlayerId
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {player.playerName}
                    {player.playerId === currentPlayerId && " (You)"}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {result.breakdown.length === 0 && (
        <p className="text-center text-muted-foreground">
          No responses this round.
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// RevealOverlay
// ──────────────────────────────────────────────

/**
 * RevealOverlay — Full-screen overlay that shows a 3-2-1 countdown
 * at PARTY_GAME_REVEAL_DELAY_SECONDS intervals, then displays results
 * with voter breakdown.
 *
 * The countdown uses PARTY_GAME_REVEAL_DELAY_SECONDS from constants
 * to determine the interval between each countdown step.
 *
 * Each step of the countdown lasts ~1 second, and the total countdown
 * duration is 3 seconds (for 3, 2, 1).
 *
 * After countdown, results fade in with per-value breakdown including
 * player names, counts, and percentages.
 */
export function RevealOverlay({
  open,
  result,
  currentPlayerId,
  onComplete,
  onClose,
  className,
}: RevealOverlayProps) {
  const [phase, setPhase] = useState<"hidden" | "countdown" | "results">("hidden");
  const [countdownStep, setCountdownStep] = useState(3);

  // Reset when overlay opens
  useEffect(() => {
    if (!open) {
      setPhase("hidden");
      setCountdownStep(3);
      return;
    }

    setPhase("countdown");
    setCountdownStep(3);
  }, [open]);

  // Countdown timer
  const tick = useCallback(() => {
    setCountdownStep((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        // Countdown finished, show results
        setPhase("results");
        onComplete?.();
        return 0;
      }
      return next;
    });
  }, [onComplete]);

  // Run countdown at PARTY_GAME_REVEAL_DELAY_SECONDS intervals
  useEffect(() => {
    if (phase !== "countdown" || countdownStep <= 0) return;

    const intervalMs = (PARTY_GAME_REVEAL_DELAY_SECONDS / 3) * 1000;
    const timer = setTimeout(tick, intervalMs);
    return () => clearTimeout(timer);
  }, [phase, countdownStep, tick]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 sm:p-8",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Reveal overlay"
    >
      {/* Close button */}
      {onClose && phase === "results" && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close reveal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Countdown phase */}
      {phase === "countdown" && countdownStep > 0 && (
        <CountdownStep step={countdownStep} visible={true} />
      )}

      {/* Results phase */}
      {phase === "results" && result && <ResultsDisplay result={result} currentPlayerId={currentPlayerId} />}

      {/* No results */}
      {phase === "results" && !result && (
        <p className="text-center text-lg text-white/70">
          No results to display.
        </p>
      )}
    </div>
  );
}
