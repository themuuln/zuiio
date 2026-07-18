/**
 * Pure-function module for generating natural-language game summaries
 * in Mongolian.  No side-effects, no DB access — just stats in, text out.
 */

interface SummaryInput {
  player_name: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  result: "W" | "L";
  team_score: number;
  opponent_score: number;
  opponent_short_code: string;
}

function isDoubleDouble(s: SummaryInput): boolean {
  const cats = [s.pts, s.reb, s.ast, s.stl, s.blk];
  return cats.filter((v) => v >= 10).length >= 2;
}

/**
 * Generate a one-line Mongolian summary of a player's game performance.
 *
 * Priority order:
 *  1. 20+ points  →  highlighted scorer narrative
 *  2. Double-double  →  milestone celebration
 *  3. 15+ points  →  solid contributor
 *  4. High efficiency (FG% > 60 % on 5+ attempts)  →  efficiency praise
 *  5. Default  →  basic stat line
 */
export function generatePlayerGameSummary(stats: SummaryInput): string {
  const {
    player_name: name,
    pts,
    reb,
    ast,
    stl,
    blk,
    fgm,
    fga,
    result,
  } = stats;

  // 1 — 20+ points
  if (pts >= 20) {
    const outcome = result === "W" ? "ялалт авлаа" : "ялагдлаа";
    return `${name} ${pts} оноо цохиж, багтаа ${outcome}`;
  }

  // 2 — Double-double
  if (isDoubleDouble(stats)) {
    const parts: string[] = [];
    if (pts >= 10) parts.push(`${pts} оноо`);
    if (reb >= 10) parts.push(`${reb} буулт`);
    if (ast >= 10) parts.push(`${ast} дамжуулалт`);
    if (stl >= 10) parts.push(`${stl} бөмбөг таслалт`);
    if (blk >= 10) parts.push(`${blk} блок`);
    return `${name} double-double амжилт гаргалаа — ${parts.join(", ")}`;
  }

  // 3 — 15+ points
  if (pts >= 15) {
    return `${name} ${pts} оноо, ${ast} дамжуулалт өгч багтаа тус боллоо`;
  }

  // 4 — High efficiency
  if (fga >= 5 && fgm / fga > 0.6) {
    return `${name} үр ашгаар тоглож, ${fgm}/${fga} шидэлтээс ${pts} оноо авлаа`;
  }

  // 5 — Default
  return `${name} ${pts} оноо, ${reb} буулт, ${ast} дамжуулалт`;
}
