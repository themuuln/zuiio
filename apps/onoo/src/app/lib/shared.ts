/**
 * Shared types and pure helper functions for Onoo public pages.
 *
 * This module intentionally avoids importing from `@/lib/supabase/server` or
 * any server-only API (`next/headers`, `next/cache`, etc.) so it can be safely
 * imported from both Server Components and Client Components without triggering
 * Turbopack's server-module-in-client-module diagnostic.
 */
import type {
  Game,
  GamePlayerStats,
  GameStatus,
  Player,
  SeasonPlayerStats,
  Standings,
  Team,
  Venue,
} from "../../../packages/core/src/types/index";

export type {
  Game,
  GamePlayerStats,
  GameStatus,
  Player,
  SeasonPlayerStats,
  Standings,
  Team,
  Venue,
};

// ---------------------------------------------------------------------------
// View-row types (match v_public_* column names exactly)
// ---------------------------------------------------------------------------

export type GameWithTeams = Game & {
  home_team_season_id: string;
  home_team_name: string;
  home_team_short_code: string;
  home_team_logo_url: string | null;
  away_team_season_id: string;
  away_team_name: string;
  away_team_short_code: string;
  away_team_logo_url: string | null;
  venue_name: string;
  competition_name: string;
  season_id: string;
  season_name: string;
  league_id: string;
  league_name: string;
  league_slug: string;
  revision_id: string;
  revision_number: number;
  revision_approved_at: string;
  source_submission_id: string;
  source_type: string;
  evidence_url: string | null;
  source_reviewer_id: string;
  source_reviewed_at: string;
  // Backward-compatible aliases for pages using old mock field names
  home_name: string;
  home_short: string;
  home_color: string | null;
  away_name: string;
  away_short: string;
  away_color: string | null;
  venue_city: string | null;
  is_provisional: boolean;
  home_team_primary_color: string | null;
  away_team_primary_color: string | null;
  home_team_slug: string;
  away_team_slug: string;
  home_team_id: string;
  home_score: number | null;
  stream_url: string | null;
  away_score: number | null;
};

export type StandingRow = {
  competition_id: string;
  competition_name: string;
  season_id: string;
  season_name: string;
  league_id: string;
  league_slug: string;
  team_season_id: string;
  team_id: string;
  team_name: string;
  team_slug: string;
  team_logo_url: string | null;
  wins: number;
  losses: number;
  win_pct: number;
  gb: number | null;
  streak: string | null;
  last10: string | null;
  points_for: number | null;
  points_against: number | null;
  // Backward-compatible aliases
  w: number;
  l: number;
  team_short: string;
  team_color: string | null;
  team_short_code: string;
  team_primary_color: string | null;
};

export type LeaderRow = {
  competition_id: string;
  competition_name: string;
  season_id: string;
  league_id: string;
  player_id: string;
  player_name: string;
  player_name_latin: string | null;
  player_position: string | null;
  team_season_id: string;
  team_id: string;
  team_name: string;
  gp: number;
  mpg: number | null;
  pts: number | null;
  fgm: number | null;
  fga: number | null;
  tpm: number | null;
  tpa: number | null;
  ftm: number | null;
  fta: number | null;
  oreb: number | null;
  dreb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
  pf: number | null;
  avg_plus_minus: number | null;
  avg_fouls_drawn: number | null;
  // Backward-compatible aliases
  player_latin: string | null;
  team_short: string;
  team_color: string | null;
  seconds_played: number | null;
  player_photo_url: string | null;
  team_primary_color: string | null;
  team_logo_url: string | null;
  team_short_code: string;
  photo_url: string | null;
  points_per_game: number | null;
  rebounds_per_game: number | null;
  assists_per_game: number | null;
  team_slug: string;
  games_played: number | null;
  qualified: boolean;
  team_games_played: number;
};

export type PlayerDirectoryRow = {
  player_id: string;
  player_name: string;
  player_name_latin: string | null;
  player_position: string | null;
  photo_url: string | null;
  team_name: string;
  team_slug: string;
  team_short_code: string;
  team_logo_url: string | null;
  team_primary_color: string | null;
  games_played: number | null;
  points_per_game: number | null;
  rebounds_per_game: number | null;
  assists_per_game: number | null;
};

export type BoxScoreRow = {
  game_id: string;
  revision_id: string;
  revision_number: number;
  revision_approved_at: string;
  player_id: string;
  player_name: string;
  player_name_latin: string | null;
  player_position: string | null;
  team_season_id: string;
  team_id: string;
  team_name: string;
  jersey_number: number | null;
  seconds_played: number | null;
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
  source_type: string;
  evidence_url: string | null;
  source_reviewed_at: string;
  plus_minus: number | null;
  fouls_committed: number | null;
  fouls_drawn: number | null;
  is_starter: boolean;
  dnp_reason: string | null;
  // Backward-compatible alias
  team_short: string;
};

export interface PlayerGameLine extends BoxScoreRow {
  game_date: string;
  opponent_name: string;
  opponent_short_code: string;
  opponent_logo_url: string | null;
  team_score: number;
  opponent_score: number;
  result: "W" | "L";
  is_home: boolean;
}

export interface TeamGameStatsRow {
  game_id: string;
  team_season_id: string;
  team_name: string;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  team_reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  fouls_committed: number;
  fouls_drawn: number;
  points_from_turnovers: number | null;
  points_in_paint: number | null;
  second_chance_points: number | null;
  fast_break_points: number | null;
  bench_points: number | null;
  biggest_lead: number | null;
  biggest_scoring_run_for: number | null;
  biggest_scoring_run_against: number | null;
  time_leading_seconds: number | null;
  opponent_pts: number;
  opponent_fgm: number;
  opponent_fga: number;
  opponent_tpm: number;
  opponent_tpa: number;
  opponent_ftm: number;
  opponent_fta: number;
  opponent_oreb: number;
  opponent_dreb: number;
  opponent_team_reb: number;
  opponent_ast: number;
  opponent_stl: number;
  opponent_blk: number;
  opponent_tov: number;
  opponent_pf: number;
}

export interface PeriodScoreRow {
  game_id: string;
  period: number;
  home_points: number;
  away_points: number;
}

export interface ScoringCheckpointRow {
  game_id: string;
  elapsed_seconds: number;
  home_score: number;
  away_score: number;
}

export interface GameSummaryRow {
  game_id: string;
  lead_changes: number | null;
  times_tied: number | null;
}

export type TeamRosterRow = {
  team_season_id: string;
  competition_id: string;
  team_id: string;
  team_name: string;
  team_slug: string;
  roster_entry_id: string;
  jersey_number: number | null;
  roster_position: string | null;
  player_id: string;
  player_name: string;
  player_name_latin: string | null;
  player_position: string | null;
  photo_url: string | null;
  // Backward-compatible aliases
  id: string;
  canonical_name: string;
  name_latin: string | null;
  position: string | null;
};

export type PlayerProfileRow = {
  player_id: string;
  player_name: string;
  player_name_latin: string | null;
  dob: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  player_position: string | null;
  nationality: string;
  photo_url: string | null;
  social_links: Record<string, string>;
  team_season_id: string;
  team_id: string;
  team_name: string;
  team_slug: string;
  team_logo_url: string | null;
  competition_id: string;
  competition_name: string;
  season_id: string;
  season_name: string;
  league_id: string;
  league_name: string;
  league_slug: string;
  jersey_number: number | null;
  games_played: number;
  minutes_per_game: number | null;
  points_per_game: number | null;
  fgm_per_game: number | null;
  fga_per_game: number | null;
  tpm_per_game: number | null;
  tpa_per_game: number | null;
  ftm_per_game: number | null;
  ftp_per_game: number | null;
  oreb_per_game: number | null;
  dreb_per_game: number | null;
  ast_per_game: number | null;
  stl_per_game: number | null;
  blk_per_game: number | null;
  tov_per_game: number | null;
  pf_per_game: number | null;
  // Backward-compatible aliases (pages use these from old mock data)
  canonical_name: string;
  name_latin: string | null;
  position: string | null;
};

export type PlayByPlayRow = {
  game_id: string;
  event_id: string;
  operation_id: string;
  local_seq: number;
  event_type: string;
  period: number;
  clock_seconds: number;
  team_season_id: string;
  team_name: string;
  player_id: string | null;
  player_name: string | null;
  player_name_latin: string | null;
  jersey_number: number | null;
  payload: unknown;
  created_at: string;
};

export interface SearchAllResult {
  players: PlayerDirectoryRow[];
  teams: StandingRow[];
  games: GameWithTeams[];
}
export type MvpRaceRow = {
  player_id: string;
  canonical_name: string;
  team_short_code: string;
  photo_url: string | null;
  eff: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  gp: number;
  team_primary_color: string | null;
  team_slug: string;
};

export type PlayerAwardRow = {
  id: string;
  award_type: string;
  period_start: string | null;
  period_end: string | null;
  granted_at: string;
  note: string | null;
  player_name: string;
  player_id: string;
  competition_name: string;
  competition_id: string;
};
// Aggregated made/attempted counts per half-court zone for a player.
// Rows come from v_public_shot_zones; zone_key matches CourtHeatmap zone ids.
export type ShotZoneStat = {
  player_id: string;
  team_season_id: string | null;
  competition_id: string | null;
  zone_key: string;
  made: number;
  attempted: number;
};

/** Format a Date to YYYY-MM-DD in Asia/Ulaanbaatar timezone. */
export function formatDateULAT(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
  });
}

// ---------------------------------------------------------------------------
// Pure helper functions (no server-side imports)
// ---------------------------------------------------------------------------

/** Return today's date string in Asia/Ulaanbaatar timezone (UTC+8). */
export async function getUlaanbaatarDate(): Promise<string> {
  const { connection } = await import("next/server");
  await connection();
  return formatDateULAT(new Date());
}

/** Shift a YYYY-MM-DD date string by `days` calendar days, returning YYYY-MM-DD. */
export function shiftDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Rolling window of date strings for the scorebar's date pills. Defaults to the
 * 2 previous days, today, and the next 5 days (8 total). Pure — no DB access.
 */
export function getDateRange(
  today: string,
  { past = 2, future = 5 }: { past?: number; future?: number } = {},
): string[] {
  const dates: string[] = [];
  for (let offset = -past; offset <= future; offset++) {
    dates.push(shiftDate(today, offset));
  }
  return dates;
}

// Sort weight for the scorebar strip: live first, upcoming next, finals last.
const SCOREBAR_STATUS_RANK: Record<string, number> = {
  live_provisional: 0,
  scheduled: 1,
  postponed: 1,
  final_pending_review: 2,
  league_verified: 2,
  official: 2,
  cancelled: 3,
};

/** Order games for the scorebar strip: live → upcoming → finals, then by time. */
export function orderScorebarGames(games: GameWithTeams[]): GameWithTeams[] {
  return [...games].sort((a, b) => {
    const rankA = SCOREBAR_STATUS_RANK[a.status] ?? 2;
    const rankB = SCOREBAR_STATUS_RANK[b.status] ?? 2;
    if (rankA !== rankB) return rankA - rankB;
    return a.scheduled_at.localeCompare(b.scheduled_at);
  });
}

export function formatGameTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ulaanbaatar",
  });
}

export function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatMinutes(seconds: number | null): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: "Товлосон",
    live_provisional: "Шууд",
    final_pending_review: "Дууссан",
    league_verified: "Баталгаажуулсан",
    official: "Албан ёсны",
    cancelled: "Цуцалсан",
    postponed: "Хойшлогдсон",
  };
  return labels[status] ?? status;
}

export function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "live_provisional") return "destructive";
  if (status === "final_pending_review" || status === "league_verified")
    return "secondary";
  return "outline";
}
export type {
  TeamAdvancedStatsPerGame,
  TeamSeasonAggregates,
} from "./types/team-stats";

// ---------------------------------------------------------------------------
// Canonical identity types
// ---------------------------------------------------------------------------

export interface AthleteAffiliation {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  source: string;
}

export interface AthleteTimelineEvent {
  event_type: string;
  entity_id: string;
  event_id: string;
  event_date: string;
  competition_name: string | null;
  player_team_name: string | null;
  opponent_name: string | null;
  home_score: number | null;
  away_score: number | null;
  pts: number | null;
  assists: number | null;
  total_rebounds: number | null;
  program_name: string | null;
  event_label: string | null;
}

// ---------------------------------------------------------------------------
// Phase 12 types
// ---------------------------------------------------------------------------

export interface CompetitionRow {
  id: string;
  name: string;
  season?: string;
  league?: string;
}

export interface HeadToHeadGame {
  game_id: string;
  date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  winner_id: string | null;
}

export interface HeadToHeadResult {
  teamA_id: string;
  teamA_name: string;
  teamB_id: string;
  teamB_name: string;
  teamA_wins: number;
  teamB_wins: number;
  games: HeadToHeadGame[];
}

export interface TournamentPhase {
  id: string;
  name: string;
  type: "group" | "knockout" | "classification";
  order: number;
}

export interface TournamentGroupTeam {
  team_id: string;
  team_name: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
}

export interface TournamentGroup {
  id: string;
  name: string;
  teams: TournamentGroupTeam[];
}

export interface ClassificationGame {
  home_team_name: string;
  home_score: number | null;
  away_team_name: string;
  away_score: number | null;
}

export interface ClassificationRound {
  round: string;
  games: ClassificationGame[];
}

export interface LineupStats {
  player_ids: string[];
  player_names: string[];
  games_count: number;
  minutes_total: number;
  net_rating: number;
  plus_minus: number;
}
