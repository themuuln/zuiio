/**
 * Basketball stats derivation engine.
 *
 * Pure TypeScript — no React / DOM / Supabase runtime.
 * Processes a pre-filtered (deleted_at == null) event stream into
 * per-player box-score lines, per-team aggregates, and home/away scores.
 */

import type {
  StatEvent,
  GameRoster,
  SportConfig,
  BoxScoreLine,
  TeamBoxScoreLine,
  DeriveWarning,
} from '../types';

// ---------------------------------------------------------------------------
// Payload shape helpers (stat_events.payload is Json)
// ---------------------------------------------------------------------------

interface ShotPayload {
  assisted_by?: string;
}

interface SubPayload {
  out_player_id: string;
  in_player_id: string;
}

/** Safely interpret payload as a plain object. */
function asObj(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Canonical ordering: period ↑, clock ↓, local_seq ↑
// ---------------------------------------------------------------------------

function canonicalSort(events: StatEvent[]): StatEvent[] {
  return [...events].sort((a, b) => {
    if (a.period !== b.period) return a.period - b.period;
    if (a.clock_seconds !== b.clock_seconds)
      return b.clock_seconds - a.clock_seconds;
    return a.local_seq - b.local_seq;
  });
}

// ---------------------------------------------------------------------------
// Line constructors
// ---------------------------------------------------------------------------

function emptyPlayerLine(
  playerId: string,
  teamSeasonId: string,
): BoxScoreLine {
  return {
    playerId,
    teamSeasonId,
    secondsPlayed: null,
    pts: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    oreb: 0,
    dreb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    pf: 0,
  };
}

function emptyTeamLine(teamSeasonId: string): TeamBoxScoreLine {
  return {
    teamSeasonId,
    pts: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    oreb: 0,
    dreb: 0,
    teamReb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    pf: 0,
  };
}

// ---------------------------------------------------------------------------
// Minutes helpers
// ---------------------------------------------------------------------------

/** Credit `seconds` to every player currently on court. */
function creditMinutes(
  onCourt: Map<string, Set<string>>,
  lines: Map<string, BoxScoreLine>,
  seconds: number,
): void {
  if (seconds <= 0) return;
  for (const players of onCourt.values()) {
    for (const pid of players) {
      const line = lines.get(pid);
      if (line) {
        line.secondsPlayed = (line.secondsPlayed ?? 0) + seconds;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Assist helper
// ---------------------------------------------------------------------------

function creditAssist(
  assisterId: string,
  event: StatEvent,
  playerLines: Map<string, BoxScoreLine>,
  playerTeam: Map<string, string>,
  warnings: DeriveWarning[],
): void {
  const existing = playerLines.get(assisterId);
  if (existing) {
    existing.ast += 1;
    return;
  }
  const tid = playerTeam.get(assisterId) ?? '';
  if (!tid) {
    warnings.push({
      eventId: event.id,
      message: `Assist: player ${assisterId} not in rosters`,
    });
  }
  const line = emptyPlayerLine(assisterId, tid);
  line.ast = 1;
  playerLines.set(assisterId, line);
}

// ---------------------------------------------------------------------------
// Event-type classification sets
// ---------------------------------------------------------------------------

/** Events that MUST have a player_id and produce stat increments. */
const PLAYER_STAT_EVENTS = new Set([
  'shot_2pt_made',
  'shot_2pt_missed',
  'shot_3pt_made',
  'shot_3pt_missed',
  'ft_made',
  'ft_missed',
  'rebound_off',
  'rebound_def',
  'steal',
  'block',
  'turnover',
  'foul_personal',
  'foul_technical',
]);

/** Team-level stat events (no individual player increment). */
const TEAM_STAT_EVENTS = new Set(['rebound_team']);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function deriveBoxScore(input: {
  events: StatEvent[];
  rosters: GameRoster[];
  sportConfig: SportConfig;
}): {
  players: BoxScoreLine[];
  teams: TeamBoxScoreLine[];
  homeAwayScore: { [teamSeasonId: string]: number };
  warnings: DeriveWarning[];
} {
  const { events, rosters, sportConfig } = input;
  const warnings: DeriveWarning[] = [];

  // -- Player → team lookup from rosters --------------------------------
  const playerTeam = new Map<string, string>();
  for (const r of rosters) {
    playerTeam.set(r.player_id, r.team_season_id);
  }

  // -- Seed one BoxScoreLine per rostered player ------------------------
  const playerLines = new Map<string, BoxScoreLine>();
  for (const r of rosters) {
    if (!playerLines.has(r.player_id)) {
      playerLines.set(
        r.player_id,
        emptyPlayerLine(r.player_id, r.team_season_id),
      );
    }
  }

  // -- Canonical event order --------------------------------------------
  const sorted = canonicalSort(events);

  // -- Time tracking is only possible when admin events exist -----------
  const hasTimeTracking = sorted.some(
    (e) => e.event_type === 'period_start' || e.event_type === 'substitution',
  );

  // -- On-court state: teamSeasonId → {playerIds} ----------------------
  const onCourt = new Map<string, Set<string>>();

  // Period-1 starters
  for (const r of rosters) {
    if (r.is_starter) {
      let set = onCourt.get(r.team_season_id);
      if (!set) {
        set = new Set();
        onCourt.set(r.team_season_id, set);
      }
      set.add(r.player_id);
    }
  }

  // -- Main processing loop ---------------------------------------------
  let currentPeriod = 0;
  let prevClock: number | null = null;

  for (const event of sorted) {
    const isNewPeriod = event.period !== currentPeriod;

    // ---- Period transition: flush remaining time from previous period
    if (isNewPeriod) {
      if (currentPeriod > 0 && hasTimeTracking && prevClock !== null) {
        creditMinutes(onCourt, playerLines, prevClock); // prevClock → 0
      }

      currentPeriod = event.period;

      // Starting clock for this period
      const isOvertime = event.period > sportConfig.periods;
      const periodLen = isOvertime
        ? sportConfig.overtime_minutes * 60
        : sportConfig.period_minutes * 60;

      prevClock =
        event.event_type === 'period_start'
          ? event.clock_seconds
          : periodLen;
    }

    // ---- Credit interval from previous event to this one
    if (
      hasTimeTracking &&
      prevClock !== null &&
      prevClock > event.clock_seconds
    ) {
      creditMinutes(onCourt, playerLines, prevClock - event.clock_seconds);
    }

    prevClock = event.clock_seconds;

    // ---- Substitution ----
    if (event.event_type === 'substitution') {
      if (!event.team_season_id) {
        warnings.push({
          eventId: event.id,
          message: 'Substitution missing team_season_id',
        });
        continue;
      }

      const teamSet = onCourt.get(event.team_season_id);
      if (teamSet) {
        const p = asObj(event.payload) as unknown as SubPayload;
        const outId =
          typeof p.out_player_id === 'string' ? p.out_player_id : null;
        const inId =
          typeof p.in_player_id === 'string' ? p.in_player_id : null;

        if (outId && teamSet.has(outId)) {
          teamSet.delete(outId);
        } else if (outId) {
          warnings.push({
            eventId: event.id,
            message: `Sub out: player ${outId} not on court`,
          });
        }
        if (inId) teamSet.add(inId);
      }
      continue;
    }

    // ---- Admin / period_start: timeline only, no stats ----
    if (event.event_type === 'period_start') continue;

    // ---- Team-only stat (no player increment) ----
    if (TEAM_STAT_EVENTS.has(event.event_type)) continue;

    // ---- Player stat increments ----
    const pid = event.player_id;

    if (PLAYER_STAT_EVENTS.has(event.event_type) && !pid) {
      warnings.push({
        eventId: event.id,
        message: `${event.event_type} missing player_id`,
      });
      continue;
    }

    if (!pid) continue; // unknown event without player — no-op

    // Ensure a line exists for this player
    if (!playerLines.has(pid)) {
      const tid = event.team_season_id ?? playerTeam.get(pid) ?? '';
      if (!tid) {
        warnings.push({
          eventId: event.id,
          message: `Player ${pid} not in rosters`,
        });
      }
      playerLines.set(pid, emptyPlayerLine(pid, tid));
    }

    const line = playerLines.get(pid)!;
    const p = asObj(event.payload);

    switch (event.event_type) {
      case 'shot_2pt_made':
        line.pts += 2;
        line.fgm += 1;
        line.fga += 1;
        if (typeof p.assisted_by === 'string') {
          creditAssist(p.assisted_by, event, playerLines, playerTeam, warnings);
        }
        break;

      case 'shot_2pt_missed':
        line.fga += 1;
        break;

      case 'shot_3pt_made':
        line.pts += 3;
        line.fgm += 1;
        line.fga += 1;
        line.tpm += 1;
        line.tpa += 1;
        if (typeof p.assisted_by === 'string') {
          creditAssist(p.assisted_by, event, playerLines, playerTeam, warnings);
        }
        break;

      case 'shot_3pt_missed':
        line.fga += 1;
        line.tpa += 1;
        break;

      case 'ft_made':
        line.pts += 1;
        line.ftm += 1;
        line.fta += 1;
        break;

      case 'ft_missed':
        line.fta += 1;
        break;

      case 'rebound_off':
        line.oreb += 1;
        break;

      case 'rebound_def':
        line.dreb += 1;
        break;

      case 'steal':
        line.stl += 1;
        break;

      case 'block':
        line.blk += 1;
        break;

      case 'turnover':
        line.tov += 1;
        break;

      case 'foul_personal':
      case 'foul_technical':
        line.pf += 1;
        break;

      default:
        break; // unknown event types are no-ops
    }
  }

  // -- Flush remaining time in the last active period -------------------
  if (hasTimeTracking && prevClock !== null && currentPeriod > 0) {
    creditMinutes(onCourt, playerLines, prevClock);
  }

  // -- No time-tracking events → all seconds_played null ----------------
  if (!hasTimeTracking) {
    for (const line of playerLines.values()) {
      line.secondsPlayed = null;
    }
  }

  // -----------------------------------------------------------------
  // Build team lines
  // -----------------------------------------------------------------

  const teamIds = new Set<string>();
  for (const r of rosters) teamIds.add(r.team_season_id);
  for (const line of playerLines.values()) {
    if (line.teamSeasonId) teamIds.add(line.teamSeasonId);
  }

  const teamLineMap = new Map<string, TeamBoxScoreLine>();
  for (const tid of teamIds) {
    teamLineMap.set(tid, emptyTeamLine(tid));
  }

  // Aggregate player lines into team lines
  for (const line of playerLines.values()) {
    const tl = teamLineMap.get(line.teamSeasonId);
    if (!tl) continue;
    tl.pts += line.pts;
    tl.fgm += line.fgm;
    tl.fga += line.fga;
    tl.tpm += line.tpm;
    tl.tpa += line.tpa;
    tl.ftm += line.ftm;
    tl.fta += line.fta;
    tl.oreb += line.oreb;
    tl.dreb += line.dreb;
    tl.ast += line.ast;
    tl.stl += line.stl;
    tl.blk += line.blk;
    tl.tov += line.tov;
    tl.pf += line.pf;
  }

  // Add team_reb from rebound_team events
  for (const event of sorted) {
    if (event.event_type === 'rebound_team' && event.team_season_id) {
      const tl = teamLineMap.get(event.team_season_id);
      if (tl) tl.teamReb += 1;
    }
  }

  // -----------------------------------------------------------------
  // homeAwayScore — accumulated from the same pts increments
  // (never tracked separately)
  // -----------------------------------------------------------------

  const homeAwayScore: { [teamSeasonId: string]: number } = {};
  for (const tl of teamLineMap.values()) {
    homeAwayScore[tl.teamSeasonId] = tl.pts;
  }

  return {
    players: Array.from(playerLines.values()),
    teams: Array.from(teamLineMap.values()),
    homeAwayScore,
    warnings,
  };
}
