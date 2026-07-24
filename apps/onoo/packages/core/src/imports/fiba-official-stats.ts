export interface FibaTextItem {
  str: string;
  x: number;
  y: number;
}

export interface FibaPlayerStatLine {
  jerseyNumber: number;
  name: string;
  secondsPlayed: number | null;
  dnp: boolean;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  pf: number;
  pts: number;
  plusMinus: number;
}

export interface FibaTeamBoxScore {
  name: string;
  code: string;
  players: FibaPlayerStatLine[];
}

export interface FibaOfficialStats {
  format: "fiba_official_statistics_v1";
  score: {
    home: number;
    away: number;
  };
  teams: [FibaTeamBoxScore, FibaTeamBoxScore];
  warnings: string[];
  confidence: number;
}

const TEAM_HEADER = /^(.+?)\s+\(([A-Z0-9]{2,6})\)$/;
const PLAYER_LINE =
  /^(\*)?(\d+)\s*\.?\s*(.+?)\s+(DNP|\d{1,2}:\d{2})(?:\s+(.*))?$/i;
const MADE_ATTEMPT = /(\d+)\s*\/\s*(\d+)/g;

function numberOrZero(value: string | undefined): number {
  return Number(value ?? "0");
}

function toSeconds(minutes: string): number | null {
  if (minutes === "DNP") return null;

  const parts = minutes.split(":").map(Number);
  const mins = parts[0];
  const secs = parts[1];
  if (
    mins === undefined ||
    secs === undefined ||
    Number.isNaN(mins) ||
    Number.isNaN(secs)
  ) {
    return null;
  }
  return mins * 60 + secs;
}

function parsePlayer(line: string): FibaPlayerStatLine | null {
  const match = PLAYER_LINE.exec(line);
  if (!match) return null;

  const rawName = match[3];
  const rawMinutes = match[4];
  if (!rawName || !rawMinutes) return null;

  const name = rawName.trim().replace(/\s+/g, " ");
  const minutes = rawMinutes.toUpperCase();
  const dnp = minutes === "DNP";
  if (!name || dnp) {
    return {
      jerseyNumber: numberOrZero(match[2]),
      name,
      secondsPlayed: null,
      dnp: true,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
      reb: 0,
      ast: 0,
      tov: 0,
      stl: 0,
      blk: 0,
      pf: 0,
      pts: 0,
      plusMinus: 0,
    };
  }

  const stats = match[5] ?? "";
  const shooting = [...stats.matchAll(MADE_ATTEMPT)].map((attempt) => ({
    made: numberOrZero(attempt[1]),
    attempted: numberOrZero(attempt[2]),
  }));

  if (shooting.length < 4) return null;

  const remaining = stats
    .replace(MADE_ATTEMPT, " ")
    .replace(/[+-]?\d+\.\d+/g, " ");
  const values = [...remaining.matchAll(/[+-]?\d+/g)].map((value) =>
    Number(value[0]),
  );
  if (values.length < 12) return null;

  return {
    jerseyNumber: numberOrZero(match[2]),
    name,
    secondsPlayed: toSeconds(minutes),
    dnp: false,
    fgm: shooting[0]?.made ?? 0,
    fga: shooting[0]?.attempted ?? 0,
    tpm: shooting[2]?.made ?? 0,
    tpa: shooting[2]?.attempted ?? 0,
    ftm: shooting[3]?.made ?? 0,
    fta: shooting[3]?.attempted ?? 0,
    oreb: values[0] ?? 0,
    dreb: values[1] ?? 0,
    reb: values[2] ?? 0,
    ast: values[3] ?? 0,
    tov: values[4] ?? 0,
    stl: values[5] ?? 0,
    blk: values[6] ?? 0,
    pf: values[7] ?? 0,
    plusMinus: values[10] ?? 0,
    pts: values[11] ?? 0,
  };
}

/**
 * Groups PDF text items into their visual lines. FIBA tables use a stable
 * horizontal layout, so preserving each item's x/y coordinates is essential.
 */
export function fibaTextItemsToLines(
  items: readonly FibaTextItem[],
  tolerance = 2,
): string[] {
  const lines: Array<{ y: number; items: FibaTextItem[] }> = [];

  for (const item of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const line = lines.find(
      (candidate) => Math.abs(candidate.y - item.y) <= tolerance,
    );
    if (line) {
      line.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  return lines
    .sort((a, b) => b.y - a.y)
    .map(({ items: lineItems }) =>
      lineItems
        .sort((a, b) => a.x - b.x)
        .map((item) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

/**
 * Parses the one-page FIBA "Official Statistics" PDF layout. The parsed data
 * is a reviewable source document; it must not be written directly to any
 * derived stats table.
 */
export function parseFibaOfficialStats(
  lines: readonly string[],
): FibaOfficialStats {
  const normalizedLines = lines
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const scoreLine = normalizedLines.find((line) =>
    /\b\d{1,3}\s*-\s*\d{1,3}\b/.test(line),
  );
  const scoreMatch = scoreLine?.match(/\b(\d{1,3})\s*-\s*(\d{1,3})\b/);

  if (!scoreMatch) {
    throw new Error("FIBA official statistics score was not found");
  }

  const teams: FibaTeamBoxScore[] = [];
  let currentTeam: FibaTeamBoxScore | null = null;

  for (const line of normalizedLines) {
    const teamMatch = TEAM_HEADER.exec(line);
    if (
      teamMatch &&
      !/\bvs\b/i.test(line) &&
      !/^official statistics$/i.test(line)
    ) {
      const name = teamMatch[1];
      const code = teamMatch[2];
      if (!name || !code) continue;

      const team = {
        name: name.trim(),
        code,
        players: [],
      };
      currentTeam = team;
      teams.push(team);
      continue;
    }

    if (!currentTeam) continue;
    const player = parsePlayer(line);
    if (player) currentTeam.players.push(player);
  }

  if (teams.length !== 2) {
    throw new Error(`Expected two team tables, found ${teams.length}`);
  }

  if (teams.some((team) => team.players.length === 0)) {
    throw new Error("A FIBA team table contained no player rows");
  }

  const warnings: string[] = [];
  const homeTeam = teams[0];
  const awayTeam = teams[1];
  if (!homeTeam || !awayTeam) {
    throw new Error("Expected two FIBA team tables");
  }
  const homePoints = homeTeam.players.reduce(
    (sum, player) => sum + player.pts,
    0,
  );
  const awayPoints = awayTeam.players.reduce(
    (sum, player) => sum + player.pts,
    0,
  );
  const homeScore = numberOrZero(scoreMatch[1]);
  const awayScore = numberOrZero(scoreMatch[2]);

  if (homePoints !== homeScore) {
    warnings.push(
      `${homeTeam.name}: player points ${homePoints} do not match score ${homeScore}`,
    );
  }
  if (awayPoints !== awayScore) {
    warnings.push(
      `${awayTeam.name}: player points ${awayPoints} do not match score ${awayScore}`,
    );
  }

  return {
    format: "fiba_official_statistics_v1",
    score: { home: homeScore, away: awayScore },
    teams: [homeTeam, awayTeam],
    warnings,
    confidence: warnings.length === 0 ? 0.98 : 0.75,
  };
}
