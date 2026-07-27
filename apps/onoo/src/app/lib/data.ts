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

import type { GameRoster, SportConfig, StatEvent } from "@onoo/core/types";
import { cache } from "react";
import { captureError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
// Import shared types for internal use + re-export for backward compatibility
import type {
  AthleteAffiliation,
  AthleteTimelineEvent,
  BoxScoreRow,
  ClassificationRound,
  CompetitionRow,
  GameWithTeams,
  HeadToHeadGame,
  HeadToHeadResult,
  LeaderRow,
  LineupStats,
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
  TournamentGroup,
  TournamentPhase,
} from "./shared";

import { orderScorebarGames, shiftDate } from "./shared";

export {
  formatDate,
  formatGameTime,
  formatMinutes,
  getDateRange,
  getUlaanbaatarDate,
  orderScorebarGames,
  shiftDate,
  statusLabel,
  statusVariant,
} from "./shared";
export type {
  AthleteAffiliation,
  AthleteTimelineEvent,
  BoxScoreRow,
  ClassificationRound,
  CompetitionRow,
  GameWithTeams,
  HeadToHeadGame,
  HeadToHeadResult,
  LeaderRow,
  LineupStats,
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
  TournamentGroup,
  TournamentPhase,
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
export const getGamesByDate = cache(
  async (dateStr: string): Promise<GameWithTeams[]> => {
    const supabase = await createClient();
    const start = `${dateStr}T00:00:00`;
    const end = `${dateStr}T23:59:59`;

    // Query both views in parallel — verified (v_public_games) and live/provisional (v_public_live_games)
    const [{ data: verified, error: err1 }, { data: live, error: err2 }] =
      await Promise.all([
        supabase
          .from("v_public_games")
          .select("*")
          .gte("scheduled_at", start)
          .lt("scheduled_at", end)
          .order("scheduled_at"),
        supabase
          .from("v_public_live_games")
          .select("*")
          .gte("scheduled_at", start)
          .lt("scheduled_at", end)
          .order("scheduled_at"),
      ]);

    if (err1) captureError("getGamesByDate/v_public_games", err1);
    if (err2) captureError("getGamesByDate/v_public_live_games", err2);

    const verifiedRows = (verified ?? []).map((r) =>
      mapGameRow(r as Record<string, unknown>),
    );
    const liveRows = (live ?? []).map((r) =>
      mapGameRow(r as Record<string, unknown>),
    );

    // Merge: verified takes priority for same id, live games fill the rest
    const seen = new Set(verifiedRows.map((g) => g.id));
    const merged = [
      ...verifiedRows,
      ...liveRows.filter((g) => !seen.has(g.id)),
    ];

    // Restore sort order by scheduled_at
    merged.sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    );
    return merged;
  },
);

export interface ScorebarStrip {
  /** Games for `activeDate`, ordered live → upcoming → finals. */
  games: GameWithTeams[];
  /** Date whose games are shown — `today`, or the fallback match day. */
  activeDate: string;
  /** True when today had no games and an earlier match day is shown instead. */
  isFallback: boolean;
}

/**
 * Games for the site-wide scorebar strip. Returns today's games; if today has
 * none, walks back up to 7 days to surface the most recent match day so the bar
 * is never empty during sparse schedules. Bounded to at most 8 lightweight
 * queries (1 in the common case).
 */
export async function getScorebarGames(today: string): Promise<ScorebarStrip> {
  const todayGames = await getGamesByDate(today);
  if (todayGames.length > 0) {
    return {
      games: orderScorebarGames(todayGames),
      activeDate: today,
      isFallback: false,
    };
  }
  for (let back = 1; back <= 7; back++) {
    const date = shiftDate(today, -back);
    const games = await getGamesByDate(date);
    if (games.length > 0) {
      return {
        games: orderScorebarGames(games),
        activeDate: date,
        isFallback: true,
      };
    }
  }
  return { games: [], activeDate: today, isFallback: false };
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
    .maybeSingle();

  if (!error && data) return mapGameRow(data as Record<string, unknown>);

  // Fall back to live/provisional view
  const { data: live, error: liveErr } = await supabase
    .from("v_public_live_games")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (liveErr || !live) return null;
  return mapGameRow(live as Record<string, unknown>);
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

export const getLeaders = cache(
  async (
    includeUnqualified = false,
    searchQuery?: string,
  ): Promise<LeaderRow[]> => {
    const supabase = await createClient();
    let query = supabase
      .from("v_public_leaders")
      .select("*")
      .order("pts", { ascending: false });

    if (!includeUnqualified) {
      query = query.eq("qualified", true);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      query = query.or(
        `player_name.ilike.%${searchQuery.trim()}%,player_name_latin.ilike.%${searchQuery.trim()}%`,
      );
    }

    const { data, error } = await query;
    if (error || !data) {
      captureError("getLeaders", error);
      return [];
    }
    return data.map((row: Record<string, unknown>) => mapLeaderRow(row));
  },
);

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
    social_links: Record<string, string>;
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

  const { data: teamRow } = await supabase
    .from("teams")
    .select("social_links")
    .eq("id", first.team_id)
    .single();
  const socialLinks =
    (teamRow?.social_links as Record<string, string> | null) ?? {};

  const team = {
    id: first.team_id,
    name: first.team_name,
    slug: first.team_slug,
    logo_url: null as string | null,
    primary_color: null as string | null,
    short_code: first.team_name.slice(0, 3).toUpperCase(),
    team_season_id: first.team_season_id,
    social_links: socialLinks,
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
  let gameQuery = supabase.from("games").select("id").eq("status", "official");

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
export async function getMvpRace(competitionId: string): Promise<MvpRaceRow[]> {
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
    const eff =
      gp > 0 ? (pts + reb + 1.5 * ast + 2 * stl + 2 * blk - tov) / gp : 0;

    return {
      player_id: row.player_id as string,
      canonical_name: row.player_name as string,
      team_short_code: row.team_short_code as string,
      photo_url:
        (row.player_photo_url as string | null) ??
        (row.photo_url as string | null),
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
    players: (playersRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: (row.canonical_name as string) ?? "",
      team: (row.team_name as string) ?? null,
      photo_url: (row.photo_url as string) ?? null,
    })),
    teams: (teamsRes.data ?? []).map((row: Record<string, unknown>) => ({
      slug: row.slug as string,
      name: (row.name as string) ?? "",
      short_code: (row.short_code as string) ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Live game helpers
// ---------------------------------------------------------------------------

/**
 * Convert public PlayByPlayRow rows to StatEvent format for the LiveGameCenter
 * client component. Fills missing DB-required fields with safe defaults.
 */
export function convertPlayByPlayToStatEvents(
  rows: PlayByPlayRow[],
): StatEvent[] {
  return rows.map((row) => ({
    id: row.event_id,
    game_id: row.game_id,
    operation_id: row.operation_id,
    local_seq: row.local_seq,
    event_type: row.event_type,
    period: row.period,
    clock_seconds: row.clock_seconds,
    team_season_id: row.team_season_id ?? "",
    player_id: row.player_id,
    payload: row.payload as Json,
    created_at: row.created_at,
    // Fields not exposed in the public view — safe defaults
    client_id: "",
    created_by: "",
    deleted_at: null,
    superseded_by: null,
    tracker_session_id: "",
    void_reason: null,
    voided_at: null,
    voided_by: null,
  }));
}

/** Fetch game roster entries for a given game. */
export async function getGameRosters(gameId: string): Promise<GameRoster[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_rosters")
    .select("*")
    .eq("game_id", gameId);

  if (error || !data) return [];
  return data as GameRoster[];
}

/** Build a player_id → canonical_name map from already-fetched game rosters. */
export async function getPlayerNameMap(
  rosters: { player_id: string }[],
): Promise<Record<string, string>> {
  if (!rosters || rosters.length === 0) return {};

  const supabase = await createClient();
  const playerIds = rosters.map((r) => r.player_id);
  const { data: players } = await supabase
    .from("players")
    .select("id, canonical_name")
    .in("id", playerIds);

  if (!players) return {};

  const map: Record<string, string> = {};
  for (const p of players) {
    map[p.id] = p.canonical_name ?? p.id.slice(0, 8);
  }
  return map;
}

/**
 * Get the sport config for a game by resolving its ruleset.
 * Returns null when the game has no ruleset or the rules are malformed.
 */
export async function getGameSportConfig(
  gameId: string,
): Promise<SportConfig | null> {
  const supabase = await createClient();

  // We need the ruleset_id from the raw games table
  const { data: game } = await supabase
    .from("games")
    .select("ruleset_id")
    .eq("id", gameId)
    .maybeSingle();

  if (!game?.ruleset_id) return null;

  const { data: ruleset } = await supabase
    .from("basketball_rulesets")
    .select("rules")
    .eq("id", game.ruleset_id)
    .maybeSingle();

  if (!ruleset?.rules) return null;

  // Attempt to parse as SportConfig
  const r = ruleset.rules as Record<string, unknown>;
  if (
    typeof r.periods === "number" &&
    typeof r.period_minutes === "number" &&
    typeof r.overtime_minutes === "number" &&
    typeof r.fouls_to_bonus === "number" &&
    typeof r.personal_foul_limit === "number" &&
    typeof r.players_on_court === "number"
  ) {
    return r as unknown as SportConfig;
  }
  return null;
}

/** Fetch all data needed by LiveGameCenter for a live game. */
export async function getLiveGameData(gameId: string): Promise<{
  events: StatEvent[];
  rosters: GameRoster[];
  sportConfig: SportConfig | null;
  playerNameMap: Record<string, string>;
}> {
  const [playByPlay, rosters] = await Promise.all([
    getPlayByPlay(gameId),
    getGameRosters(gameId),
  ]);

  const events = convertPlayByPlayToStatEvents(playByPlay);

  const [playerNameMap, sportConfig] = await Promise.all([
    getPlayerNameMap(rosters),
    getGameSportConfig(gameId),
  ]);

  return { events, rosters, sportConfig, playerNameMap };
}

// ---------------------------------------------------------------------------
// Team advanced stats (Phase 7 — Team performance dashboard)
// ---------------------------------------------------------------------------
import { calculateTeamAdvancedStats } from "@onoo/core/stats";
import type {
  TeamAdvancedStatsPerGame,
  TeamGameStatsRow,
  TeamSeasonAggregates,
} from "../lib/types/team-stats";

/**
 * Fetch per-game team advanced stats for a team season.
 * Computes ORtg, DRtg, NetRtg, Pace, eFG%, TOV%, OREB%, FTA Rate, PIE
 * for each game using @onoo/core pure functions.
 */
export async function getTeamGameStats(
  teamSeasonId: string,
): Promise<TeamAdvancedStatsPerGame[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_team_game_stats")
    .select("*")
    .eq("team_season_id", teamSeasonId)
    .order("scheduled_at", { ascending: true });

  if (error || !data) return [];

  return (data as unknown as TeamGameStatsRow[]).map((row) => {
    const teamStats = {
      pts: row.team_pts,
      fgm: row.team_fgm,
      fga: row.team_fga,
      tpm: row.team_tpm,
      tpa: row.team_tpa,
      ftm: row.team_ftm,
      fta: row.team_fta,
      oreb: row.team_oreb,
      dreb: row.team_dreb,
      ast: row.team_ast,
      stl: row.team_stl,
      blk: row.team_blk,
      tov: row.team_tov,
      pf: row.team_pf,
    };
    const oppStats = {
      pts: row.opp_pts,
      fgm: row.opp_fgm,
      fga: row.opp_fga,
      tpm: row.opp_tpm,
      tpa: row.opp_tpa,
      ftm: row.opp_ftm,
      fta: row.opp_fta,
      oreb: row.opp_oreb,
      dreb: row.opp_dreb,
      ast: row.opp_ast,
      stl: row.opp_stl,
      blk: row.opp_blk,
      tov: row.opp_tov,
      pf: row.opp_pf,
    };

    const adv = calculateTeamAdvancedStats(teamStats, oppStats);

    return {
      game_id: row.game_id,
      scheduled_at: row.scheduled_at,
      opponent_name: row.opp_team_name,
      opponent_slug: row.opp_team_slug,
      home_away: row.home_away,
      team_score: row.team_pts,
      opp_score: row.opp_pts,
      result: row.team_pts > row.opp_pts ? "W" : "L",
      ortg: Math.round(adv.ortg * 10) / 10,
      drtg: Math.round(adv.drtg * 10) / 10,
      net_rtg: Math.round(adv.netRtg * 10) / 10,
      pace: Math.round(adv.pace * 10) / 10,
      efg: Math.round(adv.efg * 1000) / 10,
      tov_pct: Math.round(adv.tovPct * 1000) / 10,
      oreb_pct: Math.round(adv.orebPct * 1000) / 10,
      fta_rate: Math.round(adv.ftaRate * 1000) / 10,
      pie: Math.round(adv.pie * 1000) / 10,
    };
  });
}

/**
 * Compute season aggregates from per-game advanced stats.
 */
export function aggregateTeamStats(
  games: TeamAdvancedStatsPerGame[],
): TeamSeasonAggregates {
  if (games.length === 0) {
    return {
      games_played: 0,
      avg_ortg: 0,
      avg_drtg: 0,
      avg_net_rtg: 0,
      avg_pace: 0,
      avg_efg: 0,
      avg_tov_pct: 0,
      avg_oreb_pct: 0,
      avg_fta_rate: 0,
      avg_pie: 0,
      wins: 0,
      losses: 0,
    };
  }

  const count = games.length;
  const wins = games.filter((g) => g.result === "W").length;
  const sum = (key: keyof TeamAdvancedStatsPerGame) =>
    games.reduce((acc, g) => acc + (g[key] as number), 0);

  return {
    games_played: count,
    avg_ortg: sum("ortg") / count,
    avg_drtg: sum("drtg") / count,
    avg_net_rtg: sum("net_rtg") / count,
    avg_pace: sum("pace") / count,
    avg_efg: sum("efg") / count,
    avg_tov_pct: sum("tov_pct") / count,
    avg_oreb_pct: sum("oreb_pct") / count,
    avg_fta_rate: sum("fta_rate") / count,
    avg_pie: sum("pie") / count,
    wins,
    losses: count - wins,
  };
}

// ---------------------------------------------------------------------------
// Player development (Phase 7 — Player development timeline)
// ---------------------------------------------------------------------------

export interface MonthlyStatRow {
  month: string; // "2026-01"
  monthLabel: string; // "2026 оны 1-р сар"
  gamesPlayed: number;
  avgPts: number;
  avgReb: number;
  avgAst: number;
  avgStl: number;
  avgBlk: number;
  avgTov: number;
  avgMpg: number;
  avgEff: number;
  fgp: number | null; // FG%
  tpp: number | null; // 3P%
  ftp: number | null; // FT%
}

/**
 * Aggregate a player's game log into monthly averages.
 * Groups by YYYY-MM, computes per-game averages for each stat.
 */
export function aggregateMonthlyStats(
  games: PlayerGameLine[],
): MonthlyStatRow[] {
  if (games.length === 0) return [];

  const months = new Map<string, PlayerGameLine[]>();

  for (const game of games) {
    const monthKey = game.game_date.slice(0, 7); // "2026-01"
    const existing = months.get(monthKey) ?? [];
    existing.push(game);
    months.set(monthKey, existing);
  }

  const monthNames: Record<string, string> = {
    "01": "1-р сар",
    "02": "2-р сар",
    "03": "3-р сар",
    "04": "4-р сар",
    "05": "5-р сар",
    "06": "6-р сар",
    "07": "7-р сар",
    "08": "8-р сар",
    "09": "9-р сар",
    "10": "10-р сар",
    "11": "11-р сар",
    "12": "12-р сар",
  };

  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, monthGames]) => {
      const count = monthGames.length;
      const year = monthKey.slice(0, 4);
      const monthNum = monthKey.slice(5, 7);
      const monthLabel = `${year} оны ${monthNames[monthNum] ?? monthNum}`;

      const sum = <K extends keyof PlayerGameLine>(key: K): number =>
        monthGames.reduce((acc, g) => acc + ((g[key] as number) ?? 0), 0);

      const avg = (val: number) => (count > 0 ? val / count : 0);
      const avgRounded = (val: number) => Math.round(avg(val) * 10) / 10;

      const totalPts = sum("pts");
      const totalReb = sum("oreb") + sum("dreb");
      const totalFgm = sum("fgm");
      const totalFga = sum("fga");
      const totalTpm = sum("tpm");
      const totalTpa = sum("tpa");
      const totalFtm = sum("ftm");
      const totalFta = sum("fta");
      const totalEff =
        totalPts +
        totalReb +
        1.5 * sum("ast") +
        2 * sum("stl") +
        2 * sum("blk") -
        sum("tov");

      return {
        month: monthKey,
        monthLabel,
        gamesPlayed: count,
        avgPts: avgRounded(totalPts),
        avgReb: avgRounded(totalReb),
        avgAst: avgRounded(sum("ast")),
        avgStl: avgRounded(sum("stl")),
        avgBlk: avgRounded(sum("blk")),
        avgTov: avgRounded(sum("tov")),
        avgMpg: avgRounded(sum("seconds_played") / 60),
        avgEff: avgRounded(totalEff),
        fgp:
          totalFga > 0 ? Math.round((totalFgm / totalFga) * 1000) / 10 : null,
        tpp:
          totalTpa > 0 ? Math.round((totalTpm / totalTpa) * 1000) / 10 : null,
        ftp:
          totalFta > 0 ? Math.round((totalFtm / totalFta) * 1000) / 10 : null,
      };
    });
}

// ---------------------------------------------------------------------------
// Canonical identity queries
// ---------------------------------------------------------------------------

/**
 * Fetch all affiliations for a canonical identity (player, student, etc.).
 * Returns an empty array if none exist or the query fails.
 */
export async function getAthleteAffiliations(
  canonicalIdentityId: string,
): Promise<AthleteAffiliation[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("cmd_get_athlete_affiliations", {
    p_canonical_identity_id: canonicalIdentityId,
  });
  return (data as AthleteAffiliation[]) ?? [];
}

/**
 * Look up a player's canonical identity ID. Returns null if the player
 * doesn't exist or has no canonical identity.
 */
export async function getPlayerCanonicalIdentity(
  playerId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("canonical_identity_id")
    .eq("id", playerId)
    .maybeSingle();
  return (data?.canonical_identity_id as string) ?? null;
}

/**
 * Fetch the timeline of events for a canonical identity (games, enrollments).
 * Events are ordered by date descending, limited to `limit` (default 10).
 */
export async function getAthleteTimeline(
  canonicalIdentityId: string,
  limit = 10,
): Promise<AthleteTimelineEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_athlete_timeline")
    .select("*")
    .eq("entity_id", canonicalIdentityId)
    .order("event_date", { ascending: false })
    .limit(limit);
  return (data as AthleteTimelineEvent[]) ?? [];
}

// ---------------------------------------------------------------------------
// Public Academy pages
// ---------------------------------------------------------------------------

export interface PublicAcademyProfile {
  id: string;
  organization_id: string;
  name: string;
  logo_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  timezone: string;
  settings: Record<string, unknown> | null;
}

export interface PublicAcademyProgram {
  id: string;
  academy_id: string;
  name: string;
  description: string | null;
  age_group: string | null;
  price_mnt: number | null;
  duration_weeks: number | null;
  is_active: boolean;
  location_id: string | null;
}

export interface PublicAcademyTrainer {
  id: string;
  name: string;
  photo_url: string | null;
  specialties: string[];
  bio: string | null;
}

export interface PublicAcademyLocation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  hours: string | null;
}

export interface PublicAcademyPageData {
  profile: PublicAcademyProfile | null;
  programs: PublicAcademyProgram[];
  trainers: PublicAcademyTrainer[];
  locations: PublicAcademyLocation[];
}

/**
 * Fetch academy profile data for public pages.
 * Uses server client with anon key — requires anon SELECT RLS policies.
 * Returns null if no academy exists (not yet set up via admin).
 */
export async function getPublicAcademyData(): Promise<PublicAcademyPageData> {
  const supabase = await createClient();

  const [profileResult, programsResult, trainersResult, locationsResult] =
    await Promise.all([
      supabase.from("academy_profiles").select("*").limit(1).maybeSingle(),
      supabase.from("academy_programs").select("*").eq("is_active", true),
      supabase.from("academy_trainers").select("*"),
      supabase.from("academy_locations").select("*"),
    ]);

  if (profileResult.error) {
    console.error("Failed to fetch academy profile:", profileResult.error);
  }
  const profile = profileResult.data as PublicAcademyProfile | null;

  return {
    profile,
    programs: (programsResult.data ?? []) as PublicAcademyProgram[],
    trainers: (trainersResult.data ?? []) as PublicAcademyTrainer[],
    locations: (locationsResult.data ?? []) as PublicAcademyLocation[],
  };
}

// ---------------------------------------------------------------------------
// Phase 12 — Competition list, head-to-head, lineups
// ---------------------------------------------------------------------------

/**
 * Fetch all competitions from v_public_standings with deduplication.
 * Returns an empty array if the query fails or no data exists.
 */
export async function getCompetitions(): Promise<CompetitionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_standings")
    .select("competition_id, competition_name, season_name, league_id");

  if (error || !data) {
    captureError("getCompetitions", error);
    return [];
  }

  const seen = new Set<string>();
  const rows: CompetitionRow[] = [];
  for (const row of data) {
    if (!seen.has(row.competition_id)) {
      seen.add(row.competition_id);
      rows.push({
        id: row.competition_id,
        name: row.competition_name,
        season: row.season_name,
        league: row.league_id,
      });
    }
  }
  return rows;
}

/**
 * Head-to-head record between two teams.
 * Returns null if either team cannot be resolved; otherwise returns the
 * matchup history with win counts even when no games are found.
 */
export async function getHeadToHead(
  teamAId: string,
  teamBId: string,
): Promise<HeadToHeadResult | null> {
  const supabase = await createClient();

  // Resolve team names in parallel
  const [teamAResult, teamBResult] = await Promise.all([
    supabase
      .from("v_public_standings")
      .select("team_name")
      .eq("team_id", teamAId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("v_public_standings")
      .select("team_name")
      .eq("team_id", teamBId)
      .limit(1)
      .maybeSingle(),
  ]);

  const teamAName = teamAResult.data?.team_name;
  const teamBName = teamBResult.data?.team_name;
  if (teamAResult.error || teamBResult.error || !teamAName || !teamBName) {
    if (teamAResult.error)
      captureError("getHeadToHead/teamA", teamAResult.error);
    if (teamBResult.error)
      captureError("getHeadToHead/teamB", teamBResult.error);
    return null;
  }

  // Fetch head-to-head games
  const { data: games, error } = await supabase
    .from("v_public_games")
    .select("*")
    .or(
      `and(home_team_id.eq.${teamAId},away_team_id.eq.${teamBId}),and(home_team_id.eq.${teamBId},away_team_id.eq.${teamAId})`,
    )
    .order("scheduled_at", { ascending: false });

  if (error) {
    captureError("getHeadToHead", error);
    return null;
  }

  let teamAWins = 0;
  let teamBWins = 0;
  const gameRows: HeadToHeadGame[] = (games ?? []).map((g) => {
    const row = g as Record<string, unknown>;
    const isTeamAHome = row.home_team_id === teamAId;
    const homeScore = row.home_score as number | null;
    const awayScore = row.away_score as number | null;
    const teamAScore = isTeamAHome ? homeScore : awayScore;
    const teamBScore = isTeamAHome ? awayScore : homeScore;

    if (teamAScore !== null && teamBScore !== null) {
      if (teamAScore > teamBScore) teamAWins++;
      else if (teamBScore > teamAScore) teamBWins++;
    }

    const winnerId =
      homeScore !== null && awayScore !== null
        ? isTeamAHome
          ? homeScore > awayScore
            ? teamAId
            : teamBId
          : awayScore > homeScore
            ? teamAId
            : teamBId
        : null;

    return {
      game_id: row.id as string,
      date: ((row.scheduled_at as string) ?? "").slice(0, 10),
      home_team_name: row.home_team_name as string,
      away_team_name: row.away_team_name as string,
      home_score: row.home_score as number | null,
      away_score: row.away_score as number | null,
      winner_id: winnerId,
    };
  });

  return {
    teamA_id: teamAId,
    teamA_name: teamAName,
    teamB_id: teamBId,
    teamB_name: teamBName,
    teamA_wins: teamAWins,
    teamB_wins: teamBWins,
    games: gameRows,
  };
}

/**
 * Fetch tournament phases for a competition.
 * Returns an empty array — stub awaiting DB schema for tournament tables.
 */
export async function getTournamentPhases(
  _competitionId: string,
): Promise<TournamentPhase[]> {
  return [];
}

/**
 * Fetch tournament groups for a competition.
 * Returns an empty array — stub awaiting DB schema for tournament tables.
 */
export async function getTournamentGroups(
  _competitionId: string,
): Promise<TournamentGroup[]> {
  return [];
}

/**
 * Fetch classification bracket rounds for a competition.
 * Returns an empty array — stub awaiting DB schema for classification tables.
 */
export async function getClassificationRounds(
  _competitionId: string,
): Promise<ClassificationRound[]> {
  return [];
}

/**
 * Fetch lineup statistics for a team season.
 * Returns an empty array — stub awaiting substitution event parsing.
 */
export async function getLineupsByTeam(
  _teamSeasonId: string,
): Promise<LineupStats[]> {
  return [];
}

/**
 * Quick view data for the standings team drawer — recent games, top leaders, next game.
 * Returns null if the team_season_id doesn't match any standings row.
 */
export async function getTeamQuickView(teamSeasonId: string): Promise<{
  recentGames: GameWithTeams[];
  leaders: LeaderRow[];
  nextGame: GameWithTeams | null;
} | null> {
  const supabase = await createClient();

  const { data: standing } = await supabase
    .from("v_public_standings")
    .select("team_id")
    .eq("team_season_id", teamSeasonId)
    .limit(1)
    .maybeSingle();

  if (!standing) return null;

  const today = new Date().toISOString().slice(0, 10);
  const teamId = standing.team_id;

  const [recentResult, leadersResult, nextResult] = await Promise.all([
    supabase
      .from("v_public_games")
      .select("*")
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .lt("scheduled_at", `${today}T23:59:59`)
      .order("scheduled_at", { ascending: false })
      .limit(5),
    supabase
      .from("v_public_leaders")
      .select("*")
      .eq("team_id", teamId)
      .order("pts", { ascending: false })
      .limit(3),
    supabase
      .from("v_public_games")
      .select("*")
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .gte("scheduled_at", `${today}T00:00:00`)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    recentGames: recentResult.data
      ? recentResult.data.map((row: Record<string, unknown>) => mapGameRow(row))
      : [],
    leaders: leadersResult.data
      ? leadersResult.data.map((row: Record<string, unknown>) =>
          mapLeaderRow(row),
        )
      : [],
    nextGame: nextResult.data
      ? mapGameRow(nextResult.data as Record<string, unknown>)
      : null,
  };
}

/**
 * Fetch recent finalized games for a team, ordered by scheduled_at descending.
 * Returns an empty array if the team_season_id doesn't match any standings row.
 */
export async function getTeamRecentGames(
  teamSeasonId: string,
  limit = 5,
): Promise<GameWithTeams[]> {
  const supabase = await createClient();

  const { data: standing } = await supabase
    .from("v_public_standings")
    .select("team_id")
    .eq("team_season_id", teamSeasonId)
    .limit(1)
    .maybeSingle();

  if (!standing) return [];

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("v_public_games")
    .select("*")
    .or(
      `home_team_id.eq.${standing.team_id},away_team_id.eq.${standing.team_id}`,
    )
    .lt("scheduled_at", `${today}T23:59:59`)
    .order("scheduled_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => mapGameRow(row));
}

/**
 * Fetch top scorers for a team by team_season_id, ordered by pts descending.
 * Returns an empty array if the query fails or no data exists.
 */
export async function getTeamTopScorers(
  teamSeasonId: string,
  limit = 3,
): Promise<LeaderRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_public_leaders")
    .select("*")
    .eq("team_season_id", teamSeasonId)
    .order("pts", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => mapLeaderRow(row));
}
