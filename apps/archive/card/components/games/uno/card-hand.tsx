"use client";

import { useRef, useEffect, useState } from "react";
import { type Card as CardType } from "@/lib/game-engine/types";
import { UnoCard } from "./card";
import { cn } from "@/lib/utils";

interface CardHandProps {
  cards: CardType[];
  faceUp?: boolean;
  isCurrentPlayer?: boolean;
  selectedCardIndex?: number | null;
  onCardClick?: (index: number) => void;
  shakeCardIndex?: number | null;
  playableCardIndices?: number[];
  disabled?: boolean;
  playerLabel?: string;
  cardCount?: number;
}

/**
 * Fanned card hand display.
 * Cards are arranged in a fan pattern at the bottom of the screen.
 */
export function CardHand({
  cards,
  faceUp = true,
  isCurrentPlayer = false,
  selectedCardIndex,
  onCardClick,
  shakeCardIndex,
  playableCardIndices = [],
  disabled = false,
  playerLabel,
  cardCount,
}: CardHandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  if (!faceUp) {
    // Show card backs for opponent
    const count = cardCount ?? cards.length;
    const maxVisible = Math.min(count, 10);
    const overlap = containerWidth > 300 ? 20 : 10;

    return (
      <div className="flex flex-col items-center gap-1">
        {playerLabel && (
          <span className="text-xs font-medium text-muted-foreground">
            {playerLabel} ({count})
          </span>
        )}
        <div
          ref={containerRef}
          className="relative flex items-end justify-center"
          style={{ height: 112 }}
        >
          {Array.from({ length: maxVisible }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0"
              style={{ left: `calc(50% + ${(i - (maxVisible - 1) / 2) * overlap}px)` }}
            >
              <UnoCard
                card={cards[0] ?? { id: `back-${i}`, color: "red", value: "0" }}
                faceUp={false}
                disabled
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-sm text-muted-foreground">No cards</p>
      </div>
    );
  }

  // Calculate overlap based on number of cards and container width
  const cardWidth = 64; // w-16
  const cardGap = Math.min(
    Math.max(
      (containerWidth - cardWidth - 40) / Math.max(cards.length - 1, 1),
      isCurrentPlayer ? -20 : -10
    ),
    isCurrentPlayer ? 4 : 8
  );

  const isPlayable = (index: number) =>
    isCurrentPlayer && playableCardIndices.includes(index);

  return (
    <div className="flex flex-col items-center gap-1">
      {playerLabel && (
        <span className="text-xs font-medium text-muted-foreground">
          {playerLabel} ({cards.length})
        </span>
      )}
      <div
        ref={containerRef}
        className="flex w-full items-end justify-center overflow-visible px-2"
        style={{ minHeight: 112 }}
      >
        <div
          className="relative flex items-end"
          style={{
            gap: 0,
            marginLeft: cardGap < 0 ? `${Math.abs(cardGap) * (cards.length - 1)}px` : 0,
          }}
        >
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={cn(
                "transition-all duration-150",
                cardGap < 0 ? "-mr-[20px]" : ""
              )}
              style={{
                marginRight: cardGap < 0 ? `${cardGap}px` : `${cardGap}px`,
                zIndex: index,
                marginBottom: isCurrentPlayer
                  ? Math.sin((index / Math.max(cards.length - 1, 1)) * Math.PI) * 8
                  : 0,
              }}
            >
              <UnoCard
                card={card}
                faceUp={true}
                selected={selectedCardIndex === index}
                playable={isCurrentPlayer ? isPlayable(index) : false}
                onClick={() => onCardClick?.(index)}
                disabled={disabled || !isPlayable(index)}
                shake={shakeCardIndex === index}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
