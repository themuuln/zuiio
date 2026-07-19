/**
 * Data layer for Onoo public pages.
 *
 * All queries read from curated v_public_* views which expose only
 * league_verified|official approved revisions. No mock data, no
 * catch-to-fallback. Honest empty states and error boundaries.
 *
 * Shared types and pure helpers live in ./shared and are re-exported here
 * for backward compatibility. Prefer importing directly from ./shared in
 * new code to avoid pulling server-only imports into client bundles.
 */

import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/errors";
// Import shared types for internal use + re-export for backward compatibility
import type {
  BoxScoreRow,
  GameWithTeams,
  LeaderRow,
  MvpRaceRow,
  PlayByPlayRow,
  PlayerAwardRow,
  PlayerDirectoryRow,
  PlayerGameLine,
  PlayerProfileRow,
  SearchAllResult,
  ShotZoneStat,
  StandingRow,
  TeamRosterRow,
} from "./shared";

export {
  formatDate,
  formatGameTime,
  formatMinutes,
  getUlaanbaatarDate,
  statusLabel,
  statusVariant,
} from "./shared";
export type {
  BoxScoreRow,
  GameWithTeams,
  LeaderRow,
  MvpRaceRow,
  PlayByPlayRow,
  PlayerAwardRow,
  PlayerDirectoryRow,
  PlayerGameLine,
  PlayerProfileRow,
  SearchAllResult,
  ShotZoneStat,
  StandingRow,
  TeamRosterRow,
};

/** Return recent finalized games (most recent first), limited to `limit`. */
export async function getRecentGames(limit = 4): Promise<GameWithTeams[]> {
  const today = new Date().toISOString().slice(0, 10);
  const allGames = await getGamesByDate(today);
  return allGames
    .filter((g) => g.status === "official" || g.status === "league_verified")
    .slice(0, limit);
}

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
    captureError("getGamesByDate", error);
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
    qualified: Boolean(l.qualified),
    team_games_played: Number(l.team_games_played) || 0,
  };
}
export async function getStandings(): Promise<StandingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_standings")
    .select("*")
    .order("win_pct", { ascending: false });
  if (error || !data) {
    captureError("getStandings", error);
    return [];
  }
  return data.map((row: Record<string, unknown>) => mapStandingRow(row));
}

export async function getLeaders(
  includeUnqualified = false,
): Promise<LeaderRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("v_public_leaders")
    .select("*")
    .order("pts", { ascending: false });

  if (!includeUnqualified) {
    query = query.eq("qualified", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    captureError("getLeaders", error);
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
  leaders: LeaderRow[];
  recentGames: GameWithTeams[];
  upcomingGames: GameWithTeams[];
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

  // Run standings, leaders, and games queries in parallel
  const today = new Date().toISOString().slice(0, 10);
  const [standingsResult, leadersResult, recentResult, upcomingResult] =
    await Promise.all([
      supabase
        .from("v_public_standings")
        .select("*")
        .eq("team_slug", slug)
        .limit(1)
        .single(),
      supabase
        .from("v_public_leaders")
        .select("*")
        .eq("team_id", team.id)
        .order("pts", { ascending: false }),
      supabase
        .from("v_public_games")
        .select("*")
        .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
        .lt("scheduled_at", `${today}T23:59:59`)
        .order("scheduled_at", { ascending: false })
        .limit(8),
      supabase
        .from("v_public_games")
        .select("*")
        .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
        .gte("scheduled_at", `${today}T00:00:00`)
        .order("scheduled_at", { ascending: true })
        .limit(8),
    ]);

  return {
    team,
    players: roster.map((r: Record<string, unknown>) => ({
      ...(r as unknown as TeamRosterRow),
      id: r.player_id as string,
      canonical_name: r.player_name as string,
      name_latin: r.player_name_latin as string | null,
      position: r.player_position as string | null,
    })) as TeamRosterRow[],
    standings: standingsResult.data
      ? mapStandingRow(standingsResult.data as Record<string, unknown>)
      : undefined,
    leaders: leadersResult.data
      ? leadersResult.data.map((row: Record<string, unknown>) =>
          mapLeaderRow(row),
        )
      : [],
    recentGames: recentResult.data
      ? recentResult.data.map((row: Record<string, unknown>) => mapGameRow(row))
      : [],
    upcomingGames: upcomingResult.data
      ? upcomingResult.data.map((row: Record<string, unknown>) =>
          mapGameRow(row),
        )
      : [],
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
        is_home: isHomeTeam,
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

export async function getPlayerShotZones(
  playerId: string,
  competitionId: string,
): Promise<ShotZoneStat[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_public_shot_zones")
    .select("zone_key, made, attempted")
    .eq("player_id", playerId)
    .eq("competition_id", competitionId)
    .order("zone_key");

  if (error || !data) return [];
  return data as unknown as ShotZoneStat[];
}
/**
 * Fetch individual shot data points with x/y coordinates from stat_events.
 * Used for scatter overlay on the court heatmap.
 */
export async function getPlayerShotScatter(
  playerId: string,
  competitionId?: string | null,
): Promise<
  Array<{
    x: number;
    y: number;
    made: boolean;
    shot_type: string;
    game_id: string;
    period: number;
  }>
> {
  const supabase = await createClient();

  // Get game IDs for this competition
  let gameQuery = supabase
    .from("games")
    .select("id")
    .eq("status", "official");

  if (competitionId) {
    gameQuery = gameQuery.eq("competition_id", competitionId);
  }

  const { data: games } = await gameQuery;
  if (!games || games.length === 0) return [];

  const gameIds = games.map((g) => g.id);

  // Fetch shot events with coordinates
  const { data: events } = await supabase
    .from("stat_events")
    .select("game_id, event_type, period, payload")
    .eq("player_id", playerId)
    .in("game_id", gameIds)
    .in("event_type", [
      "shot_2pt_made",
      "shot_2pt_missed",
      "shot_3pt_made",
      "shot_3pt_missed",
    ])
    .is("deleted_at", null);

  if (!events) return [];

  return events
    .filter((e) => {
      const payload = e.payload as Record<string, unknown>;
      return typeof payload.x === "number" && typeof payload.y === "number";
    })
    .map((e) => {
      const payload = e.payload as Record<string, unknown>;
      return {
        x: payload.x as number,
        y: payload.y as number,
        made: e.event_type.includes("_made"),
        shot_type: (payload.shot_type as string) || "jump",
        game_id: e.game_id,
        period: e.period,
      };
    });
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
// Awards & MVP Race
// ---------------------------------------------------------------------------

/**
 * Compute MVP race top 5 for a competition.
 * EFF = pts + reb + 1.5×ast + 2×stl + 2×blk − tov per game.
 * Returns top 5 qualified players ranked by EFF.
 */
export async function getMvpRace(
  competitionId: string,
): Promise<MvpRaceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_leaders")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("qualified", true);

  if (error || !data) return [];

  const rows = (data as Record<string, unknown>[]).map((row) => {
    const pts = (row.pts as number) ?? 0;
    const reb = ((row.oreb as number) ?? 0) + ((row.dreb as number) ?? 0);
    const ast = (row.ast as number) ?? 0;
    const stl = (row.stl as number) ?? 0;
    const blk = (row.blk as number) ?? 0;
    const tov = (row.tov as number) ?? 0;
    const gp = (row.gp as number) ?? 0;
    const eff = gp > 0
      ? (pts + reb + 1.5 * ast + 2 * stl + 2 * blk - tov) / gp
      : 0;

    return {
      player_id: row.player_id as string,
      canonical_name: row.player_name as string,
      team_short_code: row.team_short_code as string,
      photo_url: (row.player_photo_url as string | null) ?? (row.photo_url as string | null),
      eff: Math.round(eff * 10) / 10,
      pts,
      reb,
      ast,
      stl,
      blk,
      tov,
      gp,
      team_primary_color: row.team_primary_color as string | null,
      team_slug: row.team_slug as string,
    } satisfies MvpRaceRow;
  });

  rows.sort((a, b) => b.eff - a.eff);
  return rows.slice(0, 5);
}

/**
 * Fetch public awards for a player from v_public_awards.
 */
export async function getPlayerAwards(
  playerId: string,
): Promise<PlayerAwardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_awards")
    .select("*")
    .eq("player_id", playerId)
    .order("granted_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as PlayerAwardRow[];
}
// ---------------------------------------------------------------------------
// Tournament Hub
// ---------------------------------------------------------------------------

/**
 * Fetch a single competition's details from v_public_standings.
 * Returns null if the competition ID doesn't match any rows.
 */
export async function getCompetition(competitionId: string): Promise<{
  id: string;
  name: string;
  season: string;
  league: string;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_standings")
    .select("competition_id, competition_name, season_name, league_id")
    .eq("competition_id", competitionId)
    .limit(1)
    .single();

  if (error || !data) return null;
  return {
    id: data.competition_id,
    name: data.competition_name,
    season: data.season_name,
    league: data.league_id,
  };
}
// ---------------------------------------------------------------------------
// Global search
// ---------------------------------------------------------------------------

export async function searchAll(query: string): Promise<SearchAllResult> {
  const q = query.trim();
  if (q.length === 0) return { players: [], teams: [], games: [] };

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const [playersRes, teamsRes, gamesRes] = await Promise.all([
    supabase
      .from("v_public_player_directory")
      .select("*")
      .or(
        `player_name.ilike.${pattern},player_name_latin.ilike.${pattern},team_name.ilike.${pattern}`,
      )
      .order("points_per_game", { ascending: false })
      .limit(20),
    supabase
      .from("v_public_standings")
      .select("*")
      .ilike("team_name", pattern)
      .order("win_pct", { ascending: false })
      .limit(10),
    supabase
      .from("v_public_games")
      .select("*")
      .or(`home_team_name.ilike.${pattern},away_team_name.ilike.${pattern}`)
      .order("scheduled_at", { ascending: false })
      .limit(10),
  ]);

  return {
    players: playersRes.data
      ? (playersRes.data as unknown as PlayerDirectoryRow[])
      : [],
    teams: teamsRes.data
      ? teamsRes.data.map((row: Record<string, unknown>) => mapStandingRow(row))
      : [],
    games: gamesRes.data
      ? gamesRes.data.map((row: Record<string, unknown>) => mapGameRow(row))
      : [],
  };
}
// ---------------------------------------------------------------------------
// Quick search for command palette
// ---------------------------------------------------------------------------

export interface SearchResultPlayer {
  id: string;
  name: string;
  team: string | null;
  photo_url: string | null;
}

export interface SearchResultTeam {
  slug: string;
  name: string;
  short_code: string | null;
}

export interface SearchResult {
  players: SearchResultPlayer[];
  teams: SearchResultTeam[];
}

export async function searchPlayersAndTeams(
  query: string,
): Promise<SearchResult> {
  const q = query.trim();
  if (q.length < 2) return { players: [], teams: [] };

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const [playersRes, teamsRes] = await Promise.all([
    supabase
      .from("v_public_players")
      .select("id, canonical_name, name_latin, photo_url, team_name")
      .or(`canonical_name.ilike.${pattern},name_latin.ilike.${pattern}`)
      .limit(8),
    supabase
      .from("teams")
      .select("slug, name, short_code")
      .or(`name.ilike.${pattern},short_code.ilike.${pattern}`)
      .limit(4),
  ]);

  return {
    players: (playersRes.data ?? []).map(
      (row: Record<string, unknown>) => ({
        id: row.id as string,
        name: (row.canonical_name as string) ?? "",
        team: (row.team_name as string) ?? null,
        photo_url: (row.photo_url as string) ?? null,
      }),
    ),
    teams: (teamsRes.data ?? []).map((row: Record<string, unknown>) => ({
      slug: row.slug as string,
      name: (row.name as string) ?? "",
      short_code: (row.short_code as string) ?? null,
    })),
  };
}
