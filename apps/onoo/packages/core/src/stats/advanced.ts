/**
 * Advanced basketball statistics calculations
 * All functions are pure - take BoxScoreLine as input, return computed values
 */

interface BoxScoreLine {
  player_id: string;
  team_season_id: string;
  gp: number;
  minutes: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}

/**
 * Effective Field Goal Percentage
 * Formula: (FGM + 0.5 * 3PM) / FGA
 */
export function calculateEFG(line: BoxScoreLine): number {
  if (line.fga === 0) return 0;
  return (line.fgm + 0.5 * line.tpm) / line.fga;
}

/**
 * True Shooting Percentage
 * Formula: PTS / (2 * (FGA + 0.44 * FTA))
 */
export function calculateTS(line: BoxScoreLine): number {
  const denominator = 2 * (line.fga + 0.44 * line.fta);
  if (denominator === 0) return 0;
  return line.pts / denominator;
}

/**
 * Free Throw Rate
 * Formula: FTA / FGA
 */
export function calculateFTRate(line: BoxScoreLine): number {
  if (line.fga === 0) return 0;
  return line.fta / line.fga;
}

/**
 * Three Point Attempt Rate
 * Formula: 3PA / FGA
 */
export function calculateTPARate(line: BoxScoreLine): number {
  if (line.fga === 0) return 0;
  return line.tpa / line.fga;
}

/**
 * Assist to Turnover Ratio
 * Formula: AST / TOV
 */
export function calculateASTTORatio(line: BoxScoreLine): number {
  if (line.tov === 0) return line.ast; // All assists, no turnovers
  return line.ast / line.tov;
}

/**
 * Assist Percentage (estimated)
 * Formula: AST / ((TEAM_FGM * MIN) / (TEAM_MIN * 5)) - simplified version
 * Note: Full formula requires team totals, this is a simplified estimate
 */
export function calculateASTPct(line: BoxScoreLine): number {
  if (line.minutes === 0 || line.fgm === 0) return 0;
  // Simplified: AST per minute normalized
  return line.ast / line.minutes;
}

/**
 * Rebound Percentage (estimated)
 * Formula: (REB * TEAM_MIN) / (MIN * TEAM_REB) - simplified
 * Returns total rebound percentage estimate
 */
export function calculateTRBPct(line: BoxScoreLine): number {
  if (line.minutes === 0) return 0;
  return (line.oreb + line.dreb) / line.minutes;
}

/**
 * Offensive Rebound Percentage (estimated)
 */
export function calculateORBPct(line: BoxScoreLine): number {
  if (line.minutes === 0) return 0;
  return line.oreb / line.minutes;
}

/**
 * Defensive Rebound Percentage (estimated)
 */
export function calculateDRBPct(line: BoxScoreLine): number {
  if (line.minutes === 0) return 0;
  return line.dreb / line.minutes;
}

/**
 * Steal Percentage (estimated)
 */
export function calculateSTLPct(line: BoxScoreLine): number {
  if (line.minutes === 0) return 0;
  return line.stl / line.minutes;
}

/**
 * Block Percentage (estimated)
 */
export function calculateBLKPct(line: BoxScoreLine): number {
  if (line.minutes === 0) return 0;
  return line.blk / line.minutes;
}

/**
 * Turnover Percentage
 * Formula: TOV / (FGA + 0.44 * FTA + TOV)
 */
export function calculateTOVPct(line: BoxScoreLine): number {
  const possessions = line.fga + 0.44 * line.fta + line.tov;
  if (possessions === 0) return 0;
  return line.tov / possessions;
}

/**
 * Usage Rate (estimated)
 * Formula: ((FGA + 0.44 * FTA + TOV) * (TEAM_MIN / 5)) / (MIN * TEAM_FG_ATTEMPTS)
 * Simplified: possessions used per minute
 */
export function calculateUSGPct(line: BoxScoreLine): number {
  if (line.minutes === 0) return 0;
  const possessions = line.fga + 0.44 * line.fta + line.tov;
  return possessions / line.minutes;
}

/**
 * Points per minute
 */
export function calculatePPM(line: BoxScoreLine): number {
  if (line.minutes === 0) return 0;
  return line.pts / line.minutes;
}

/**
 * Points per 36 minutes (standardized)
 */
export function calculatePer36(line: BoxScoreLine, stat: keyof BoxScoreLine): number {
  if (line.minutes === 0) return 0;
  const value = line[stat];
  if (typeof value !== "number") return 0;
  return (value / line.minutes) * 36;
}

/**
 * Game Score (John Hollinger)
 * Formula: PTS + 0.4 * FGM - 0.7 * FGA - 0.4 * (FTA - FT) + 0.7 * ORB + 0.3 * DRB + STL + 0.7 * AST + 0.7 * BLK - 0.4 * PF - TOV
 */
export function calculateGameScore(line: BoxScoreLine): number {
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

/**
 * Calculate all advanced stats for a player
 */
export function calculateAdvancedStats(line: BoxScoreLine) {
  return {
    efg: calculateEFG(line),
    ts: calculateTS(line),
    ftRate: calculateFTRate(line),
    tpRate: calculateTPARate(line),
    astTo: calculateASTTORatio(line),
    tovPct: calculateTOVPct(line),
    usgPct: calculateUSGPct(line),
    ppm: calculatePPM(line),
    gameScore: calculateGameScore(line),
    per36: {
      pts: calculatePer36(line, "pts"),
      reb: calculatePer36(line, "oreb") + calculatePer36(line, "dreb"),
      ast: calculatePer36(line, "ast"),
      stl: calculatePer36(line, "stl"),
      blk: calculatePer36(line, "blk"),
    },
  };
}
