"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { GameContentEntry, ContentTier } from "@/lib/content";

export interface QuestionDisplayProps {
  /** The card content to display */
  card: GameContentEntry | null;
  /** Whether to show the suspense entry animation */
  suspense?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Category display configuration with emoji and color.
 */
const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  secrets: { emoji: "🤫", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  relationships: { emoji: "💕", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  embarrassing: { emoji: "😳", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  funny: { emoji: "😂", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  sexual: { emoji: "🔥", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  explicit: { emoji: "🔞", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  dares: { emoji: "💪", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  wild: { emoji: "🟠", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  travel: { emoji: "✈️", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
  food: { emoji: "🍕", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  work: { emoji: "💼", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
  friends: { emoji: "👯", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  college: { emoji: "🎓", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  deep: { emoji: "🧠", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" },
  party: { emoji: "🎉", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
  drinking: { emoji: "🍻", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  "hot-takes": { emoji: "🔥", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  "after-dark": { emoji: "🔞", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] ?? { emoji: "🏷️", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" };
}

/**
 * QuestionDisplay — Large card showing the current question/card
 * with category badge, suspense entry animation, and After Dark warning badge.
 *
 * Responsive for mobile (375px viewport) with no horizontal scroll.
 * Touch targets are 48x48px+ where interactive.
 */
export function QuestionDisplay({
  card,
  suspense = true,
  className,
}: QuestionDisplayProps) {
  const [visible, setVisible] = useState(!suspense);

  useEffect(() => {
    if (!suspense) {
      setVisible(true);
      return;
    }

    // Reset and animate on card change
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [card?.id, suspense]);

  if (!card) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center rounded-xl border-2 border-dashed p-6",
          className
        )}
      >
        <p className="text-center text-muted-foreground">Waiting for card...</p>
      </div>
    );
  }

  const categoryConfig = getCategoryConfig(card.category);
  const isAfterDark = card.tier === "after-dark";

  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto",
        className
      )}
    >
      {/* Category badge row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className={cn("text-xs font-medium", categoryConfig.color)}
        >
          <span className="mr-1" aria-hidden="true">
            {categoryConfig.emoji}
          </span>
          {card.category.charAt(0).toUpperCase() + card.category.slice(1)}
        </Badge>

        {/* After Dark / Explicit Content badge */}
        {isAfterDark && (
          <Badge
            variant="destructive"
            className="text-xs font-medium"
          >
            <span className="mr-1" aria-hidden="true">🔞</span>
            After Dark — Explicit Content
          </Badge>
        )}
      </div>

      {/* Card content */}
      <div
        className={cn(
          "rounded-xl border-2 bg-card p-6 shadow-lg transition-all duration-300 sm:p-8",
          isAfterDark && "border-red-500/50",
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
      >
        <p className="text-center text-lg leading-relaxed sm:text-xl">
          {card.text}
        </p>
      </div>
    </div>
  );
}
