/**
 * Team-level advanced basketball statistics (Phase 7 — Team Insights)
 *
 * All functions are pure transformations of per-game team totals.
 * These compute metrics at the team level, used for efficiency dashboards.
 *
 * @module @onoo/core/stats/team-advanced
 */

import type { GameTeamStats } from "../types";

/** Helper to pick the stat fields we need from GameTeamStats. */
type TeamStats = Pick<
  GameTeamStats,
  | "pts"
  | "fgm"
  | "fga"
  | "tpm"
  | "tpa"
  | "ftm"
  | "fta"
  | "oreb"
  | "dreb"
  | "ast"
  | "stl"
  | "blk"
  | "tov"
  | "pf"
>;

/**
 * Calculate possessions for a team.
 * Formula: 0.5 × (FGA + 0.475 × FTA − OREB + TOV)
 * This is the standard basketball possessions estimate.
 *
 * @version 1.0.0
 * @label observed (from box score totals)
 */
export function calculatePossessions(team: TeamStats): number {
  return 0.5 * (team.fga + 0.475 * team.fta - team.oreb + team.tov);
}

/**
 * Offensive Rating — points scored per 100 possessions.
 * Formula: (PTS / Possessions) × 100
 *
 * @version 1.0.0
 * @label computed
 */
export function calculateORtg(team: TeamStats, possessions: number): number {
  if (possessions <= 0) return 0;
  return (team.pts / possessions) * 100;
}

/**
 * Defensive Rating — points allowed per 100 possessions.
 * Uses opponent's stats from the same game.
 * Formula: (Opponent PTS / Opponent Possessions) × 100
 *
 * @version 1.0.0
 * @label computed
 */
export function calculateDRtg(
  opponent: TeamStats,
  opponentPossessions: number,
): number {
  if (opponentPossessions <= 0) return 0;
  return (opponent.pts / opponentPossessions) * 100;
}

/**
 * Net Rating — ORtg − DRtg
 * Positive means the team outscores its opponent per 100 possessions.
 *
 * @version 1.0.0
 * @label computed
 */
export function calculateNetRTG(ortg: number, drtg: number): number {
  return ortg - drtg;
}

/**
 * Pace — possessions per 48 minutes (one regulation game).
 * Formula: 48 × ((Team Possessions + Opponent Possessions) / 2) / minutes
 * When minutes is 0 or not provided, uses 48 as default.
 *
 * @version 1.0.0
 * @label estimated (uses box score totals, not event timing)
 */
export function calculatePace(
  teamPoss: number,
  oppPoss: number,
  minutes: number = 48,
): number {
  if (minutes <= 0) return 0;
  return (48 * ((teamPoss + oppPoss) / 2)) / minutes;
}

/**
 * Effective Field Goal Percentage (team-level).
 * Same formula as player eFG% but using team totals.
 * Formula: (FGM + 0.5 × TPM) / FGA
 *
 * @version 1.0.0
 * @label observed
 */
export function calculateTeamEFG(team: TeamStats): number {
  if (team.fga <= 0) return 0;
  return (team.fgm + 0.5 * team.tpm) / team.fga;
}

/**
 * Turnover Percentage — turnovers per 100 possessions.
 * Formula: (TOV / Possessions) × 100
 *
 * @version 1.0.0
 * @label computed
 */
export function calculateTOVPct(team: TeamStats): number {
  const poss = calculatePossessions(team);
  if (poss <= 0) return 0;
  return (team.tov / poss) * 100;
}

/**
 * Offensive Rebound Percentage — share of available offensive rebounds secured.
 * Formula: OREB / (OREB + Opponent DREB)
 *
 * @version 1.0.0
 * @label computed
 */
export function calculateOREBPct(team: TeamStats, opponent: TeamStats): number {
  const total = team.oreb + opponent.dreb;
  if (total <= 0) return 0;
  return team.oreb / total;
}

/**
 * Free Throw Attempt Rate — FTA per FGA.
 * Measures how often a team gets to the line.
 * Formula: FTA / FGA
 *
 * @version 1.0.0
 * @label observed
 */
export function calculateFTARate(team: TeamStats): number {
  if (team.fga <= 0) return 0;
  return team.fta / team.fga;
}

/**
 * The Four Factors of basketball success (team-level).
 * Each factor contributes to winning:
 * - Shooting (eFG%) — 40%
 * - Turnovers (TOV%) — 25%
 * - Rebounding (OREB%) — 20%
 * - Free throws (FTA Rate) — 15%
 *
 * Returns all four as a tuple: [efg, tovPct, orebPct, ftaRate]
 *
 * @version 1.0.0
 */
export function calculateFourFactors(
  team: TeamStats,
  opponent: TeamStats,
): [eFG: number, tovPct: number, orebPct: number, ftaRate: number] {
  return [
    calculateTeamEFG(team),
    calculateTOVPct(team),
    calculateOREBPct(team, opponent),
    calculateFTARate(team),
  ];
}

/**
 * Player Impact Estimate (team-level aggregate).
 * PIE measures a team's contribution to the game.
 * This is the team-level version: what fraction of all game stats
 * did this team contribute?
 *
 * Formula:
 *   Team Stats Sum / (Team Stats Sum + Opponent Stats Sum)
 * Where Stats = PTS + FGM + FTM - FGA - FTA + DREB + (0.5 × OREB) + AST + STL + (0.5 × BLK) - PF - TOV
 *
 * @version 1.0.0
 * @label computed
 */
export function calculatePIE(team: TeamStats, opponent: TeamStats): number {
  const teamSum =
    team.pts +
    team.fgm +
    team.ftm -
    team.fga -
    team.fta +
    team.dreb +
    0.5 * team.oreb +
    team.ast +
    team.stl +
    0.5 * team.blk -
    team.pf -
    team.tov;

  const oppSum =
    opponent.pts +
    opponent.fgm +
    opponent.ftm -
    opponent.fga -
    opponent.fta +
    opponent.dreb +
    0.5 * opponent.oreb +
    opponent.ast +
    opponent.stl +
    0.5 * opponent.blk -
    opponent.pf -
    opponent.tov;

  const total = teamSum + oppSum;
  if (total === 0) return 0;
  return teamSum / total;
}

/**
 * Compute all team advanced stats at once.
 * Returns a single object with every metric.
 */
export function calculateTeamAdvancedStats(
  team: TeamStats,
  opponent: TeamStats,
): {
  possessions: number;
  ortg: number;
  drtg: number;
  netRtg: number;
  pace: number;
  efg: number;
  tovPct: number;
  orebPct: number;
  ftaRate: number;
  pie: number;
  fourFactors: [number, number, number, number];
} {
  const teamPoss = calculatePossessions(team);
  const oppPoss = calculatePossessions(opponent);
  const ortg = calculateORtg(team, teamPoss);
  const drtg = calculateDRtg(opponent, oppPoss);

  return {
    possessions: teamPoss,
    ortg,
    drtg,
    netRtg: calculateNetRTG(ortg, drtg),
    pace: calculatePace(teamPoss, oppPoss),
    efg: calculateTeamEFG(team),
    tovPct: calculateTOVPct(team),
    orebPct: calculateOREBPct(team, opponent),
    ftaRate: calculateFTARate(team),
    pie: calculatePIE(team, opponent),
    fourFactors: calculateFourFactors(team, opponent),
  };
}
