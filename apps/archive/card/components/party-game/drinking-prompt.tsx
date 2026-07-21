"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { DrinkAction } from "@/lib/constants";
import type { DrinkRecord } from "@/lib/party-engine";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface DrinkingPromptProps {
  /** Whether the prompt is visible */
  open: boolean;
  /** The player who needs to drink */
  playerId: string;
  /** The player's display name */
  playerName: string;
  /** The type of drink action */
  action: DrinkAction;
  /** The drinking record if already recorded */
  currentRecord?: DrinkRecord | null;
  /** Whether the player has already responded */
  completed?: boolean;
  /** Whether drinking is disabled (dry mode) */
  drinkingDisabled?: boolean;
  /** Callback when the player completes the drink action */
  onComplete: () => void;
  /** Callback when the player passes/skips */
  onPass: () => void;
  /** Callback to close/dismiss */
  onClose?: () => void;
  /** Additional class names */
  className?: string;
}

// ──────────────────────────────────────────────
// Action-specific content
// ──────────────────────────────────────────────

function getActionContent(action: DrinkAction, playerName: string) {
  switch (action) {
    case "sip":
      return {
        emoji: "🍺",
        title: "Take a Sip",
        description: `${playerName}, take a sip!`,
        buttonLabel: "Done — took a sip",
      };
    case "shot":
      return {
        emoji: "🥃",
        title: "Take a Shot!",
        description: `${playerName}, take a shot!`,
        buttonLabel: "Done — took a shot",
      };
    case "assign":
      return {
        emoji: "🎯",
        title: "Assign a Drink",
        description: `${playerName}, pick someone to drink!`,
        buttonLabel: "Done — assigned",
      };
    case "waterfall":
      return {
        emoji: "🌊",
        title: "Waterfall!",
        description: `${playerName} started a waterfall! Everyone drinks until ${playerName === "You" ? "you" : "they"} stop.`,
        buttonLabel: "Done — stopped waterfall",
      };
    case "group-shot":
      return {
        emoji: "🍻",
        title: "Group Shot!",
        description: "Everyone take a shot!",
        buttonLabel: "Done — took the shot",
      };
    default:
      return {
        emoji: "🍺",
        title: "Drink!",
        description: `${playerName}, it's your turn to drink!`,
        buttonLabel: "Done",
      };
  }
}

// ──────────────────────────────────────────────
// DrinkingPrompt
// ──────────────────────────────────────────────

/**
 * DrinkingPrompt — Action-specific drinking prompt with honor-system tap.
 *
 * Always includes a pass/skip option with the exact text
 * "Skip / Always ok to pass — no pressure".
 *
 * In dry mode (drinkingDisabled), shows penalty point messaging instead.
 *
 * All buttons are at least 48x48px touch targets.
 * Responsive for 375px viewport.
 */
export function DrinkingPrompt({
  open,
  playerId,
  playerName,
  action,
  currentRecord,
  completed = false,
  drinkingDisabled = false,
  onComplete,
  onPass,
  onClose,
  className,
}: DrinkingPromptProps) {
  const [showPassConfirm, setShowPassConfirm] = useState(false);

  if (!open) return null;

  const content = getActionContent(action, playerName);

  if (completed) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Drinking prompt completed"
      >
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center shadow-lg">
          <span className="text-4xl" aria-hidden="true">✅</span>
          <p className="mt-3 text-lg font-semibold">
            {drinkingDisabled ? "Penalty recorded!" : "Drink recorded!"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {drinkingDisabled
              ? "Penalty point added (dry mode)"
              : "Honor system — we trust you!"}
          </p>
          {onClose && (
            <Button
              onClick={onClose}
              className="mt-4 min-h-[48px] min-w-[48px]"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Drinking prompt: ${action}`}
    >
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
        {/* Action emoji + title */}
        <div className="text-center">
          <span className="text-5xl" aria-hidden="true">
            {drinkingDisabled ? "📝" : content.emoji}
          </span>
          <h2 className="mt-3 text-xl font-bold">
            {drinkingDisabled ? "Penalty Point!" : content.title}
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            {drinkingDisabled
              ? `Instead of drinking, ${playerName} gets a penalty point.`
              : content.description}
          </p>
          {drinkingDisabled && (
            <p className="mt-1 text-xs text-muted-foreground">
              Playing in dry mode — no actual drinking
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-3">
          {/* Complete button */}
          {!showPassConfirm && (
            <Button
              onClick={onComplete}
              size="lg"
              className="min-h-[48px] min-w-[48px] text-base font-semibold"
            >
              {drinkingDisabled
                ? `Done — penalty recorded`
                : content.buttonLabel}
            </Button>
          )}

          {/* Pass / Skip button */}
          {!showPassConfirm ? (
            <Button
              variant="ghost"
              onClick={() => setShowPassConfirm(true)}
              className="min-h-[48px] min-w-[48px] text-sm text-muted-foreground"
            >
              Skip / Always ok to pass — no pressure
            </Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
              <p className="text-center text-sm text-muted-foreground">
                Are you sure you want to skip?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPassConfirm(false)}
                  className="flex-1 min-h-[48px] min-w-[48px]"
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={onPass}
                  className="flex-1 min-h-[48px] min-w-[48px]"
                >
                  Yes, skip
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
