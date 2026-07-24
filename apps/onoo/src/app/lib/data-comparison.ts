/**
 * Data layer for player comparison (Phase 3 — T-3.6).
 *
 * Queries v_public_leaders for per-game stats and season totals, then
 * computes per-game averages, percentages, and simplified advanced metrics.
 * Advanced stats (PIE, ORtg, DRtg) use team-level box-score data from
 * v_public_team_game_stats when available.
 */

import {
  calculateDRtg,
  calculateORtg,
  calculatePIE,
  calculatePossessions,
} from "@onoo/core";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerComparison {
  player_id: string;
  name: string;
  photo_url: string | null;
  games_played: number;
  stats: {
    ppg: number;
    apg: number;
    rpg: number;
    spg: number;
    bpg: number;
    fg_pct: number;
    three_p_pct: number;
    ft_pct: number;
    pie: number;
    ortg: number;
    drtg: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RawLeaderRow {
  player_id: string;
  player_name: string;
  photo_url: string | null;
  gp: number;
  pts: number | null;
  oreb: number | null;
  dreb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  fgm: number | null;
  fga: number | null;
  tpm: number | null;
  tpa: number | null;
  ftm: number | null;
  fta: number | null;
  tov: number | null;
  pf: number | null;
  team_season_id: string | null;
  team_id: string | null;
  team_name: string;
  team_slug: string;
}

/** Round to one decimal place. */
function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/**
 * Fetch detailed comparison stats for a single player.
 * Returns null when the player has no verified stats.
 */
export async function getPlayerComparison(
  playerId: string,
): Promise<PlayerComparison | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_public_leaders")
    .select("*")
    .eq("player_id", playerId)
    .order("gp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as RawLeaderRow;
  const gp = row.gp ?? 0;

  if (gp <= 0) return null;

  // Per-game averages (these fields are already per-game in v_public_leaders)
  const ppg = row.pts ?? 0;
  const apg = row.ast ?? 0;
  const rpg = (row.oreb ?? 0) + (row.dreb ?? 0);
  const spg = row.stl ?? 0;
  const bpg = row.blk ?? 0;

  // Season totals for percentages and advanced stats
  const fgm = row.fgm ?? 0;
  const fga = row.fga ?? 0;
  const tpm = row.tpm ?? 0;
  const tpa = row.tpa ?? 0;
  const ftm = row.ftm ?? 0;
  const fta = row.fta ?? 0;
  const tovTotal = row.tov ?? 0;
  const pfTotal = row.pf ?? 0;

  // Shooting percentages (ratio is same whether totals or per-game)
  const fgPct = fga > 0 ? (fgm / fga) * 100 : 0;
  const threePPct = tpa > 0 ? (tpm / tpa) * 100 : 0;
  const ftPct = fta > 0 ? (ftm / fta) * 100 : 0;

  // Per-game values for contribution-based metrics
  const fgmPg = gp > 0 ? fgm / gp : 0;
  const fgaPg = gp > 0 ? fga / gp : 0;
  const ftmPg = gp > 0 ? ftm / gp : 0;
  const ftaPg = gp > 0 ? fta / gp : 0;
  const tovPg = gp > 0 ? tovTotal / gp : 0;
  const pfPg = gp > 0 ? pfTotal / gp : 0;

  // Simplified PIE — per-game contribution score using the same component
  // formula as the team-level calculatePIE from @onoo/core, adapted to a
  // single player's per-game averages. Higher = more positive impact.
  const pie =
    ppg +
    fgmPg +
    ftmPg -
    fgaPg -
    ftaPg +
    (row.dreb ?? 0) +
    0.5 * (row.oreb ?? 0) +
    apg +
    spg +
    0.5 * bpg -
    pfPg -
    tovPg;

  // Simplified ORtg — points per 100 scoring possessions used.
  // Uses season totals for possessions; total points = ppg * gp.
  const totalPts = ppg * gp;
  const totalPoss = fga + 0.44 * fta + tovTotal;
  const ortg = totalPoss > 0 ? (totalPts / totalPoss) * 100 : 0;

  // DRtg — average team defensive rating when available
  let drtg = 0;
  if (row.team_season_id) {
    drtg = await computeTeamDRtg(row.team_season_id);
  }

  return {
    player_id: row.player_id,
    name: row.player_name,
    photo_url: row.photo_url,
    games_played: gp,
    stats: {
      ppg: r1(ppg),
      apg: r1(apg),
      rpg: r1(rpg),
      spg: r1(spg),
      bpg: r1(bpg),
      fg_pct: r1(fgPct),
      three_p_pct: r1(threePPct),
      ft_pct: r1(ftPct),
      pie: r1(Math.max(pie, 0)),
      ortg: r1(Math.max(ortg, 0)),
      drtg: r1(Math.max(drtg, 0)),
    },
  };
}

/**
 * Compute average team DRtg across all games for a team season.
 * Uses @onoo/core calculateDRtg with data from v_public_team_game_stats.
 * Returns 0 when no game data exists.
 */
async function computeTeamDRtg(teamSeasonId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_public_team_game_stats")
    .select("*")
    .eq("team_season_id", teamSeasonId);

  if (error || !data || data.length === 0) return 0;

  let totalDrtg = 0;
  let count = 0;

  for (const raw of data) {
    const g = raw as Record<string, unknown>;
    const oppStats = {
      pts: (g.opp_pts as number) ?? 0,
      fgm: (g.opp_fgm as number) ?? 0,
      fga: (g.opp_fga as number) ?? 0,
      tpm: (g.opp_tpm as number) ?? 0,
      tpa: (g.opp_tpa as number) ?? 0,
      ftm: (g.opp_ftm as number) ?? 0,
      fta: (g.opp_fta as number) ?? 0,
      oreb: (g.opp_oreb as number) ?? 0,
      dreb: (g.opp_dreb as number) ?? 0,
      ast: (g.opp_ast as number) ?? 0,
      stl: (g.opp_stl as number) ?? 0,
      blk: (g.opp_blk as number) ?? 0,
      tov: (g.opp_tov as number) ?? 0,
      pf: (g.opp_pf as number) ?? 0,
    };

    const oppPoss = calculatePossessions(oppStats);
    totalDrtg += calculateDRtg(oppStats, oppPoss);
    count++;
  }

  return count > 0 ? totalDrtg / count : 0;
}

// ---------------------------------------------------------------------------
// Player search for the comparison UI
// ---------------------------------------------------------------------------

/**
 * Search for players by name (Mongolian or Latin).
 * Returns basic id/name pairs for the comparison selector dropdown.
 */
export async function searchPlayers(
  query: string,
): Promise<Array<{ id: string; name: string }>> {
  const q = query.trim();
  if (q.length === 0) return [];

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const { data, error } = await supabase
    .from("v_public_player_directory")
    .select("player_id, player_name, team_name")
    .or(`player_name.ilike.${pattern},player_name_latin.ilike.${pattern}`)
    .order("points_per_game", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return (
    data as Array<{
      player_id: string;
      player_name: string;
      team_name: string;
    }>
  ).map((row) => ({
    id: row.player_id,
    name: `${row.player_name} · ${row.team_name}`,
  }));
}
