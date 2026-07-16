/**
 * Data layer for Onoo public pages.
 *
 * All queries read from curated v_public_* views which expose only
 * league_verified|official approved revisions. No mock data, no
 * catch-to-fallback. Honest empty states and error boundaries.
 */

import { createClient } from "@/lib/supabase/server";
import type { Game } from "./types";

/** Return today's date string in Asia/Ulaanbaatar timezone (UTC+8). */
export function getUlaanbaatarDate(): string {
  return new Date()
    .toLocaleDateString("sv-SE", { timeZone: "Asia/Ulaanbaatar" });
}

/** Return recent finalized games (most recent first), limited to `limit`. */
export async function getRecentGames(
  limit = 4,
): Promise<GameWithTeams[]> {
  const today = new Date().toISOString().slice(0, 10);
  const allGames = await getGamesByDate(today);
  return allGames
    .filter((g) => g.status === "official" || g.status === "league_verified")
    .slice(0, limit);
}

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

export async function getPlayerGameLog(
  playerId: string,
  competitionId?: string | null,
): Promise<PlayerGameLine[]> {
  const supabase = await createClient();
  const { data: boxScore, error: boxScoreError } = await supabase
    .from("v_public_box_score")
    .select("*")
    .eq("player_id", playerId);

  if (boxScoreError || !boxScore || boxScore.length === 0) return [];

  const stats = boxScore as unknown as BoxScoreRow[];
  let gamesQuery = supabase
    .from("v_public_games")
    .select("*")
    .in(
      "id",
      stats.map((line) => line.game_id),
    );

  if (competitionId)
    gamesQuery = gamesQuery.eq("competition_id", competitionId);

  const { data: games, error: gamesError } = await gamesQuery.order(
    "scheduled_at",
    { ascending: true },
  );

  if (gamesError || !games || games.length === 0) return [];

  const gamesById = new Map(
    games.map((row: Record<string, unknown>) => {
      const game = mapGameRow(row);
      return [game.id, game] as const;
    }),
  );

  return stats.flatMap((line) => {
    const game = gamesById.get(line.game_id);
    if (!game) return [];

    const isHomeTeam = line.team_season_id === game.home_team_season_id;
    const teamScore = (isHomeTeam ? game.home_score : game.away_score) ?? 0;
    const opponentScore = (isHomeTeam ? game.away_score : game.home_score) ?? 0;

    return [
      {
        ...line,
        game_date: game.scheduled_at,
        opponent_name: isHomeTeam ? game.away_team_name : game.home_team_name,
        opponent_short_code: isHomeTeam
          ? game.away_team_short_code
          : game.home_team_short_code,
        opponent_logo_url: isHomeTeam
          ? game.away_team_logo_url
          : game.home_team_logo_url,
        team_score: teamScore,
        opponent_score: opponentScore,
        result: teamScore > opponentScore ? "W" : "L",
      },
    ];
  });
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
export async function getPlayerShootingProfile(
  playerId: string,
  competitionId: string,
): Promise<{
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_public_leaders")
    .select("fgm, fga, tpm, tpa, ftm, fta")
    .eq("player_id", playerId)
    .eq("competition_id", competitionId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    fgm: (data.fgm as number) ?? 0,
    fga: (data.fga as number) ?? 0,
    tpm: (data.tpm as number) ?? 0,
    tpa: (data.tpa as number) ?? 0,
    ftm: (data.ftm as number) ?? 0,
    fta: (data.fta as number) ?? 0,
  };
}

export async function getPlayerSeasonAverages(
  playerId: string,
  competitionId: string,
): Promise<{
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_leaders")
    .select("pts, oreb, dreb, ast, stl, blk")
    .eq("player_id", playerId)
    .eq("competition_id", competitionId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ppg: data.pts ?? 0,
    rpg: (data.oreb ?? 0) + (data.dreb ?? 0),
    apg: data.ast ?? 0,
    spg: data.stl ?? 0,
    bpg: data.blk ?? 0,
  };
}

export async function getLeagueAverages(competitionId: string): Promise<{
  averages: { pts: number; reb: number; ast: number; stl: number; blk: number };
  maxes: { pts: number; reb: number; ast: number; stl: number; blk: number };
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_leaders")
    .select("pts, oreb, dreb, ast, stl, blk, gp")
    .eq("competition_id", competitionId)
    .gte("gp", 5); // TODO(3.4): use official qualified flag when Task 3.4 lands

  if (error || !data || data.length === 0) {
    return {
      averages: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 },
      maxes: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 },
    };
  }

  const rows = data as Array<{
    pts: number | null;
    oreb: number | null;
    dreb: number | null;
    ast: number | null;
    stl: number | null;
    blk: number | null;
    gp: number;
  }>;

  const stats = rows.map((r) => ({
    pts: r.pts ?? 0,
    reb: (r.oreb ?? 0) + (r.dreb ?? 0),
    ast: r.ast ?? 0,
    stl: r.stl ?? 0,
    blk: r.blk ?? 0,
  }));

  const n = stats.length;
  const sum = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 };
  const max = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 };

  for (const s of stats) {
    sum.pts += s.pts;
    sum.reb += s.reb;
    sum.ast += s.ast;
    sum.stl += s.stl;
    sum.blk += s.blk;
    if (s.pts > max.pts) max.pts = s.pts;
    if (s.reb > max.reb) max.reb = s.reb;
    if (s.ast > max.ast) max.ast = s.ast;
    if (s.stl > max.stl) max.stl = s.stl;
    if (s.blk > max.blk) max.blk = s.blk;
  }

  return {
    averages: {
      pts: Math.round((sum.pts / n) * 10) / 10,
      reb: Math.round((sum.reb / n) * 10) / 10,
      ast: Math.round((sum.ast / n) * 10) / 10,
      stl: Math.round((sum.stl / n) * 10) / 10,
      blk: Math.round((sum.blk / n) * 10) / 10,
    },
    maxes: max,
  };
}

export async function getPlayerCompetitions(playerId: string): Promise<
  Array<{
    competition_id: string;
    competition_name: string;
    season_name: string;
    league_name: string;
  }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_player_profiles")
    .select("competition_id, competition_name, season_name, league_name")
    .eq("player_id", playerId);

  if (error || !data || data.length === 0) return [];

  const seen = new Set<string>();
  const results: Array<{
    competition_id: string;
    competition_name: string;
    season_name: string;
    league_name: string;
  }> = [];

  for (const row of data) {
    if (!seen.has(row.competition_id)) {
      seen.add(row.competition_id);
      results.push({
        competition_id: row.competition_id,
        competition_name: row.competition_name,
        season_name: row.season_name,
        league_name: row.league_name,
      });
    }
  }

  results.sort((a, b) => b.season_name.localeCompare(a.season_name));
  return results;
}

export async function getPlayerCareerTotals(playerId: string): Promise<{
  gp: number;
  pts: number;
  reb: number;
  ast: number;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_leaders")
    .select("gp, pts, oreb, dreb, ast")
    .eq("player_id", playerId);

  if (error || !data || data.length === 0) return null;

  let gp = 0;
  let pts = 0;
  let reb = 0;
  let ast = 0;
  for (const row of data) {
    gp += (row.gp as number) ?? 0;
    pts += (row.pts as number) ?? 0;
    reb += ((row.oreb as number) ?? 0) + ((row.dreb as number) ?? 0);
    ast += (row.ast as number) ?? 0;
  }

  return { gp, pts, reb, ast };
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
