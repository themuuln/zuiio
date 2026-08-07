/**
 * Data layer for the search & browse page (Phase 3 — T-3.8).
 *
 * Searches across players, teams, and games from curated v_public_* views.
 * Results are grouped by type for the client-side search results display.
 */
import { createClient } from "@/lib/supabase/server";
import type { GameWithTeams, PlayerDirectoryRow, StandingRow } from "./shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResults {
  players: PlayerDirectoryRow[];
  teams: StandingRow[];
  games: GameWithTeams[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cast a raw v_public_games row to GameWithTeams with backward-compatible aliases. */
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

/** Cast a raw v_public_standings row to StandingRow with backward-compatible aliases. */
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

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Search across players, teams, and games by keyword.
 * Returns an empty result set when the query is blank or no matches exist.
 *
 * - Players: matched by name (Mongolian or Latin) from v_public_player_directory
 * - Teams: matched by name from v_public_standings
 * - Games: matched by home/away team name from v_public_games
 */
export async function searchAll(query: string): Promise<SearchResults> {
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
      ? teamsRes.data.map((row) =>
          mapStandingRow(row as Record<string, unknown>),
        )
      : [],
    games: gamesRes.data
      ? gamesRes.data.map((row) => mapGameRow(row as Record<string, unknown>))
      : [],
  };
}
