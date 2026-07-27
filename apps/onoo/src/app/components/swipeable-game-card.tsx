"use client";

import { BarChart3, ListOrdered, Share2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { GameWithTeams } from "../lib/shared";
import { GameCard } from "./game-card";

interface SwipeableGameCardProps {
  game: GameWithTeams;
  featured?: boolean;
  className?: string;
}

const REVEAL_WIDTH = 120;
const THRESHOLD = 40;

export function SwipeableGameCard({
  game,
  featured,
  className,
}: SwipeableGameCardProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startX.current = touch.clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    currentX.current = touch.clientX;
    const diff = startX.current - currentX.current;
    // Only allow left swipe (positive diff), max to REVEAL_WIDTH
    const newOffset = Math.min(Math.max(0, diff), REVEAL_WIDTH);
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    // Snap to reveal or hide based on threshold
    setOffset(offset > THRESHOLD ? REVEAL_WIDTH : 0);
  };

  const hideActions = () => setOffset(0);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${game.home_team_name} vs ${game.away_team_name}`,
        url: `/games/${game.id}`,
      });
    }
    hideActions();
  };

  return (
    <div
      className={cn(
        "swipeable-card relative overflow-hidden rounded-xl",
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={hideActions}
    >
      {/* Action panel (revealed on swipe/hover) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center gap-1 bg-sidebar-accent p-2"
        style={{ width: REVEAL_WIDTH }}
      >
        <Link
          href={`/games/${game.id}`}
          onClick={hideActions}
          className="flex size-10 items-center justify-center rounded-lg bg-card text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
          aria-label="Бүрэн статистик"
        >
          <BarChart3 className="size-4" />
        </Link>
        <Link
          href={`/games/${game.id}#play-by-play`}
          onClick={hideActions}
          className="flex size-10 items-center justify-center rounded-lg bg-card text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
          aria-label="Тоглолтын явц"
        >
          <ListOrdered className="size-4" />
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="flex size-10 items-center justify-center rounded-lg bg-card text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
          aria-label="Хуваалцах"
        >
          <Share2 className="size-4" />
        </button>
      </div>

      {/* Card content (slides left on swipe) */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${offset}px)` }}
      >
        <GameCard game={game} />
      </div>
    </div>
  );
}
