"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type StreakDisplayProps = {
  currentStreak: number;
  longestStreak?: number;
  className?: string;
  compact?: boolean;
};

export function StreakDisplay({ currentStreak, longestStreak, className, compact }: StreakDisplayProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Flame
          size={18}
          className={currentStreak > 0 ? "text-accent-fire" : "text-text-secondary"}
          fill={currentStreak > 0 ? "#D4934F" : "none"}
        />
        <span className="font-semibold text-text dark:text-dark-text">{currentStreak}</span>
        <span className="text-xs text-text-secondary">өдөр</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <Flame
          size={24}
          className={currentStreak > 0 ? "text-accent-fire" : "text-text-secondary"}
          fill={currentStreak > 0 ? "#D4934F" : "none"}
        />
        <div>
          <p className="text-2xl font-bold text-text dark:text-dark-text">{currentStreak}</p>
          <p className="text-xs text-text-secondary">дараалан</p>
        </div>
      </div>
      {longestStreak && longestStreak > 0 && (
        <div className="border-l-2 border-secondary/20 pl-3">
          <p className="text-sm font-semibold text-text dark:text-dark-text">{longestStreak}</p>
          <p className="text-xs text-text-secondary">хамгийн урт</p>
        </div>
      )}
    </div>
  );
}
