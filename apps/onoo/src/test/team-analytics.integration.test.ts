/**
 * Integration tests for Phase 7 team analytics data layer.
 *
 * Tests game_player_stats schema and aggregation, season_player_stats
 * viability, the v_athlete_timeline player development view, and
 * v_public_team_game_stats column definitions. All queries operate
 * on seed data from supabase/seed.sql.
 *
 * Run: pnpm test:integration
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_COMPETITION_ID,
  SEED_HOME_PLAYER,
  SEED_HOME_TEAM_SEASON,
} from "./seed-constants";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
} from "./setup-integration";

let pool: Pool;
let client: PoolClient;

// Game 001: Khuleguud (home) vs an away opponent, status = official, has game_player_stats
const SEED_GAME_ID = "70000000-0000-0000-0000-000000000001";

beforeAll(async () => {
  pool = await getPool();
  client = await pool.connect();
});

afterAll(async () => {
  if (client) client.release();
  await closePool();
});

// ── Schema: game_player_stats ─────────────────────────────────────────────

describe("game_player_stats schema", () => {
  it("has game_player_stats table with expected columns", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'game_player_stats'
       ORDER BY ordinal_position`,
    );
    const colNames = rows.map((r: { column_name: string }) => r.column_name);

    // Key columns
    expect(colNames).toContain("game_id");
    expect(colNames).toContain("player_id");
    expect(colNames).toContain("team_season_id");
    expect(colNames).toContain("revision_id");
    expect(colNames).toContain("seconds_played");
    // Stat columns
    expect(colNames).toContain("pts");
    expect(colNames).toContain("fgm");
    expect(colNames).toContain("fga");
    expect(colNames).toContain("tpm");
    expect(colNames).toContain("tpa");
    expect(colNames).toContain("ftm");
    expect(colNames).toContain("fta");
    expect(colNames).toContain("oreb");
    expect(colNames).toContain("dreb");
    expect(colNames).toContain("ast");
    expect(colNames).toContain("stl");
    expect(colNames).toContain("blk");
    expect(colNames).toContain("tov");
    expect(colNames).toContain("pf");
  });

  it("stat columns use smallint data type", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'game_player_stats'
         AND column_name IN ('pts','fgm','fga','tpm','tpa','ftm','fta','oreb','dreb','ast','stl','blk','tov','pf')
       ORDER BY column_name`,
    );
    for (const row of rows) {
      expect(row.data_type).toBe("smallint");
    }
  });
});

// ── Seed data integrity ───────────────────────────────────────────────────

describe("seed game_player_stats data", () => {
  it("has game_player_stats rows for game 001", async () => {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS cnt FROM public.game_player_stats WHERE game_id = $1",
      [SEED_GAME_ID],
    );
    expect(rows[0].cnt).toBeGreaterThan(0);
  });

  it("game 001 has official status", async () => {
    const { rows } = await pool.query(
      "SELECT status FROM public.games WHERE id = $1",
      [SEED_GAME_ID],
    );
    expect(rows[0].status).toBe("official");
  });

  it("game 001 has an approved revision", async () => {
    const { rows } = await pool.query(
      `SELECT state FROM public.game_revisions
       WHERE game_id = $1 AND state = 'approved'
       LIMIT 1`,
      [SEED_GAME_ID],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].state).toBe("approved");
  });
});

// ── Player game data queries ──────────────────────────────────────────────

describe("player game data queries", () => {
  it("queries game_player_stats for a specific player", async () => {
    const { rows } = await pool.query(
      `SELECT game_id, player_id, team_season_id, seconds_played,
              pts, fgm, fga, tpm, tpa, ftm, fta,
              oreb, dreb, ast, stl, blk, tov, pf
       FROM public.game_player_stats
       WHERE player_id = $1 AND game_id = $2`,
      [SEED_HOME_PLAYER, SEED_GAME_ID],
    );
    expect(rows.length).toBe(1);
    const row = rows[0];
    expect(row.player_id).toBe(SEED_HOME_PLAYER);
    expect(row.team_season_id).toBe(SEED_HOME_TEAM_SEASON);
    // Stat columns are numeric
    expect(typeof row.pts).toBe("number");
    expect(typeof row.fgm).toBe("number");
    expect(typeof row.fga).toBe("number");
    expect(typeof row.seconds_played).toBe("number");
    // seconds_played ≥ 0
    expect(row.seconds_played).toBeGreaterThanOrEqual(0);
  });

  it("aggregates player stats across games for a team", async () => {
    // Find all games where SEED_HOME_TEAM_SEASON's players appear
    const { rows } = await pool.query(
      `SELECT player_id,
              COUNT(*)::int AS games_played,
              SUM(pts)::int AS total_pts,
              AVG(pts)::numeric(5,1) AS avg_pts,
              SUM(fgm)::int AS total_fgm,
              SUM(fga)::int AS total_fga,
              SUM(tpm)::int AS total_tpm,
              SUM(tpa)::int AS total_tpa,
              SUM(ftm)::int AS total_ftm,
              SUM(fta)::int AS total_fta,
              SUM(oreb)::int AS total_oreb,
              SUM(dreb)::int AS total_dreb,
              SUM(ast)::int AS total_ast,
              SUM(stl)::int AS total_stl,
              SUM(blk)::int AS total_blk,
              SUM(tov)::int AS total_tov,
              SUM(pf)::int AS total_pf
       FROM public.game_player_stats
       WHERE team_season_id = $1
       GROUP BY player_id
       ORDER BY total_pts DESC`,
      [SEED_HOME_TEAM_SEASON],
    );
    expect(rows.length).toBeGreaterThan(0);

    // Each row has the expected aggregation shape
    for (const row of rows) {
      expect(typeof row.player_id).toBe("string");
      expect(row.games_played).toBeGreaterThan(0);
      expect(typeof row.total_pts).toBe("number");
      expect(typeof row.total_fgm).toBe("number");
      expect(typeof row.total_fga).toBe("number");
      // Field goal attempts >= field goals made
      expect(row.total_fga).toBeGreaterThanOrEqual(row.total_fgm);
      // Free throw attempts >= free throws made
      expect(row.total_fta).toBeGreaterThanOrEqual(row.total_ftm);
      // The sum of pts, rebounds, assists etc are all non-negative
      expect(row.total_pts).toBeGreaterThanOrEqual(0);
    }
  });

  it("v_public_box_score returns curated player stats", async () => {
    const { rows } = await pool.query(
      `SELECT game_id, player_id, player_name, team_name,
              pts, fgm, fga, tpm, tpa, ftm, fta,
              oreb, dreb, ast, stl, blk, tov, pf,
              seconds_played, source_type
       FROM public.v_public_box_score
       WHERE game_id = $1 AND player_id = $2`,
      [SEED_GAME_ID, SEED_HOME_PLAYER],
    );
    // The view requires approved revisions with approved source submissions
    // on official/league_verified games — seed meets this.
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const row = rows[0];
    expect(row.player_id).toBe(SEED_HOME_PLAYER);
    expect(typeof row.player_name).toBe("string");
    expect(typeof row.team_name).toBe("string");
    expect(typeof row.pts).toBe("number");
    // source_type should reflect how data entered the system
    expect(row.source_type).toBe("tracker_journal");
  });
});

// ── season_player_stats ───────────────────────────────────────────────────

describe("season_player stats", () => {
  // season_player_stats may not have seed data — we test the table is
  // functional by direct insert then query.
  const cleanup: string[] = [];

  afterAll(async () => {
    for (const playerId of cleanup) {
      await pool.query(
        "DELETE FROM public.season_player_stats WHERE player_id = $1",
        [playerId],
      );
    }
  });

  it("has season_player_stats table with expected columns", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'season_player_stats'
       ORDER BY ordinal_position`,
    );
    const colNames = rows.map((r: { column_name: string }) => r.column_name);

    expect(colNames).toContain("competition_id");
    expect(colNames).toContain("player_id");
    expect(colNames).toContain("team_season_id");
    expect(colNames).toContain("gp");
    expect(colNames).toContain("mpg");
    // Per-game averages
    expect(colNames).toContain("pts");
    expect(colNames).toContain("fgm");
    expect(colNames).toContain("fga");
    expect(colNames).toContain("tpm");
    expect(colNames).toContain("tpa");
    expect(colNames).toContain("ftm");
    expect(colNames).toContain("fta");
    expect(colNames).toContain("oreb");
    expect(colNames).toContain("dreb");
    expect(colNames).toContain("ast");
    expect(colNames).toContain("stl");
    expect(colNames).toContain("blk");
    expect(colNames).toContain("tov");
    expect(colNames).toContain("pf");
  });

  it("inserts and reads season_player_stats", async () => {
    const testPlayerId = SEED_HOME_PLAYER;
    await pool.query(
      `INSERT INTO public.season_player_stats
       (competition_id, player_id, team_season_id, gp, seconds_played, mpg,
        pts, fgm, fga, tpm, tpa, ftm, fta,
        oreb, dreb, ast, stl, blk, tov, pf)
       VALUES ($1, $2, $3, 5, 850, 28.3,
        18.5, 6.8, 14.2, 2.1, 5.5, 3.0, 4.1,
        1.8, 4.2, 4.5, 1.2, 0.8, 2.4, 2.1)
       ON CONFLICT (competition_id, player_id)
       DO UPDATE SET
         gp = EXCLUDED.gp,
         pts = EXCLUDED.pts,
         fgm = EXCLUDED.fgm,
         fga = EXCLUDED.fga
       RETURNING player_id, gp, pts, fgm, fga`,
      [SEED_COMPETITION_ID, testPlayerId, SEED_HOME_TEAM_SEASON],
    );
    cleanup.push(testPlayerId);

    // Read back
    const { rows } = await pool.query(
      `SELECT player_id, competition_id, team_season_id,
              gp, mpg, pts, fgm, fga, ast, stl, blk, tov
       FROM public.season_player_stats
       WHERE player_id = $1 AND competition_id = $2`,
      [testPlayerId, SEED_COMPETITION_ID],
    );
    expect(rows.length).toBe(1);
    const row = rows[0];
    expect(row.player_id).toBe(testPlayerId);
    expect(row.competition_id).toBe(SEED_COMPETITION_ID);
    expect(row.gp).toBe(5);
    expect(row.pts).toBeCloseTo(18.5);
    expect(row.fgm).toBeCloseTo(6.8);
    expect(row.fga).toBeCloseTo(14.2);
    expect(row.ast).toBeCloseTo(4.5);
  });

  it("season_player_stats per-game averages are non-negative", async () => {
    const { rows } = await pool.query(
      `SELECT pts, fgm, fga, ast, stl, blk, tov, pf
       FROM public.season_player_stats
       WHERE competition_id = $1`,
      [SEED_COMPETITION_ID],
    );
    // If any rows exist, verify non-negative
    for (const row of rows) {
      expect(row.pts).toBeGreaterThanOrEqual(0);
      expect(row.fgm).toBeGreaterThanOrEqual(0);
      expect(row.fga).toBeGreaterThanOrEqual(0);
    }
  });
});

// ── Player development timeline ───────────────────────────────────────────

describe("player development timeline (v_athlete_timeline)", () => {
  it("v_athlete_timeline view definition exists", async () => {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM pg_views WHERE viewname = 'v_athlete_timeline' AND schemaname = 'public') AS exists",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("v_athlete_timeline returns game events for seeded players", async () => {
    const { rows } = await pool.query(
      `SELECT event_type, player_id, player_name, pts, assists, total_rebounds,
              home_score, away_score, opponent_name, event_date
       FROM public.v_athlete_timeline
       WHERE event_type = 'game_stats'
         AND player_id = $1
       LIMIT 5`,
      [SEED_HOME_PLAYER],
    );
    // Seed has official games with approved revisions → view should return rows
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const row = rows[0];
    expect(row.event_type).toBe("game_stats");
    expect(row.player_name).toBeTruthy();
    expect(typeof row.pts).toBe("number");
    expect(typeof row.assists).toBe("number");
    expect(typeof row.total_rebounds).toBe("number");
    expect(typeof row.home_score).toBe("number");
    expect(typeof row.away_score).toBe("number");
  });

  it("v_athlete_timeline distinguishes home vs away", async () => {
    const { rows } = await pool.query(
      `SELECT player_team_name, opponent_name
       FROM public.v_athlete_timeline
       WHERE player_id = $1
       LIMIT 3`,
      [SEED_HOME_PLAYER],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const row of rows) {
      expect(typeof row.player_team_name).toBe("string");
      expect(typeof row.opponent_name).toBe("string");
      // Player team and opponent should be different
      expect(row.player_team_name).not.toBe(row.opponent_name);
    }
  });
});

// ── v_public_team_game_stats view schema ──────────────────────────────────

describe("v_public_team_game_stats column definitions", () => {
  it("has expected columns for team analytics", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'v_public_team_game_stats'
       ORDER BY ordinal_position`,
    );
    const colNames = rows.map((r: { column_name: string }) => r.column_name);

    // Game info
    expect(colNames).toContain("game_id");
    expect(colNames).toContain("scheduled_at");
    expect(colNames).toContain("status");
    expect(colNames).toContain("home_team_season_id");
    expect(colNames).toContain("away_team_season_id");

    // Team perspective stats
    expect(colNames).toContain("team_season_id");
    expect(colNames).toContain("team_pts");
    expect(colNames).toContain("team_fgm");
    expect(colNames).toContain("team_fga");
    expect(colNames).toContain("team_tpm");
    expect(colNames).toContain("team_tpa");
    expect(colNames).toContain("team_ftm");
    expect(colNames).toContain("team_fta");
    expect(colNames).toContain("team_oreb");
    expect(colNames).toContain("team_dreb");
    expect(colNames).toContain("team_ast");
    expect(colNames).toContain("team_stl");
    expect(colNames).toContain("team_blk");
    expect(colNames).toContain("team_tov");
    expect(colNames).toContain("team_pf");

    // Opponent stats
    expect(colNames).toContain("opp_pts");
    expect(colNames).toContain("opp_fgm");
    expect(colNames).toContain("opp_fga");
    expect(colNames).toContain("opp_tpm");
    expect(colNames).toContain("opp_tpa");

    // Context fields
    expect(colNames).toContain("home_away");
    expect(colNames).toContain("opp_team_season_id");
    expect(colNames).toContain("opp_team_name");
    expect(colNames).toContain("opp_team_slug");
    expect(colNames).toContain("opp_team_short_code");
    expect(colNames).toContain("opp_team_logo_url");
  });
});

// ── RLS: public views accessible to authenticated users ──────────────────

describe("RLS: public analytics views", () => {
  let authUser: { id: string; email: string };

  beforeAll(async () => {
    authUser = await createTestUser(pool, {
      email: `ta-rls-${Date.now()}@onoo-test.mn`,
    });
  });

  afterAll(async () => {
    await pool.query("DELETE FROM auth.users WHERE id = $1", [authUser.id]);
  });

  it("v_public_box_score is readable as authenticated user", async () => {
    await asUser(client, authUser.id, async () => {
      const { rows, rowCount } = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM public.v_public_box_score
         WHERE game_id = $1`,
        [SEED_GAME_ID],
      );
      expect(rowCount).toBe(1);
      expect(rows[0].cnt).toBeGreaterThan(0);
    });
  });

  it("v_athlete_timeline is readable as authenticated user", async () => {
    await asUser(client, authUser.id, async () => {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM public.v_athlete_timeline
         WHERE event_type = 'game_stats'`,
      );
      expect(rows[0].cnt).toBeGreaterThanOrEqual(0);
    });
  });

  it("season_player_stats is readable as authenticated user", async () => {
    await asUser(client, authUser.id, async () => {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM public.season_player_stats`,
      );
      // May be zero if no data — just check the query doesn't error
      expect(typeof rows[0].cnt).toBe("number");
    });
  });

  it("game_player_stats is readable for official games via RLS policy", async () => {
    await asUser(client, authUser.id, async () => {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS cnt
         FROM public.game_player_stats gps
         JOIN public.games g ON g.id = gps.game_id
         WHERE g.status IN ('league_verified', 'official')
           AND gps.game_id = $1`,
        [SEED_GAME_ID],
      );
      expect(rows[0].cnt).toBeGreaterThan(0);
    });
  });
});
