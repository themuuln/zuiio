/** NBA Game Score formula — single-number performance metric */
export function computeGameScore(stats: {
  pts: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  stl: number;
  ast: number;
  blk: number;
  pf: number;
  tov: number;
}): number {
  return Number(
    (
      stats.pts +
      0.4 * stats.fgm -
      0.7 * stats.fga -
      0.4 * (stats.fta - stats.ftm) +
      0.7 * stats.oreb +
      0.3 * stats.dreb +
      stats.stl +
      0.7 * stats.ast +
      0.7 * stats.blk -
      0.4 * stats.pf -
      stats.tov
    ).toFixed(1),
  );
}

/** Traditional efficiency (PTS+REB+AST+STL+BLK - missed shots - TOV) */
export function computeEfficiency(stats: {
  pts: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
}): number {
  return (
    stats.pts +
    stats.reb +
    stats.ast +
    stats.stl +
    stats.blk -
    (stats.fga - stats.fgm) -
    (stats.fta - stats.ftm) -
    stats.tov
  );
}
