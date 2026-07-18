export interface GameSummaryInput {
  pts: number;
  reb: number; // oreb + dreb
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  tpm: number;
  ftm: number;
  isCareerHigh?: boolean;
  isSeasonHigh?: boolean;
  teamWon?: boolean;
}

export interface GameSummary {
  mn: string;
  en: string;
}

function countDoubles(line: GameSummaryInput): number {
  let n = 0;
  if (line.pts >= 10) n++;
  if (line.reb >= 10) n++;
  if (line.ast >= 10) n++;
  if (line.stl >= 10) n++;
  if (line.blk >= 10) n++;
  return n;
}

interface DoubleDoubleResult {
  v1: number;
  v2: number;
  mnLabel: string;
  enLabel: string;
}

function doubleDoubleLabel(line: GameSummaryInput): DoubleDoubleResult {
  const stats: [number, string, string][] = [
    [line.pts, "оноо", "pts"],
    [line.reb, "самбар", "reb"],
    [line.ast, "дамжуулалт", "ast"],
    [line.stl, "булаан", "stl"],
    [line.blk, "блок", "blk"],
  ];
  const eligible = stats.filter(([v]) => v >= 10).sort((a, b) => b[0] - a[0]);
  if (eligible.length < 2) {
    // Shouldn't be called without 2+ eligible stats, but be safe
    return {
      v1: eligible[0]?.[0] ?? 0,
      v2: eligible[1]?.[0] ?? 0,
      mnLabel: eligible[0]?.[1] ?? "",
      enLabel: eligible[0]?.[2] ?? "",
    };
  }
  // After guard: eligible has ≥2 items, so indexing is safe
  const labelIdx = eligible.findIndex(([, , k]) => k !== "pts");
  const labelI = labelIdx >= 0 ? labelIdx : 0;
  const valueI = labelI === 0 ? 1 : 0;
  const labelStat = eligible[labelI]!;
  const valueStat = eligible[valueI]!;
  // Always put the higher value first in display
  const hi = labelStat[0] >= valueStat[0] ? labelStat : valueStat;
  const lo = hi === labelStat ? valueStat : labelStat;
  return { v1: hi[0], v2: lo[0], mnLabel: labelStat[1], enLabel: labelStat[2] };
}

function shootingSuffix(line: GameSummaryInput): string {
  if (line.fga < 10) return "";
  if (line.fgm / line.fga < 0.6) return "";
  return " 60% пүршилттэй";
}

export function describePlayerGame(line: GameSummaryInput): GameSummary {
  const doubles = countDoubles(line);

  // 1. Career high
  if (line.isCareerHigh) {
    return {
      mn: `Карьерийн дээд амжилт: ${line.pts} оноо`,
      en: `Career high: ${line.pts} pts`,
    };
  }

  // 2. Season high
  if (line.isSeasonHigh) {
    return {
      mn: `Улирлын дээд амжилт: ${line.pts} оноо`,
      en: `Season high: ${line.pts} pts`,
    };
  }

  // 3. Triple-double (3+ stats ≥ 10)
  if (doubles >= 3) {
    const [a, b, c] = [line.pts, line.reb, line.ast].sort((x, y) => y - x);
    return {
      mn: `Гурван-${doubles > 3 ? "плюс" : "давхар"}: ${a}/${b}/${c}`,
      en: `Triple${doubles > 3 ? "-plus" : ""}-double: ${a}/${b}/${c}`,
    };
  }

  // 4. Double-double (2 stats ≥ 10)
  if (doubles === 2) {
    const dd = doubleDoubleLabel(line);
    return {
      mn: `Давхар-${dd.mnLabel}: ${dd.v1}/${dd.v2}`,
      en: `Double-${dd.enLabel}: ${dd.v1}/${dd.v2}`,
    };
  }

  // 5. 20+ points
  if (line.pts >= 20) {
    const suffix = shootingSuffix(line);
    return {
      mn: `${line.pts} оноо тоглолт${suffix}`,
      en: `${line.pts}-point game${suffix}`,
    };
  }

  // 6. Default
  const suffix = shootingSuffix(line);
  return {
    mn: `${line.pts} оноо, ${line.reb} самбар, ${line.ast} дамжуулалт${suffix}`,
    en: `${line.pts} pts, ${line.reb} reb, ${line.ast} ast${suffix}`,
  };
}
