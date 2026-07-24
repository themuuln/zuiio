"use client";

import { useState } from "react";
import { Settings, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface HouseRules {
  drawStacking: boolean;
  drawUntilYouPlay: boolean;
}

interface HouseRulesProps {
  initialRules?: Partial<HouseRules>;
  onRulesChange: (rules: HouseRules) => void;
}

/**
 * House rules configuration panel.
 * Allows the host to toggle optional game rules before starting a game.
 *
 * Rules:
 * - Draw Stacking: Chain Draw 2 and Wild Draw 4 cards (accumulates draws)
 * - Draw Until You Play: Keep drawing until you get a playable card
 */
export function HouseRules({
  initialRules,
  onRulesChange,
}: HouseRulesProps) {
  const [expanded, setExpanded] = useState(false);

  const [rules, setRules] = useState<HouseRules>({
    drawStacking: initialRules?.drawStacking ?? false,
    drawUntilYouPlay: initialRules?.drawUntilYouPlay ?? false,
  });

  const handleToggle = (key: keyof HouseRules) => {
    const updated = { ...rules, [key]: !rules[key] };
    setRules(updated);
    onRulesChange(updated);
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>House Rules</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {expanded ? "Hide" : "Configure"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="space-y-3">
            {/* Draw Stacking */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 flex h-5 w-9 shrink-0">
                <input
                  type="checkbox"
                  checked={rules.drawStacking}
                  onChange={() => handleToggle("drawStacking")}
                  className="peer sr-only"
                />
                <div
                  className={cn(
                    "h-5 w-9 rounded-full transition-colors",
                    rules.drawStacking
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  )}
                />
                <div
                  className={cn(
                    "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4"
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Draw Stacking</span>
                <span className="text-xs text-muted-foreground">
                  Chain Draw 2 and Wild Draw 4 cards, accumulating draws to the
                  next player
                </span>
              </div>
            </label>

            {/* Draw Until You Play */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 flex h-5 w-9 shrink-0">
                <input
                  type="checkbox"
                  checked={rules.drawUntilYouPlay}
                  onChange={() => handleToggle("drawUntilYouPlay")}
                  className="peer sr-only"
                />
                <div
                  className={cn(
                    "h-5 w-9 rounded-full transition-colors",
                    rules.drawUntilYouPlay
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  )}
                />
                <div
                  className={cn(
                    "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4"
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  Draw Until You Play
                </span>
                <span className="text-xs text-muted-foreground">
                  Keep drawing cards until you draw one that can be played
                </span>
              </div>
            </label>

            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                House rules apply to all players for the entire game session.
                They can be changed between rounds via the scoreboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
