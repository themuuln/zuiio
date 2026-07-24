"use client";

import { type Card as CardType, type CardColor } from "@/lib/game-engine/types";
import { cn } from "@/lib/utils";

interface CardProps {
  card: CardType;
  faceUp?: boolean;
  selected?: boolean;
  playable?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  shake?: boolean;
}

const COLOR_MAP: Record<CardColor, { bg: string; text: string; border: string }> = {
  red: {
    bg: "bg-red-500",
    text: "text-red-500",
    border: "border-red-500",
  },
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-500",
    border: "border-blue-500",
  },
  green: {
    bg: "bg-green-500",
    text: "text-green-500",
    border: "border-green-500",
  },
  yellow: {
    bg: "bg-yellow-400",
    text: "text-yellow-500",
    border: "border-yellow-400",
  },
};

const VALUE_DISPLAY: Record<string, string> = {
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  skip: "⊘",
  reverse: "⟳",
  draw2: "+2",
  wild: "★",
  wild4: "+4",
};

/**
 * Individual UNO card component.
 * Displays face-up with color and value, or face-down with a card back pattern.
 */
export function UnoCard({
  card,
  faceUp = true,
  selected = false,
  playable = true,
  onClick,
  disabled = false,
  className,
  shake = false,
}: CardProps) {
  const isWild = card.value === "wild" || card.value === "wild4";

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  if (!faceUp) {
    return (
      <button
        type="button"
        className={cn(
          "relative flex h-24 w-16 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-150",
          "bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700",
          "border-blue-400 shadow-md",
          "select-none",
          disabled ? "cursor-default" : "",
          className
        )}
        disabled={true}
        aria-label="Card back"
      >
        {/* Card back pattern */}
        <div className="flex h-16 w-11 items-center justify-center rounded border border-blue-300/30 bg-blue-500/50">
          <span className="text-lg font-bold text-white/80">F</span>
        </div>
        {/* Corner decorations */}
        <div className="absolute left-1 top-1 h-3 w-3 rounded-full border border-blue-300/30" />
        <div className="absolute bottom-1 right-1 h-3 w-3 rounded-full border border-blue-300/30" />
      </button>
    );
  }

  const colors = isWild ? null : COLOR_MAP[card.color as CardColor];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !playable}
      aria-label={`${card.color ?? "wild"} ${card.value}`}
      className={cn(
        "relative flex h-24 w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 shadow-md transition-all duration-150 select-none",
        // Color background
        isWild
          ? "bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 border-gray-300"
          : colors
          ? `${colors.bg} ${colors.border}`
          : "bg-gray-200 border-gray-300",
        // Interactive states
        !disabled && playable
          ? "cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95"
          : "cursor-default",
        // Selected state
        selected && "ring-2 ring-white ring-offset-1 scale-105",
        // Shake animation
        shake && "animate-[shake_0.3s_ease-in-out]",
        // Disabled/not playable
        (disabled || !playable) && "opacity-60",
        className
      )}
    >
      {/* Card value */}
      <span
        className={cn(
          "text-lg font-bold drop-shadow-sm",
          isWild ? "text-white" : "text-white"
        )}
      >
        {VALUE_DISPLAY[card.value] ?? card.value}
      </span>

      {/* Small color indicator for wild cards */}
      {isWild && (
        <div className="mt-0.5 flex gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
        </div>
      )}

      {/* Top-left small value */}
      <span
        className={cn(
          "absolute left-1 top-0.5 text-[9px] font-bold leading-none",
          isWild ? "text-white" : "text-white/80"
        )}
      >
        {VALUE_DISPLAY[card.value] ?? card.value}
      </span>

      {/* Bottom-right small rotated value */}
      <span
        className={cn(
          "absolute bottom-0.5 right-1 text-[9px] font-bold leading-none rotate-180",
          isWild ? "text-white" : "text-white/80"
        )}
      >
        {VALUE_DISPLAY[card.value] ?? card.value}
      </span>
    </button>
  );
}

/**
 * Small card for the discard pile display (slightly larger).
 */
export function DiscardPileCard({ card }: { card: CardType }) {
  const isWild = card.value === "wild" || card.value === "wild4";
  const colors = isWild ? null : COLOR_MAP[card.color as CardColor];

  return (
    <div
      className={cn(
        "flex h-32 w-22 flex-col items-center justify-center rounded-xl border-2 shadow-xl",
        isWild
          ? "bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 border-gray-300"
          : colors
          ? `${colors.bg} ${colors.border}`
          : "bg-gray-200 border-gray-300"
      )}
    >
      <span className="text-3xl font-bold text-white drop-shadow-md">
        {VALUE_DISPLAY[card.value] ?? card.value}
      </span>
      {isWild && (
        <div className="mt-1 flex gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
        </div>
      )}
    </div>
  );
}
