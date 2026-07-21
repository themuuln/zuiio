/**
 * Integration test for RPC functions used by Supabase Edge Functions.
 * These run on the real DB to ensure the contracts edge functions depend on
 * are correct.
 */
import { type Pool, type PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
} from "./setup-integration";

const SEED_COMPETITION_ID = "e0000000-0000-0000-0000-000000000001";
const SEED_LEAGUE_ID = "c0000000-0000-0000-0000-000000000001";
const SEED_ADMIN_ID = "397692e0-915f-4361-9f75-f84d0883ba80";

let pool: Pool;
let client: PoolClient;

beforeAll(async () => {
  pool = await getPool();
  client = await pool.connect();
});

afterAll(async () => {
  if (client) client.release();
  await closePool();
});

// ── RPC: is_league_admin ───────────────────────────────────────────────────
describe("RPC > is_league_admin", () => {
  beforeAll(async () => {
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [SEED_ADMIN_ID, SEED_LEAGUE_ID],
    );
  });
  afterAll(async () => {
    await pool.query(
      "DELETE FROM public.memberships WHERE user_id = $1 AND scope_type = 'league' AND scope_id = $2",
      [SEED_ADMIN_ID, SEED_LEAGUE_ID],
    );
  });
  it("returns true for seed admin user", async () => {
    await asUser(client, SEED_ADMIN_ID, async () => {
      const { rows } = await client.query("SELECT public.is_league_admin($1::uuid) as is_admin", [SEED_LEAGUE_ID]);
      expect(rows[0].is_admin).toBe(true);
    });
  });
  it("returns false for user without admin membership", async () => {
    const nonAdmin = await createTestUser(pool, { email: `rpc-nonadmin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn` });
    try {
      await asUser(client, nonAdmin.id, async () => {
        const { rows } = await client.query("SELECT public.is_league_admin($1::uuid) as is_admin", [SEED_LEAGUE_ID]);
        expect(rows[0].is_admin).toBe(false);
      });
    } finally {
      await pool.query("DELETE FROM auth.users WHERE id = $1", [nonAdmin.id]);
    }
  });
});

// ── RPC: refresh_season_player_stats ───────────────────────────────────────
describe("RPC > refresh_season_player_stats", () => {
  it("runs without error on valid competition", async () => {
    const result = await client.query("SELECT public.refresh_season_player_stats($1::uuid)", [SEED_COMPETITION_ID]);
    expect(result.rows).toBeDefined();
  });
  it("runs without error when competition has no data", async () => {
    const fakeId = crypto.randomUUID();
    const result = await client.query("SELECT public.refresh_season_player_stats($1::uuid)", [fakeId]);
    expect(result.rows).toBeDefined();
  });
});

// ── RPC: refresh_standings ─────────────────────────────────────────────────
describe("RPC > refresh_standings", () => {
  afterEach(async () => {
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [SEED_COMPETITION_ID]);
  });
  it("runs without error on valid competition", async () => {
    const result = await client.query("SELECT public.refresh_standings($1::uuid)", [SEED_COMPETITION_ID]);
    expect(result.rows).toBeDefined();
  });
  it("creates standings rows for team_seasons in competition", async () => {
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [SEED_COMPETITION_ID]);
    await pool.query("DELETE FROM public.season_player_stats WHERE competition_id = $1", [SEED_COMPETITION_ID]);
    await asUser(client, SEED_ADMIN_ID, async () => {
      await client.query("SELECT public.refresh_standings($1::uuid)", [SEED_COMPETITION_ID]);
    });
    const { rows } = await pool.query("SELECT count(*)::int as cnt FROM public.standings WHERE competition_id = $1", [SEED_COMPETITION_ID]);
    expect(rows[0].cnt).toBeGreaterThanOrEqual(1);
  });
});

// ── Manual Player/Team Stats Insert Pattern (as used by manual-box-entry) ──
describe("manual box entry pattern", () => {
  let adminUser: { id: string; email: string };
  let gameId: string;
  let revisionId: string;

  beforeAll(async () => {
    adminUser = await createTestUser(pool, { email: `manual-entry-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn` });
    await pool.query("INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING", [adminUser.id, SEED_LEAGUE_ID]);
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [SEED_COMPETITION_ID]);
    await pool.query("DELETE FROM public.season_player_stats WHERE competition_id = $1", [SEED_COMPETITION_ID]);

    const { rows: gameRows } = await pool.query(
      `INSERT INTO public.games (competition_id, ruleset_id, home_team_season_id, away_team_season_id, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled') RETURNING id`,
      [SEED_COMPETITION_ID, "90000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000002", "2026-08-01 18:00:00+08"],
    );
    gameId = gameRows[0].id;

    const subId = crypto.randomUUID();
    await pool.query("INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload, confidence, submitted_by) VALUES ($1, $2, 'manual_box_score', 'https://example.com', '{}'::jsonb, 1.0, $3)", [subId, gameId, SEED_ADMIN_ID]);
    revisionId = crypto.randomUUID();
    await pool.query("INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by) VALUES ($1, $2, 1, $3, '{}'::jsonb, '{}'::jsonb, 'pending', $4)", [revisionId, gameId, subId, SEED_ADMIN_ID]);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM public.game_player_stats WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.game_team_stats WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.game_revisions WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.source_submissions WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.game_rosters WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [adminUser.id]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("inserts player stats directly", async () => {
    await pool.query("INSERT INTO public.game_player_stats (game_id, player_id, team_season_id, revision_id, pts, fgm, fga) VALUES ($1, $2, $3, $4, 10, 4, 8)", [gameId, "50000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000001", revisionId]);
    const { rows: stats } = await pool.query("SELECT pts, fgm FROM public.game_player_stats WHERE game_id = $1 AND player_id = $2", [gameId, "50000000-0000-0000-0000-000000000001"]);
    expect(stats[0].pts).toBe(10);
    expect(stats[0].fgm).toBe(4);
  });

  it("inserts team stats directly", async () => {
    await pool.query("INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id, pts, fgm, fga) VALUES ($1, $2, $3, 78, 30, 65)", [gameId, "30000000-0000-0000-0000-000000000001", revisionId]);
    const { rows } = await pool.query("SELECT pts, fgm, ast FROM public.game_team_stats WHERE game_id = $1 AND team_season_id = $2", [gameId, "30000000-0000-0000-0000-000000000001"]);
    expect(rows[0].pts).toBe(78);
  });

  it("update game status to final", async () => {
    const { rows } = await pool.query(`UPDATE public.games SET status = 'final_pending_review', home_score = 78, away_score = 65 WHERE id = $1 RETURNING status, home_score`, [gameId]);
    expect(rows[0].status).toBe("final_pending_review");
    expect(rows[0].home_score).toBe(78);
  });
});

// ── derive-game RPC Pattern ───────────────────────────────────────────────
describe("derive-game RPC pattern", () => {
  let adminUser: { id: string; email: string };
  let gameId: string;
  let sessionId: string;

  beforeAll(async () => {
    adminUser = await createTestUser(pool, { email: `derive-test-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn` });
    await pool.query("INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING", [adminUser.id, SEED_LEAGUE_ID]);
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [SEED_COMPETITION_ID]);
    await pool.query("DELETE FROM public.season_player_stats WHERE competition_id = $1", [SEED_COMPETITION_ID]);

    const homeTsId = "30000000-0000-0000-0000-000000000001";
    const awayTsId = "30000000-0000-0000-0000-000000000002";

    const { rows: gameRows } = await pool.query(
      `INSERT INTO public.games (competition_id, ruleset_id, home_team_season_id, away_team_season_id, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled') RETURNING id`,
      [SEED_COMPETITION_ID, "90000000-0000-0000-0000-000000000001", homeTsId, awayTsId, "2026-08-01 18:00:00+08"],
    );
    gameId = gameRows[0].id;

    await pool.query("INSERT INTO public.game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ($1, $2, $3, true), ($1, $4, $5, true)", [gameId, homeTsId, "50000000-0000-0000-0000-000000000001", awayTsId, "50000000-0000-0000-0000-000000000002"]);

    await asUser(client, adminUser.id, async () => {
      await client.query("SELECT public.cmd_transition_game($1::uuid, 'live_provisional')", [gameId]);
      await client.query("SELECT public.cmd_assign_scorer($1::uuid, $2::uuid, 'backup_scorer')", [gameId, adminUser.id]);

      const { rows: sRows } = await client.query("SELECT * FROM public.cmd_open_tracker_session($1::uuid, 'backup_scorer')", [gameId]);
      sessionId = sRows[0].id;

      for (let i = 0; i < 5; i++) {
        await client.query(
          "SELECT public.cmd_record_event($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::smallint, $6::text, $7::smallint, $8::smallint, $9::uuid, $10::uuid, $11::jsonb)",
          [gameId, sessionId, crypto.randomUUID(), crypto.randomUUID(), i + 1, "shot_2pt_made", 1, 500, homeTsId, "50000000-0000-0000-0000-000000000001", "{}"],
        );
      }
      for (let i = 0; i < 3; i++) {
        await client.query(
          "SELECT public.cmd_record_event($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::smallint, $6::text, $7::smallint, $8::smallint, $9::uuid, $10::uuid, $11::jsonb)",
          [gameId, sessionId, crypto.randomUUID(), crypto.randomUUID(), i + 6, "shot_3pt_made", 1, 500, awayTsId, "50000000-0000-0000-0000-000000000002", "{}"],
        );
      }
      await client.query("SELECT public.cmd_transition_game($1::uuid, 'final_pending_review')", [gameId]);
    });
  });

  afterAll(async () => {
    await pool.query("DELETE FROM public.game_player_stats WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.game_team_stats WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.stat_events WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.source_submissions WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.game_revisions WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.tracker_sessions WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.game_assignments WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.game_rosters WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
    await pool.query("DELETE FROM public.season_player_stats WHERE competition_id = $1", [SEED_COMPETITION_ID]);
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [SEED_COMPETITION_ID]);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [adminUser.id]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("apply_derived_stats RPC accepts valid inputs", async () => {
    const homeTsId = "30000000-0000-0000-0000-000000000001";
    const awayTsId = "30000000-0000-0000-0000-000000000002";

    const playerStats = [
      { player_id: "50000000-0000-0000-0000-000000000001", team_season_id: homeTsId, pts: 10, fgm: 5, fga: 8, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 2, dreb: 3, ast: 4, stl: 1, blk: 0, tov: 1, pf: 2, seconds_played: 600 },
      { player_id: "50000000-0000-0000-0000-000000000002", team_season_id: awayTsId, pts: 9, fgm: 3, fga: 7, tpm: 3, tpa: 5, ftm: 0, fta: 0, oreb: 1, dreb: 1, ast: 2, stl: 0, blk: 1, tov: 3, pf: 1, seconds_played: 550 },
    ];
    const teamStats = [
      { team_season_id: homeTsId, pts: 10, fgm: 5, fga: 8, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 2, dreb: 3, team_reb: 1, ast: 4, stl: 1, blk: 0, tov: 1, pf: 2 },
      { team_season_id: awayTsId, pts: 9, fgm: 3, fga: 7, tpm: 3, tpa: 5, ftm: 0, fta: 0, oreb: 1, dreb: 1, team_reb: 0, ast: 2, stl: 0, blk: 1, tov: 3, pf: 1 },
    ];

    await asUser(client, adminUser.id, async () => {
      // Verify auth context
      const { rows: authCheck } = await client.query("SELECT auth.uid() as uid");
      expect(authCheck[0].uid).toBe(adminUser.id);

      // Call function
      await client.query(
        "SELECT public.apply_derived_stats($1::uuid, $2::jsonb, $3::jsonb, $4::smallint, $5::smallint, $6::public.game_status)",
        [gameId, JSON.stringify(playerStats), JSON.stringify(teamStats), 10, 9, "final_pending_review"],
      );
    });

    // Verify stats via pool (bypass RLS for reading)
    const { rows: ps } = await pool.query(
      "SELECT pts, fgm FROM public.game_player_stats WHERE game_id = $1 AND player_id = $2",
      [gameId, "50000000-0000-0000-0000-000000000001"],
    );
    expect(ps.length).toBeGreaterThanOrEqual(1);
    expect(ps[0].pts).toBe(10);
  });
});

// ── Auth flows used by edge functions ──────────────────────────────────────
describe("edge function auth patterns", () => {
  it("auth.uid() returns user id in authenticated context", async () => {
    await asUser(client, SEED_ADMIN_ID, async () => {
      const { rows } = await client.query("SELECT auth.uid() as uid");
      expect(rows[0].uid).toBe(SEED_ADMIN_ID);
    });
  });
  it("auth.uid() returns null in anon context", async () => {
    await client.query("SELECT set_config('request.jwt.claim.sub', '', false)");
    await client.query("SET ROLE anon");
    const { rows } = await client.query("SELECT auth.uid() as uid");
    expect(rows[0].uid).toBeNull();
  });
});
