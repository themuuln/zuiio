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
  isStarter: boolean;
  /** Field goals made */
  fgm: number;
  /** Field goals attempted */
  fga: number;
  /** 2-point field goals made */
  twoPgm: number;
  /** 2-point field goals attempted */
  twoPga: number;
  /** 3-point field goals made */
  tpm: number;
  /** 3-point field goals attempted */
  tpa: number;
  /** Free throws made */
  ftm: number;
  /** Free throws attempted */
  fta: number;
  /** Offensive rebounds */
  oreb: number;
  /** Defensive rebounds */
  dreb: number;
  /** Total rebounds (from PDF) */
  reb: number;
  /** Assists */
  ast: number;
  /** Turnovers */
  tov: number;
  /** Steals */
  stl: number;
  /** Blocked shots */
  blk: number;
  /** Personal fouls (PF column) */
  pf: number;
  /** Fouls committed (C column) — separate from PF in FIBA PDF */
  foulsCommitted: number | null;
  /** Fouls drawn (D column) */
  foulsDrawn: number | null;
  /** Points scored */
  pts: number;
  /** Plus/minus (+/− column). Null for DNP players. */
  plusMinus: number | null;
}

export interface FibaTeamTotals {
  fgm: number;
  fga: number;
  fgPct: number;
  twoPgm: number;
  twoPga: number;
  twoPct: number;
  threePgm: number;
  threePga: number;
  threePct: number;
  ftm: number;
  fta: number;
  ftPct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  pf: number;
  foulsCommitted: number;
  foulsDrawn: number;
  pts: number;
}

export interface FibaTeamBoxScore {
  name: string;
  code: string;
  players: FibaPlayerStatLine[];
  /** Parsed "Totals" row — exact team totals from PDF, not summed from players */
  totals: FibaTeamTotals | null;
  /** Total rebounds from the "Team/Coach" row (team rebounds excluded from player totals) */
  teamReb: number | null;
}

export interface FibaPeriodScore {
  period: number;
  homePoints: number;
  awayPoints: number;
}

export interface FibaScoringCheckpoint {
  /** Seconds elapsed since game start */
  elapsedSeconds: number;
  homeScore: number;
  awayScore: number;
}

export interface FibaGameFlowStats {
  pointsFromTurnovers: { home: number; away: number };
  pointsInPaint: { home: number; away: number };
  secondChancePoints: { home: number; away: number };
  fastBreakPoints: { home: number; away: number };
  benchPoints: { home: number; away: number };
  biggestLead: { home: number; away: number };
  biggestScoringRun: { homeFor: number; homeAgainst: number; awayFor: number; awayAgainst: number };
  leadChanges: number;
  timesTied: number;
  timeLeading: { home: string; away: string };
}

export interface FibaOfficialStats {
  format: "fiba_official_statistics_v1";
  score: {
    home: number;
    away: number;
  };
  /** Period-by-period scores parsed from the header line */
  periodScores: FibaPeriodScore[];
  /** Scoring at 5-minute intervals */
  scoringCheckpoints: FibaScoringCheckpoint[];
  /** Game-flow statistics from the bottom summary section */
  flow: FibaGameFlowStats | null;
  teams: [FibaTeamBoxScore, FibaTeamBoxScore];
  warnings: string[];
  confidence: number;
}

const TEAM_HEADER = /^(.+?)\s+\(([\p{Lu}\p{Nd}]{2,6})\)$/u;

function inferTeamCode(name: string): string {
  const code = [...name.replace(/[^\p{L}\p{N}]/gu, "")]
    .slice(0, 6)
    .join("")
    .toUpperCase();
  return code.length >= 2 ? code : "TEAM";
}

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

/**
 * Parse the remaining values after removing M/A and percentage tokens.
 * Returns the sequence of integer values found.
 */
function parseRemainingValues(stats: string): number[] {
  return [...stats.replace(MADE_ATTEMPT, " ").replace(/[+-]?\d+\.\d+/g, " ").matchAll(/[+-]?\d+/g)]
    .map((value) => Number(value[0]));
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
  const isStarter = match[1] === "*";

  if (!name || dnp) {
    return {
      jerseyNumber: numberOrZero(match[2]),
      name,
      secondsPlayed: null,
      dnp: true,
      isStarter,
      fgm: 0,
      fga: 0,
      twoPgm: 0,
      twoPga: 0,
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
      foulsCommitted: null,
      foulsDrawn: null,
      pts: 0,
      plusMinus: null,
    };
  }

  const stats = match[5] ?? "";
  const shooting = [...stats.matchAll(MADE_ATTEMPT)].map((attempt) => ({
    made: numberOrZero(attempt[1]),
    attempted: numberOrZero(attempt[2]),
  }));

  if (shooting.length < 4) return null;

  // shooting[0] = FG, [1] = 2P, [2] = 3P, [3] = FT
  // After these, the remaining values are: OREB DREB REB AST TOV STL BLK PF (C D +/- PTS)
  // C and D are only present when values.length >= 12 (FIBA standard)
  const values = parseRemainingValues(stats);
  if (values.length < 11) return null;

  const hasSeparateCAndD = values.length >= 12;
  // With C/D separate (12+ values):
  // values[7]=PF, [8]=C, [9]=D, [10]=+/-, [11]=PTS
  // Without C/D (11 values):
  // values[7]=PF, [8]=C+D combined?, [9]=+/-, [10]=PTS
  const plusMinusIndex = hasSeparateCAndD ? 10 : 9;
  const pointsIndex = plusMinusIndex + 1;

  return {
    jerseyNumber: numberOrZero(match[2]),
    name,
    secondsPlayed: toSeconds(minutes),
    dnp: false,
    isStarter,
    fgm: shooting[0]?.made ?? 0,
    fga: shooting[0]?.attempted ?? 0,
    twoPgm: shooting[1]?.made ?? 0,
    twoPga: shooting[1]?.attempted ?? 0,
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
    foulsCommitted: hasSeparateCAndD ? (values[8] ?? 0) : null,
    foulsDrawn: hasSeparateCAndD ? (values[9] ?? 0) : null,
    plusMinus: values[plusMinusIndex] ?? 0,
    pts: values[pointsIndex] ?? 0,
  };
}

/**
 * Parse the "Totals" row from a FIBA team stats table.
 * Format: "Totals FG_M/A FG% 2P_M/A 2P% 3P_M/A 3P% FT_M/A FT% OREB DREB REB AST TOV STL BLK PF C D PTS"
 */
function parseTeamTotalsRow(line: string): FibaTeamTotals | null {
  const trimmed = line.trim();
  if (!/^Totals\s/i.test(trimmed)) return null;

  const afterHeader = trimmed.replace(/^Totals\s+/i, "");
  const shooting = [...afterHeader.matchAll(MADE_ATTEMPT)].map((attempt) => ({
    made: numberOrZero(attempt[1]),
    attempted: numberOrZero(attempt[2]),
  }));

  if (shooting.length < 4) return null;

  const values = parseRemainingValues(afterHeader);
  // After shooting columns, values are: OREB DREB REB AST TOV STL BLK PF (C D PTS)
  if (values.length < 10) return null;

  // FIBA Totals row format: OREB DREB REB AST TOV STL BLK PF C D PTS = 11 values
  const hasCAndD = values.length >= 11;
  const ptsIndex = hasCAndD ? 10 : 9;
  const cIndex = hasCAndD ? 8 : null;
  const dIndex = hasCAndD ? 9 : null;

  return {
    fgm: shooting[0]?.made ?? 0,
    fga: shooting[0]?.attempted ?? 0,
    fgPct: shooting[0]?.made > 0 && shooting[0]?.attempted > 0
      ? Math.round((shooting[0].made / shooting[0].attempted) * 1000) / 10
      : 0,
    twoPgm: shooting[1]?.made ?? 0,
    twoPga: shooting[1]?.attempted ?? 0,
    twoPct: shooting[1]?.made > 0 && shooting[1]?.attempted > 0
      ? Math.round((shooting[1].made / shooting[1].attempted) * 1000) / 10
      : 0,
    threePgm: shooting[2]?.made ?? 0,
    threePga: shooting[2]?.attempted ?? 0,
    threePct: shooting[2]?.made > 0 && shooting[2]?.attempted > 0
      ? Math.round((shooting[2].made / shooting[2].attempted) * 1000) / 10
      : 0,
    ftm: shooting[3]?.made ?? 0,
    fta: shooting[3]?.attempted ?? 0,
    ftPct: shooting[3]?.made > 0 && shooting[3]?.attempted > 0
      ? Math.round((shooting[3].made / shooting[3].attempted) * 1000) / 10
      : 0,
    oreb: values[0] ?? 0,
    dreb: values[1] ?? 0,
    reb: values[2] ?? 0,
    ast: values[3] ?? 0,
    tov: values[4] ?? 0,
    stl: values[5] ?? 0,
    blk: values[6] ?? 0,
    pf: values[7] ?? 0,
    foulsCommitted: cIndex !== null ? (values[cIndex] ?? 0) : 0,
    foulsDrawn: dIndex !== null ? (values[dIndex] ?? 0) : 0,
    pts: values[ptsIndex] ?? 0,
  };
}

/**
 * Parse the "Team/Coach" row to extract team rebounds.
 * Format: "Team/Coach OREB DREB TOT ..."
 */
function parseTeamCoachRow(line: string): { oreb: number; dreb: number; reb: number } | null {
  const trimmed = line.trim();
  if (!/^Team\/Coach\s/i.test(trimmed)) return null;

  const afterHeader = trimmed.replace(/^Team\/Coach\s+/i, "");
  const values = parseRemainingValues(afterHeader);

  if (values.length < 3) return null;

  return {
    oreb: values[0] ?? 0,
    dreb: values[1] ?? 0,
    reb: values[2] ?? 0,
  };
}

/**
 * Parse period scores from a line like "(14-27, 4-24, 5-28, 8-31)"
 * or "(27-28, 21-23, 36-19, 11-25, 15-10)" for OT games.
 */
function parsePeriodScores(line: string): FibaPeriodScore[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("(") || !trimmed.endsWith(")")) return null;

  const inner = trimmed.slice(1, -1);
  const periods = inner.split(",").map((s) => s.trim());
  const scores: FibaPeriodScore[] = [];

  for (const [i, period] of periods.entries()) {
    const match = period.match(/^(\d{1,3})\s*-\s*(\d{1,3})$/);
    if (!match) return null;
    scores.push({
      period: i + 1,
      homePoints: numberOrZero(match[1]),
      awayPoints: numberOrZero(match[2]),
    });
  }

  return scores.length > 0 ? scores : null;
}

/**
 * Parse "Scoring by 5 minutes intervals" section.
 * Lines contain cumulative scores at each checkpoint for both teams.
 */
function parseScoringCheckpoints(lines: string[]): FibaScoringCheckpoint[] | null {
  const checkpointHeaderIndex = lines.findIndex(
    (l) => /scoring\s+by\s+5/i.test(l) || /scoring\s+by\s+minutes/i.test(l),
  );
  if (checkpointHeaderIndex === -1) return null;

  // The checkpoint table has rows for each team with cumulative scores at 5-min intervals
  // Expected format after header:
  //   TeamName  score1  score2  ...  scoreN
  //   OtherTeam score1  score2  ...  scoreN
  const dataLines = lines.slice(checkpointHeaderIndex + 1).filter((l) => l.trim().length > 0);
  if (dataLines.length < 2) return null;

  // Try to find two rows with numeric sequences
  const checkpointRows: number[][] = [];
  for (const dataLine of dataLines) {
    const values = [...dataLine.matchAll(/\b(\d{1,3})\b/g)].map((m) => Number(m[1]));
    // Should have at least 4 checkpoint values and the values shouldn't be tiny (not player stats)
    if (values.length >= 4 && values.some((v) => v > 10)) {
      checkpointRows.push(values);
    }
    if (checkpointRows.length >= 2) break;
  }

  if (checkpointRows.length < 2) return null;

  // Both rows should have the same number of checkpoints
  const homeCheckpoints = checkpointRows[0];
  const awayCheckpoints = checkpointRows[1];
  const count = Math.min(homeCheckpoints?.length ?? 0, awayCheckpoints?.length ?? 0);

  if (count < 4) return null;

  const checkpoints: FibaScoringCheckpoint[] = [];
  for (let i = 0; i < count; i++) {
    // Elapsed seconds: 5 min intervals = 300 seconds each
    checkpoints.push({
      elapsedSeconds: (i + 1) * 300,
      homeScore: homeCheckpoints?.[i] ?? 0,
      awayScore: awayCheckpoints?.[i] ?? 0,
    });
  }

  return checkpoints;
}

/**
 * Parse the game-flow summary section at the bottom of the FIBA PDF.
 */
function parseGameFlowSummary(lines: string[]): FibaGameFlowStats | null {
  const flowLines = lines.filter(
    (l) =>
      /points?\s+(in\s+the\s+paint|from\s+turnovers?|off\s+turnovers?)/i.test(l) ||
      /second\s+chance/i.test(l) ||
      /fast\s+break/i.test(l) ||
      /bench\s+points/i.test(l) ||
      /biggest\s+(lead|scoring\s+run)/i.test(l) ||
      /lead\s+changes/i.test(l) ||
      /times\s+tied/i.test(l) ||
      /time\s+leading/i.test(l),
  );

  if (flowLines.length === 0) return null;

  function extractTwoValues(line: string): [number, number] | null {
    const nums = [...line.matchAll(/\b(\d{1,4})\b/g)].map((m) => Number(m[1]));
    if (nums.length >= 2) return [nums[0], nums[1]];
    return null;
  }

  function extractSingleValue(line: string): number | null {
    const nums = [...line.matchAll(/\b(\d{1,4})\b/g)].map((m) => Number(m[1]));
    return nums.length >= 1 ? nums[0] : null;
  }

  const flow: Partial<FibaGameFlowStats> = {};
  let foundSomething = false;

  for (const line of flowLines) {
    if (/points?\s+(from\s+)?turnovers?\b/i.test(line)) {
      const v = extractTwoValues(line);
      if (v) { flow.pointsFromTurnovers = { home: v[0], away: v[1] }; foundSomething = true; }
    } else if (/points?\s+in\s+the\s+paint/i.test(line)) {
      const v = extractTwoValues(line);
      if (v) { flow.pointsInPaint = { home: v[0], away: v[1] }; foundSomething = true; }
    } else if (/second\s+chance\s+points/i.test(line)) {
      const v = extractTwoValues(line);
      if (v) { flow.secondChancePoints = { home: v[0], away: v[1] }; foundSomething = true; }
    } else if (/fast\s+break\s+points/i.test(line)) {
      const v = extractTwoValues(line);
      if (v) { flow.fastBreakPoints = { home: v[0], away: v[1] }; foundSomething = true; }
    } else if (/bench\s+points/i.test(line)) {
      const v = extractTwoValues(line);
      if (v) { flow.benchPoints = { home: v[0], away: v[1] }; foundSomething = true; }
    } else if (/biggest\s+lead/i.test(line)) {
      const v = extractTwoValues(line);
      if (v) { flow.biggestLead = { home: v[0], away: v[1] }; foundSomething = true; }
    } else if (/biggest\s+scoring\s+run/i.test(line)) {
      // Format: "Biggest scoring run 5-0 (14-27) 23-0 (18-63)"
      // Extract the run values from the first numbers in parens
      const parenMatches = [...line.matchAll(/\((\d{1,3})-(\d{1,3})\)/g)];
      if (parenMatches.length >= 2) {
        flow.biggestScoringRun = {
          homeFor: numberOrZero(parenMatches[0]?.[1]),
          homeAgainst: numberOrZero(parenMatches[0]?.[2]),
          awayFor: numberOrZero(parenMatches[1]?.[1]),
          awayAgainst: numberOrZero(parenMatches[1]?.[2]),
        };
        foundSomething = true;
      } else {
        // Fallback: extract raw run values from the line
        const runValues = [...line.matchAll(/(\d{1,3})-(\d{1,3})/g)];
        if (runValues.length >= 2) {
          flow.biggestScoringRun = {
            homeFor: numberOrZero(runValues[0]?.[1]),
            homeAgainst: numberOrZero(runValues[0]?.[2]),
            awayFor: numberOrZero(runValues[1]?.[1]),
            awayAgainst: numberOrZero(runValues[1]?.[2]),
          };
          foundSomething = true;
        }
      }
    } else if (/lead\s+changes/i.test(line)) {
      const v = extractSingleValue(line);
      if (v !== null) { flow.leadChanges = v; foundSomething = true; }
    } else if (/times\s+tied/i.test(line)) {
      const v = extractSingleValue(line);
      if (v !== null) { flow.timesTied = v; foundSomething = true; }
    } else if (/time\s+leading/i.test(line)) {
      // Extract MM:SS time values
      const times = [...line.matchAll(/(\d{1,2}:\d{2})/g)].map((m) => m[1]);
      if (times.length >= 2) {
        flow.timeLeading = { home: times[0], away: times[1] };
        foundSomething = true;
      }
    }
  }

  return foundSomething
    ? (flow as FibaGameFlowStats)
    : null;
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

  // Parse period scores from the line after the score line
  const scoreLineIndex = scoreLine !== undefined
    ? normalizedLines.indexOf(scoreLine)
    : -1;
  let periodScores: FibaPeriodScore[] = [];
  if (scoreLineIndex >= 0 && scoreLineIndex + 1 < normalizedLines.length) {
    const periodLine = normalizedLines[scoreLineIndex + 1];
    const parsed = parsePeriodScores(periodLine);
    if (parsed) {
      periodScores = parsed;
    }
  }

  const teams: FibaTeamBoxScore[] = [];
  let currentTeam: FibaTeamBoxScore | null = null;

  for (const [index, line] of normalizedLines.entries()) {
    const teamMatch = TEAM_HEADER.exec(line);
    const isUncodedTeamHeader: boolean =
      currentTeam !== null &&
      /^FG(?:\s|$)/.test(normalizedLines[index + 1] ?? "") &&
      /^No\. Name Min\b/.test(normalizedLines[index + 2] ?? "");
    const name: string | undefined =
      teamMatch?.[1] ?? (isUncodedTeamHeader ? line : undefined);
    const code = teamMatch?.[2] ?? (name ? inferTeamCode(name) : undefined);

    if (
      name &&
      code &&
      !/\bvs\b/i.test(line) &&
      !/^official statistics$/i.test(line)
    ) {
      const team: FibaTeamBoxScore = {
        name: name.trim(),
        code,
        players: [],
        totals: null,
        teamReb: null,
      };
      currentTeam = team;
      teams.push(team);
      continue;
    }

    if (!currentTeam) continue;

    // Check for Team/Coach and Totals rows
    if (/^Team\/Coach\s/i.test(line)) {
      const parsed = parseTeamCoachRow(line);
      if (parsed) {
        currentTeam.teamReb = parsed.reb;
      }
      continue;
    }

    if (/^Totals\s/i.test(line)) {
      const parsed = parseTeamTotalsRow(line);
      if (parsed) {
        currentTeam.totals = parsed;
      }
      continue;
    }

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

  // Parse game-flow summary from the bottom of the document
  const flow = parseGameFlowSummary(normalizedLines);

  // Parse scoring checkpoints
  const scoringCheckpoints = parseScoringCheckpoints(normalizedLines) ?? [];

  return {
    format: "fiba_official_statistics_v1",
    score: { home: homeScore, away: awayScore },
    periodScores,
    scoringCheckpoints,
    flow,
    teams: [homeTeam, awayTeam],
    warnings,
    confidence: warnings.length === 0 ? 0.98 : 0.75,
  };
}
