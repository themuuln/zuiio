"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { PARTY_GAME_TIMER_SECONDS } from "@/lib/constants";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface GameHeaderProps {
  /** Current round number (1-indexed) */
  roundNumber: number;
  /** Total number of rounds (optional, for display) */
  totalRounds?: number;
  /** Current timer value in seconds remaining, or null if timer inactive */
  timerSeconds: number | null;
  /** Total configured timer duration in seconds (defaults to PARTY_GAME_TIMER_SECONDS) */
  timerDuration?: number;
  /** The game type for display */
  gameType?: string;
  /** Whether the timer is paused */
  timerPaused?: boolean;
  /** Drink count per player, keyed by player ID */
  drinkCounts?: Record<string, number>;
  /** Current player's ID */
  currentPlayerId?: string;
  /** Player names, keyed by player ID */
  playerNames?: Record<string, string>;
  /** Available reaction emojis for quick-tap */
  reactionEmojis?: string[];
  /** Callback when a reaction emoji is tapped */
  onReact?: (emoji: string) => void;
  /** Additional class names */
  className?: string;
}

// ──────────────────────────────────────────────
// Timer Bar
// ──────────────────────────────────────────────

interface TimerBarProps {
  secondsRemaining: number | null;
  totalSeconds: number;
  paused?: boolean;
}

function TimerBar({ secondsRemaining, totalSeconds, paused }: TimerBarProps) {
  if (secondsRemaining === null) return null;

  const percentage = totalSeconds > 0
    ? Math.max(0, (secondsRemaining / totalSeconds) * 100)
    : 0;

  // Color changes based on remaining time
  const urgencyColor =
    percentage > 50
      ? "bg-green-500"
      : percentage > 25
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          {paused ? "⏸️ Paused" : "⏱️ Time"}
        </span>
        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            percentage <= 25 && "text-red-500 animate-pulse"
          )}
        >
          {Math.max(0, Math.ceil(secondsRemaining))}s
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          "h-2 transition-all duration-500",
          urgencyColor
        )}
        aria-label={`${Math.ceil(secondsRemaining)} seconds remaining`}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// Round Counter
// ──────────────────────────────────────────────

interface RoundCounterProps {
  roundNumber: number;
  totalRounds?: number;
}

function RoundCounter({ roundNumber, totalRounds }: RoundCounterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">
        Round {roundNumber}
        {totalRounds ? ` / ${totalRounds}` : ""}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Drink Counter
// ──────────────────────────────────────────────

interface DrinkCounterProps {
  drinkCounts?: Record<string, number>;
  currentPlayerId?: string;
  playerNames?: Record<string, string>;
}

function DrinkCounter({
  drinkCounts,
  currentPlayerId,
  playerNames,
}: DrinkCounterProps) {
  if (!drinkCounts || Object.keys(drinkCounts).length === 0) return null;

  const currentPlayerCount = currentPlayerId
    ? drinkCounts[currentPlayerId] ?? 0
    : 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm" aria-hidden="true">🍺</span>
      <span className="text-sm font-medium tabular-nums">
        {currentPlayerCount}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Reaction Emojis
// ──────────────────────────────────────────────

interface ReactionEmojisProps {
  emojis: string[];
  onReact?: (emoji: string) => void;
}

function ReactionEmojis({ emojis, onReact }: ReactionEmojisProps) {
  if (!onReact) return null;

  return (
    <div className="flex items-center gap-1.5">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg hover:bg-secondary/80 active:scale-90 transition-transform focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// GameHeader — Main component
// ──────────────────────────────────────────────

const DEFAULT_REACTION_EMOJIS = ["🔥", "😂", "😱", "👏", "😏", "🙈"];

/**
 * GameHeader — Top bar showing timer bar, round counter,
 * reaction emojis, and drink counter.
 *
 * Timer bar visually shows remaining time proportionally using
 * the Progress component.
 *
 * All touch targets are 48x48px+.
 * Responsive for 375px viewport.
 */
export function GameHeader({
  roundNumber,
  totalRounds,
  timerSeconds,
  timerDuration = PARTY_GAME_TIMER_SECONDS,
  gameType,
  timerPaused = false,
  drinkCounts,
  currentPlayerId,
  playerNames,
  reactionEmojis = DEFAULT_REACTION_EMOJIS,
  onReact,
  className,
}: GameHeaderProps) {
  return (
    <header
      className={cn(
        "flex w-full flex-col gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3",
        className
      )}
    >
      {/* Top row: round counter, drink counter, reactions */}
      <div className="flex items-center justify-between">
        <RoundCounter roundNumber={roundNumber} totalRounds={totalRounds} />

        <div className="flex items-center gap-3">
          <DrinkCounter
            drinkCounts={drinkCounts}
            currentPlayerId={currentPlayerId}
            playerNames={playerNames}
          />
          <ReactionEmojis emojis={reactionEmojis} onReact={onReact} />
        </div>
      </div>

      {/* Timer bar */}
      <TimerBar
        secondsRemaining={timerSeconds}
        totalSeconds={timerDuration}
        paused={timerPaused}
      />
    </header>
  );
}
