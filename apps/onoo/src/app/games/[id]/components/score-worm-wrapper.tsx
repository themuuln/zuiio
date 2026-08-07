"use client";

import dynamic from "next/dynamic";
import type { ScoreWormProps } from "./score-worm";

const ScoreWorm = dynamic(
  () => import("./score-worm").then((m) => ({ default: m.ScoreWorm })),
  { ssr: false },
);

/**
 * Client Component wrapper that lazy-loads ScoreWorm (recharts-heavy) with ssr: false.
 * Required because `ssr: false` is not allowed with next/dynamic in Server Components.
 */
export function ScoreWormWrapper(props: ScoreWormProps) {
  return <ScoreWorm {...props} />;
}
