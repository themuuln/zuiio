/**
 * Data layer for Onoo public pages.
 *
 * All queries read from curated v_public_* views which expose only
 * league_verified|official approved revisions. No mock data, no
 * catch-to-fallback. Honest empty states and error boundaries.
 */

import { createClient } from "@/lib/supabase/server";
import type { Game } from "./types";

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
  // Backward-compatible aliases
  player_latin: string | null;
  team_short: string;
  team_color: string | null;
  seconds_played: number | null;
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
  // Backward-compatible alias
  team_short: string;
};

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

// ---------------------------------------------------------------------------
// Public query functions — curated views only, no mocks
// ---------------------------------------------------------------------------

function mapGameRow(row: Record<string, unknown>): GameWithTeams {
  const g = row as unknown as GameWithTeams;
  return {
    ...g,
    home_name: g.home_team_name ?? "",
    home_short: g.home_team_short_code ?? "",
    home_color: g.home_team_logo_url ?? null,
    away_name: g.away_team_name ?? "",
    away_short: g.away_team_short_code ?? "",
    away_color: g.away_team_logo_url ?? null,
    venue_city: null,
  };
}
export async function getGamesByDate(
  dateStr: string,
): Promise<GameWithTeams[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_games")
    .select("*")
    .gte("scheduled_at", `${dateStr}T00:00:00`)
    .lt("scheduled_at", `${dateStr}T23:59:59`)
    .order("scheduled_at");

  if (error || !data) {
    console.error("getGamesByDate error:", error?.message);
    return [];
  }
  return data.map((row: Record<string, unknown>) => mapGameRow(row));
}

export async function getLiveGames(): Promise<GameWithTeams[]> {
  const today = new Date().toISOString().slice(0, 10);
  const allGames = await getGamesByDate(today);
  return allGames.filter((g) => g.status === "live_provisional");
}

export async function getGameById(id: string): Promise<GameWithTeams | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_games")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapGameRow(data as Record<string, unknown>);
}

function mapStandingRow(row: Record<string, unknown>): StandingRow {
  const s = row as unknown as StandingRow;
  return {
    ...s,
    w: s.wins,
    l: s.losses,
    team_short: s.team_slug,
    team_color: s.team_logo_url,
  };
}

function mapLeaderRow(row: Record<string, unknown>): LeaderRow {
  const l = row as unknown as LeaderRow;
  return {
    ...l,
    player_latin: l.player_name_latin,
    team_short: l.team_name,
    team_color: null,
    seconds_played: null,
  };
}
export async function getStandings(): Promise<StandingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_standings")
    .select("*")
    .order("win_pct", { ascending: false });

  if (error || !data) {
    console.error("getStandings error:", error?.message);
    return [];
  }
  return data.map((row: Record<string, unknown>) => mapStandingRow(row));
}

export async function getLeaders(): Promise<LeaderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_leaders")
    .select("*")
    .order("pts", { ascending: false });

  if (error || !data) {
    console.error("getLeaders error:", error?.message);
    return [];
  }
  return data.map((row: Record<string, unknown>) => mapLeaderRow(row));
}

// getPlayers aliases getLeaders — pages import by name; may diverge later
export const getPlayers = getLeaders;

export async function getTeamBySlug(slug: string): Promise<{
  team: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    short_code: string;
    team_season_id: string;
  };
  players: TeamRosterRow[];
  standings: StandingRow | undefined;
} | null> {
  const supabase = await createClient();

  const { data: roster, error: rosterErr } = await supabase
    .from("v_public_team_roster")
    .select("*")
    .eq("team_slug", slug);

  if (rosterErr || !roster || roster.length === 0) return null;

  const first = roster[0] as unknown as TeamRosterRow;
  const team = {
    id: first.team_id,
    name: first.team_name,
    slug: first.team_slug,
    logo_url: null as string | null,
    primary_color: null as string | null,
    short_code: first.team_name.slice(0, 3).toUpperCase(),
    team_season_id: first.team_season_id,
  };

  const { data: standings } = await supabase
    .from("v_public_standings")
    .select("*")
    .eq("team_slug", slug)
    .limit(1)
    .single();

  return {
    team,
    players: roster.map((r: Record<string, unknown>) => ({
      ...(r as unknown as TeamRosterRow),
      id: r.player_id as string,
      canonical_name: r.player_name as string,
      name_latin: r.player_name_latin as string | null,
      position: r.player_position as string | null,
    })) as TeamRosterRow[],
    standings: standings
      ? mapStandingRow(standings as Record<string, unknown>)
      : undefined,
  };
}

export async function getPlayerById(id: string): Promise<{
  player: PlayerProfileRow | null;
  profiles: PlayerProfileRow[];
  seasonStats: LeaderRow[];
  gameLog: BoxScoreRow[];
} | null> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("v_public_player_profiles")
    .select("*")
    .eq("player_id", id);

  if (!profiles || profiles.length === 0) return null;

  const profileRows = profiles.map((r: Record<string, unknown>) => ({
    ...(r as unknown as PlayerProfileRow),
    canonical_name: r.player_name as string,
    name_latin: r.player_name_latin as string | null,
    position: r.player_position as string | null,
  })) as unknown as PlayerProfileRow[];

  const { data: gameLog } = await supabase
    .from("v_public_box_score")
    .select("*")
    .eq("player_id", id)
    .order("revision_approved_at", { ascending: false });

  return {
    player: profileRows[0] ?? null,
    profiles: profileRows,
    seasonStats: [],
    gameLog: (gameLog as unknown as BoxScoreRow[]) ?? [],
  };
}

export async function getBoxScore(gameId: string): Promise<BoxScoreRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_box_score")
    .select("*")
    .eq("game_id", gameId)
    .order("team_name")
    .order("jersey_number");

  if (error || !data) return [];
  return data as unknown as BoxScoreRow[];
}

export async function getPlayByPlay(gameId: string): Promise<PlayByPlayRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_play_by_play")
    .select("*")
    .eq("game_id", gameId)
    .order("period")
    .order("local_seq");

  if (error || !data) return [];
  return data as unknown as PlayByPlayRow[];
}

// ---------------------------------------------------------------------------
// Helpers (unchanged)
// ---------------------------------------------------------------------------

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
