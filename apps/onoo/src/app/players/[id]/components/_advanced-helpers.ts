/**
 * Pure helpers for computing advanced basketball statistics on the player page.
 * Formulas are standard basketball analytics (Hollinger, etc.).
 * Runs server-side only.
 */
import type { PlayerGameLine } from "@/app/lib/shared";

// ---------------------------------------------------------------------------
// Inline advanced stat formulas
// ---------------------------------------------------------------------------

function calcTsPct(pts: number, fga: number, fta: number): number {
  const denom = 2 * (fga + 0.44 * fta);
  return denom === 0 ? 0 : pts / denom;
}

function calcEfgPct(fgm: number, fga: number, tpm: number): number {
  return fga === 0 ? 0 : (fgm + 0.5 * tpm) / fga;
}

function calcGameScore(line: {
  pts: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}): number {
  return (
    line.pts +
    0.4 * line.fgm -
    0.7 * line.fga -
    0.4 * (line.fta - line.ftm) +
    0.7 * line.oreb +
    0.3 * line.dreb +
    line.stl +
    0.7 * line.ast +
    0.7 * line.blk -
    0.4 * line.pf -
    line.tov
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Season-level advanced stats (averages)
// ---------------------------------------------------------------------------

export interface SeasonAdvancedStats {
  tsPct: number;
  efgPct: number;
  avgGameScore: number;
  astTovRatio: number;
  tovPct: number;
  ptsPer36: number;
  rebPer36: number;
  astPer36: number;
  mpg: number;
  gp: number;
}

export function computeSeasonAdvancedStats(
  gameLines: PlayerGameLine[],
): SeasonAdvancedStats | null {
  if (gameLines.length === 0) return null;

  const totals = gameLines.reduce(
    (acc, line) => {
      acc.pts += line.pts;
      acc.fgm += line.fgm;
      acc.fga += line.fga;
      acc.tpm += line.tpm;
      acc.ftm += line.ftm;
      acc.fta += line.fta;
      acc.oreb += line.oreb;
      acc.dreb += line.dreb;
      acc.ast += line.ast;
      acc.stl += line.stl;
      acc.blk += line.blk;
      acc.tov += line.tov;
      acc.pf += line.pf;
      acc.minutes += line.seconds_played != null ? line.seconds_played / 60 : 0;
      return acc;
    },
    {
      pts: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      tov: 0,
      pf: 0,
      minutes: 0,
    },
  );

  const gp = gameLines.length;
  const gameScores = gameLines.map((line) =>
    calcGameScore({
      pts: line.pts,
      fgm: line.fgm,
      fga: line.fga,
      ftm: line.ftm,
      fta: line.fta,
      oreb: line.oreb,
      dreb: line.dreb,
      ast: line.ast,
      stl: line.stl,
      blk: line.blk,
      tov: line.tov,
      pf: line.pf,
    }),
  );
  const avgGameScore =
    gameScores.reduce((sum, s) => sum + s, 0) / gameScores.length;

  const astTov = totals.tov === 0 ? totals.ast : totals.ast / totals.tov;
  const tovPoss = totals.fga + 0.44 * totals.fta + totals.tov;
  const tovPctVal = tovPoss === 0 ? 0 : totals.tov / tovPoss;

  return {
    tsPct: safe(calcTsPct(totals.pts, totals.fga, totals.fta)),
    efgPct: safe(calcEfgPct(totals.fgm, totals.fga, totals.tpm)),
    avgGameScore: safe(avgGameScore),
    astTovRatio: safe(astTov),
    tovPct: safe(tovPctVal),
    ptsPer36: safe(totals.minutes > 0 ? (totals.pts / totals.minutes) * 36 : 0),
    rebPer36: safe(
      totals.minutes > 0
        ? ((totals.oreb + totals.dreb) / totals.minutes) * 36
        : 0,
    ),
    astPer36: safe(totals.minutes > 0 ? (totals.ast / totals.minutes) * 36 : 0),
    mpg: safe(totals.minutes / gp),
    gp,
  };
}

// ---------------------------------------------------------------------------
// Home/Away split stats
// ---------------------------------------------------------------------------

export interface HomeAwaySplit {
  label: string;
  gp: number;
  wins: number;
  losses: number;
  winPct: number;
  ppg: number;
  rpg: number;
  apg: number;
  tsPct: number;
  efgPct: number;
  gameScore: number;
}

export function computeHomeAwaySplits(
  gameLines: PlayerGameLine[],
): { home: HomeAwaySplit; away: HomeAwaySplit } | null {
  if (gameLines.length === 0) return null;

  function splitStats(games: PlayerGameLine[], label: string): HomeAwaySplit {
    if (games.length === 0) {
      return {
        label,
        gp: 0,
        wins: 0,
        losses: 0,
        winPct: 0,
        ppg: 0,
        rpg: 0,
        apg: 0,
        tsPct: 0,
        efgPct: 0,
        gameScore: 0,
      };
    }
    const gp = games.length;
    const wins = games.filter((g) => g.result === "W").length;
    const totalPts = games.reduce((s, g) => s + g.pts, 0);
    const totalFga = games.reduce((s, g) => s + g.fga, 0);
    const totalFta = games.reduce((s, g) => s + g.fta, 0);
    const totalFgm = games.reduce((s, g) => s + g.fgm, 0);
    const totalTpm = games.reduce((s, g) => s + g.tpm, 0);
    const avgGameScore =
      games.reduce(
        (s, g) =>
          s +
          calcGameScore({
            pts: g.pts,
            fgm: g.fgm,
            fga: g.fga,
            ftm: g.ftm,
            fta: g.fta,
            oreb: g.oreb,
            dreb: g.dreb,
            ast: g.ast,
            stl: g.stl,
            blk: g.blk,
            tov: g.tov,
            pf: g.pf,
          }),
        0,
      ) / gp;

    return {
      label,
      gp,
      wins,
      losses: gp - wins,
      winPct: gp > 0 ? wins / gp : 0,
      ppg: safe(totalPts / gp),
      rpg: safe(games.reduce((s, g) => s + g.oreb + g.dreb, 0) / gp),
      apg: safe(games.reduce((s, g) => s + g.ast, 0) / gp),
      tsPct: safe(calcTsPct(totalPts, totalFga, totalFta)),
      efgPct: safe(calcEfgPct(totalFgm, totalFga, totalTpm)),
      gameScore: safe(avgGameScore),
    };
  }

  return {
    home: splitStats(
      gameLines.filter((g) => g.is_home),
      "Гэр",
    ),
    away: splitStats(
      gameLines.filter((g) => !g.is_home),
      "Зочид",
    ),
  };
}
// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export interface PlayerStreaks {
  /** Current streak type ("W" or "L") and length */
  currentStreak: { type: "W" | "L"; length: number };
  /** Longest win streak this season */
  longestWinStreak: number;
  /** Longest loss streak this season */
  longestLossStreak: number;
  /** Longest streak of games with 10+ points */
  longestScoringStreak: number;
  /** Current consecutive games with 10+ points */
  currentScoringStreak: number;
}

export function computeStreaks(
  gameLines: Pick<PlayerGameLine, "result" | "pts">[],
): PlayerStreaks {
  // Work from most recent backward (gameLines is chronological)
  const recent = [...gameLines].reverse();

  // Current W/L streak
  let currentType: "W" | "L" | null = null;
  let currentLen = 0;
  for (const g of recent) {
    if (currentType === null) currentType = g.result;
    if (g.result === currentType) currentLen++;
    else break;
  }

  // Longest streaks
  let winStreak = 0;
  let lossStreak = 0;
  let curWin = 0;
  let curLoss = 0;
  for (const g of gameLines) {
    if (g.result === "W") {
      curWin++;
      curLoss = 0;
      winStreak = Math.max(winStreak, curWin);
    } else {
      curLoss++;
      curWin = 0;
      lossStreak = Math.max(lossStreak, curLoss);
    }
  }

  // Scoring streaks (10+ pts)
  let longestSc = 0;
  let curSc = 0;
  let currentSc = 0;
  for (const g of gameLines) {
    if (g.pts >= 10) {
      curSc++;
      longestSc = Math.max(longestSc, curSc);
    } else {
      curSc = 0;
    }
  }
  // Current scoring streak (from most recent forward)
  for (const g of recent) {
    if (g.pts >= 10) currentSc++;
    else break;
  }

  return {
    currentStreak: { type: currentType ?? "W", length: currentLen },
    longestWinStreak: winStreak,
    longestLossStreak: lossStreak,
    longestScoringStreak: longestSc,
    currentScoringStreak: currentSc,
  };
}
