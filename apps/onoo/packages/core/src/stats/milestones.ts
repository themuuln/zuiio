/**
 * Career milestones detection.
 *
 * Pure functions — no React, no DB, no DOM.
 * Operates on an array of `GameLine` objects sorted by date ascending.
 */

export interface GameLine {
  game_id: string;
  game_date: string;
  pts: number;
  reb: number; // oreb + dreb
  ast: number;
  stl: number;
  blk: number;
}

export interface Milestone {
  type:
    | "career_high_pts"
    | "career_high_reb"
    | "career_high_ast"
    | "career_high_stl"
    | "career_high_blk"
    | "double_double"
    | "triple_double"
    | "twenty_plus"
    | "double_digit_streak";
  stat?: string;
  value: number;
  game_date?: string;
  /** Count of games matching the milestone (double_double, triple_double, twenty_plus). */
  count?: number;
  /** Current consecutive double-digit scoring streak length. */
  streak?: number;
}

type StatKey = "pts" | "reb" | "ast" | "stl" | "blk";

const STAT_KEYS: StatKey[] = ["pts", "reb", "ast", "stl", "blk"];

/**
 * Detect milestones across a career's worth of game lines.
 *
 * @param gameLines - Array of game lines, any order (sorted internally by date ascending).
 * @returns Array of detected milestones.
 */
export function detectMilestones(gameLines: GameLine[]): Milestone[] {
  if (gameLines.length === 0) return [];

  const sorted = [...gameLines].sort((a, b) =>
    a.game_date.localeCompare(b.game_date),
  );

  const milestones: Milestone[] = [];

  // ── Career highs (first time each record is set) ────────────────────────
  const careerHighs: Record<StatKey, { value: number; game_date: string }> = {
    pts: { value: -1, game_date: "" },
    reb: { value: -1, game_date: "" },
    ast: { value: -1, game_date: "" },
    stl: { value: -1, game_date: "" },
    blk: { value: -1, game_date: "" },
  };

  for (const game of sorted) {
    for (const key of STAT_KEYS) {
      if (game[key] > careerHighs[key].value) {
        careerHighs[key] = { value: game[key], game_date: game.game_date };
      }
    }
  }

  const milestoneTypeMap: Record<StatKey, Milestone["type"]> = {
    pts: "career_high_pts",
    reb: "career_high_reb",
    ast: "career_high_ast",
    stl: "career_high_stl",
    blk: "career_high_blk",
  };

  for (const key of STAT_KEYS) {
    const high = careerHighs[key];
    if (high.value >= 0) {
      milestones.push({
        type: milestoneTypeMap[key],
        stat: key,
        value: high.value,
        game_date: high.game_date,
      });
    }
  }

  // ── Counts: double-double, triple-double, 20+ ──────────────────────────
  let doubleDoubleCount = 0;
  let tripleDoubleCount = 0;
  let twentyPlusCount = 0;

  for (const game of sorted) {
    const doubleDigitCount = STAT_KEYS.filter((key) => game[key] >= 10).length;

    if (doubleDigitCount >= 2) doubleDoubleCount++;
    if (doubleDigitCount >= 3) tripleDoubleCount++;
    if (game.pts >= 20) twentyPlusCount++;
  }

  if (doubleDoubleCount > 0) {
    milestones.push({
      type: "double_double",
      value: 0,
      count: doubleDoubleCount,
    });
  }

  if (tripleDoubleCount > 0) {
    milestones.push({
      type: "triple_double",
      value: 0,
      count: tripleDoubleCount,
    });
  }

  if (twentyPlusCount > 0) {
    milestones.push({
      type: "twenty_plus",
      value: 0,
      count: twentyPlusCount,
    });
  }

  // ── Double-digit scoring streak (current, ending at last game) ──────────
  let currentStreak = 0;
  for (const game of [...sorted].reverse()) {
    if (game.pts >= 10) {
      currentStreak++;
    } else {
      break;
    }
  }

  if (currentStreak > 0) {
    milestones.push({
      type: "double_digit_streak",
      value: 0,
      streak: currentStreak,
    });
  }

  return milestones;
}
