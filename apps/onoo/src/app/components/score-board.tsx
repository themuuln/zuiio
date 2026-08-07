"use client";

import { FlipScore } from "./flip-score";

// Legacy alias — games/[id] and admin surfaces still import ScoreBoard.
// FlipScore is the canonical flip-clock scoreboard; keep the old name
// exported so callers don't need to change.
export function ScoreBoard({
  homeScore,
  awayScore,
  className,
}: {
  homeScore: number;
  awayScore: number;
  className?: string;
}) {
  return (
    <FlipScore
      homeScore={homeScore}
      awayScore={awayScore}
      className={className}
    />
  );
}
