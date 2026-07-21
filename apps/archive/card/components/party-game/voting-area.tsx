"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ContentTier } from "@/lib/content";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type PartyGameType =
  | "truth-or-dare"
  | "never-have-i-ever"
  | "hot-takes"
  | "most-likely-to";

export type TruthDareChoice = "truth" | "dare" | null;
export type NHIEChoice = "have" | "have-not" | null;
export type AgreeDisagreeChoice = "agree" | "disagree" | null;

export interface PlayerInfo {
  id: string;
  name: string;
  emoji?: string;
}

export interface VotingAreaProps {
  /** The game type determining which buttons to render */
  gameType: PartyGameType;
  /** Whether the current player can vote (not spectator, proper phase) */
  canVote: boolean;
  /** Whether voting is disabled (timer expired, already voted) */
  disabled?: boolean;
  /** The current player's selection, if they've already voted */
  currentSelection?: string | null;
  /** Player list for Most Likely To player picker */
  players?: PlayerInfo[];
  /** Whether to allow self-voting in Most Likely To */
  allowSelfVote?: boolean;
  /** Whether the game is in "after-dark" tier */
  isAfterDark?: boolean;
  /** Callback when a selection is made */
  onSelect: (value: string) => void;
  /** Additional class names */
  className?: string;
}

// ──────────────────────────────────────────────
// Game-specific sub-components
// ──────────────────────────────────────────────

interface TruthDarePickerProps {
  canVote: boolean;
  disabled?: boolean;
  currentSelection?: string | null;
  onSelect: (value: string) => void;
}

function TruthDarePicker({
  canVote,
  disabled,
  currentSelection,
  onSelect,
}: TruthDarePickerProps) {
  const isDisabled = disabled || !canVote;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      <Button
        variant={currentSelection === "truth" ? "default" : "outline"}
        size="lg"
        disabled={isDisabled}
        onClick={() => onSelect("truth")}
        className={cn(
          "flex-1 min-h-[48px] min-w-[48px] text-base font-semibold",
          !isDisabled && "active:scale-95 transition-transform"
        )}
        aria-label="Pick Truth"
      >
        <span className="mr-2" aria-hidden="true">💬</span>
        Truth
      </Button>
      <Button
        variant={currentSelection === "dare" ? "default" : "outline"}
        size="lg"
        disabled={isDisabled}
        onClick={() => onSelect("dare")}
        className={cn(
          "flex-1 min-h-[48px] min-w-[48px] text-base font-semibold",
          !isDisabled && "active:scale-95 transition-transform"
        )}
        aria-label="Pick Dare"
      >
        <span className="mr-2" aria-hidden="true">💪</span>
        Dare
      </Button>
    </div>
  );
}

interface NHIEButtonsProps {
  canVote: boolean;
  disabled?: boolean;
  currentSelection?: string | null;
  onSelect: (value: string) => void;
}

function NHIEButtons({
  canVote,
  disabled,
  currentSelection,
  onSelect,
}: NHIEButtonsProps) {
  const isDisabled = disabled || !canVote;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      <Button
        variant={currentSelection === "have" ? "default" : "outline"}
        size="lg"
        disabled={isDisabled}
        onClick={() => onSelect("have")}
        className={cn(
          "flex-1 min-h-[48px] min-w-[48px] text-base font-semibold",
          currentSelection === "have" && "bg-red-600 hover:bg-red-700 text-white",
          !isDisabled && "active:scale-95 transition-transform"
        )}
        aria-label="I have done this"
      >
        <span className="mr-2" aria-hidden="true">🔴</span>
        I HAVE
      </Button>
      <Button
        variant={currentSelection === "have-not" ? "default" : "outline"}
        size="lg"
        disabled={isDisabled}
        onClick={() => onSelect("have-not")}
        className={cn(
          "flex-1 min-h-[48px] min-w-[48px] text-base font-semibold",
          currentSelection === "have-not" && "bg-green-600 hover:bg-green-700 text-white",
          !isDisabled && "active:scale-95 transition-transform"
        )}
        aria-label="I have not done this"
      >
        <span className="mr-2" aria-hidden="true">🟢</span>
        I HAVEN&apos;T
      </Button>
    </div>
  );
}

interface AgreeDisagreeButtonsProps {
  canVote: boolean;
  disabled?: boolean;
  currentSelection?: string | null;
  onSelect: (value: string) => void;
}

function AgreeDisagreeButtons({
  canVote,
  disabled,
  currentSelection,
  onSelect,
}: AgreeDisagreeButtonsProps) {
  const isDisabled = disabled || !canVote;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      <Button
        variant={currentSelection === "agree" ? "default" : "outline"}
        size="lg"
        disabled={isDisabled}
        onClick={() => onSelect("agree")}
        className={cn(
          "flex-1 min-h-[48px] min-w-[48px] text-base font-semibold",
          currentSelection === "agree" && "bg-green-600 hover:bg-green-700 text-white",
          !isDisabled && "active:scale-95 transition-transform"
        )}
        aria-label="Agree"
      >
        <span className="mr-2" aria-hidden="true">👍</span>
        Agree
      </Button>
      <Button
        variant={currentSelection === "disagree" ? "default" : "outline"}
        size="lg"
        disabled={isDisabled}
        onClick={() => onSelect("disagree")}
        className={cn(
          "flex-1 min-h-[48px] min-w-[48px] text-base font-semibold",
          currentSelection === "disagree" && "bg-red-600 hover:bg-red-700 text-white",
          !isDisabled && "active:scale-95 transition-transform"
        )}
        aria-label="Disagree"
      >
        <span className="mr-2" aria-hidden="true">👎</span>
        Disagree
      </Button>
    </div>
  );
}

interface PlayerPickerProps {
  canVote: boolean;
  disabled?: boolean;
  currentSelection?: string | null;
  players?: PlayerInfo[];
  allowSelfVote?: boolean;
  onSelect: (value: string) => void;
}

function PlayerPicker({
  canVote,
  disabled,
  currentSelection,
  players = [],
  allowSelfVote = false,
  onSelect,
}: PlayerPickerProps) {
  const isDisabled = disabled || !canVote;

  if (players.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No players available
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {players.map((player) => {
        const isSelected = currentSelection === player.id;
        return (
          <Button
            key={player.id}
            variant={isSelected ? "default" : "outline"}
            disabled={isDisabled}
            onClick={() => onSelect(player.id)}
            className={cn(
              "min-h-[48px] min-w-[48px] text-sm font-medium",
              isSelected && "ring-2 ring-primary ring-offset-2",
              !isDisabled && "active:scale-95 transition-transform"
            )}
            aria-label={`Vote for ${player.name}`}
          >
            <span className="flex flex-col items-center gap-1">
              {player.emoji && (
                <span className="text-xl" aria-hidden="true">{player.emoji}</span>
              )}
              <span className="truncate max-w-[80px]">{player.name}</span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// VotingArea — Main component
// ──────────────────────────────────────────────

/**
 * VotingArea — Renders game-specific response buttons based on game type.
 *
 * - truth-or-dare: Truth / Dare picker
 * - never-have-i-ever: I HAVE / I HAVEN'T
 * - hot-takes: Agree / Disagree
 * - most-likely-to: Player picker grid
 *
 * All buttons are at least 48x48px for touch targets.
 * Responsive for 375px viewport (stacks vertically on mobile, row on wider).
 */
export function VotingArea({
  gameType,
  canVote,
  disabled = false,
  currentSelection = null,
  players = [],
  allowSelfVote = false,
  isAfterDark = false,
  onSelect,
  className,
}: VotingAreaProps) {
  if (!canVote) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border-2 border-dashed p-6",
          className
        )}
      >
        <p className="text-center text-sm text-muted-foreground">
          <span className="mr-2" aria-hidden="true">⏳</span>
          Waiting for your turn...
        </p>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Game-specific buttons */}
      {gameType === "truth-or-dare" && (
        <TruthDarePicker
          canVote={canVote}
          disabled={disabled}
          currentSelection={currentSelection}
          onSelect={onSelect}
        />
      )}

      {gameType === "never-have-i-ever" && (
        <NHIEButtons
          canVote={canVote}
          disabled={disabled}
          currentSelection={currentSelection}
          onSelect={onSelect}
        />
      )}

      {gameType === "hot-takes" && (
        <AgreeDisagreeButtons
          canVote={canVote}
          disabled={disabled}
          currentSelection={currentSelection}
          onSelect={onSelect}
        />
      )}

      {gameType === "most-likely-to" && (
        <PlayerPicker
          canVote={canVote}
          disabled={disabled}
          currentSelection={currentSelection}
          players={players}
          allowSelfVote={allowSelfVote}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}
