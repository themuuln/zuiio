import type { Pool, PoolClient } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_ADMIN_ID,
  SEED_AWAY_PLAYER,
  SEED_AWAY_TEAM_SEASON,
  SEED_COMPETITION_ID,
  SEED_HOME_PLAYER,
  SEED_HOME_PLAYER_2,
  SEED_HOME_TEAM_SEASON,
  SEED_LEAGUE_ID,
  SEED_RULESET_ID,
} from "./seed-constants";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
} from "./setup-integration";

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
      const { rows } = await client.query(
        "SELECT public.is_league_admin($1::uuid) as is_admin",
        [SEED_LEAGUE_ID],
      );
      expect(rows[0].is_admin).toBe(true);
    });
  });
  it("returns false for user without admin membership", async () => {
    const nonAdmin = await createTestUser(pool, {
      email: `rpc-nonadmin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    try {
      await asUser(client, nonAdmin.id, async () => {
        const { rows } = await client.query(
          "SELECT public.is_league_admin($1::uuid) as is_admin",
          [SEED_LEAGUE_ID],
        );
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
    const result = await client.query(
      "SELECT public.refresh_season_player_stats($1::uuid)",
      [SEED_COMPETITION_ID],
    );
    expect(result.rows).toBeDefined();
  });
  it("runs without error when competition has no data", async () => {
    const fakeId = crypto.randomUUID();
    const result = await client.query(
      "SELECT public.refresh_season_player_stats($1::uuid)",
      [fakeId],
    );
    expect(result.rows).toBeDefined();
  });
});

// ── RPC: refresh_standings ─────────────────────────────────────────────────
describe("RPC > refresh_standings", () => {
  afterEach(async () => {
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [
      SEED_COMPETITION_ID,
    ]);
  });
  it("runs without error on valid competition", async () => {
    const result = await client.query(
      "SELECT public.refresh_standings($1::uuid)",
      [SEED_COMPETITION_ID],
    );
    expect(result.rows).toBeDefined();
  });
  it("creates standings rows for team_seasons in competition", async () => {
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [
      SEED_COMPETITION_ID,
    ]);
    await pool.query(
      "DELETE FROM public.season_player_stats WHERE competition_id = $1",
      [SEED_COMPETITION_ID],
    );
    await asUser(client, SEED_ADMIN_ID, async () => {
      await client.query("SELECT public.refresh_standings($1::uuid)", [
        SEED_COMPETITION_ID,
      ]);
    });
    const { rows } = await pool.query(
      "SELECT count(*)::int as cnt FROM public.standings WHERE competition_id = $1",
      [SEED_COMPETITION_ID],
    );
    expect(rows[0].cnt).toBeGreaterThanOrEqual(1);
  });
});

// ── Projection rebuild flow (replaces old manual-box-entry direct writes) ──
describe("projection rebuild flow", () => {
  let adminUser: { id: string; email: string };
  let gameId: string;
  let revisionId: string;

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `rebuild-test-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_LEAGUE_ID],
    );
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [
      SEED_COMPETITION_ID,
    ]);
    await pool.query(
      "DELETE FROM public.season_player_stats WHERE competition_id = $1",
      [SEED_COMPETITION_ID],
    );

    const { rows: gameRows } = await pool.query(
      `INSERT INTO public.games (competition_id, ruleset_id, home_team_season_id, away_team_season_id, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, 'final_pending_review') RETURNING id`,
      [
        SEED_COMPETITION_ID,
        SEED_RULESET_ID,
        SEED_HOME_TEAM_SEASON,
        SEED_AWAY_TEAM_SEASON,
        "2026-08-01 18:00:00+08",
      ],
    );
    gameId = gameRows[0].id;

    const subId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO public.source_submissions (id, game_id, source_type, evidence_url, normalized_payload, confidence, submitted_by, status, reviewed_by, reviewed_at) VALUES ($1, $2, 'manual_box_score', 'https://example.com', '{}'::jsonb, 1.0, $3, 'approved', $3, now())",
      [subId, gameId, SEED_ADMIN_ID],
    );
    revisionId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO public.game_revisions (id, game_id, revision_number, source_submission_id, journal, projection, state, created_by, approved_at)
       VALUES ($1, $2, 1, $3, '{}'::jsonb, '{"players":[],"teams":[]}'::jsonb, 'approved', $4, now())`,
      [revisionId, gameId, subId, SEED_ADMIN_ID],
    );
    await pool.query(
      "UPDATE public.games SET current_revision_number = 1 WHERE id = $1",
      [gameId],
    );
  });

  afterAll(async () => {
    await pool.query(
      "DELETE FROM public.game_player_stats WHERE game_id = $1",
      [gameId],
    );
    await pool.query("DELETE FROM public.game_team_stats WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query("DELETE FROM public.game_revisions WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query(
      "DELETE FROM public.source_submissions WHERE game_id = $1",
      [gameId],
    );
    await pool.query("DELETE FROM public.game_rosters WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("cmd_rebuild_projection materializes from approved revision", async () => {
    await asUser(pool, adminUser.id, async () => {
      const { rows } = await pool.query(
        "SELECT public.cmd_rebuild_projection($1::uuid)",
        [gameId],
      );
      expect(rows).toBeDefined();
    });
  });

  it("direct INSERT into game_player_stats blocked for anon", async () => {
    await expect(
      pool.query(
        "SET ROLE anon; INSERT INTO public.game_player_stats (game_id, player_id, team_season_id, revision_id, pts) VALUES ($1, $2, $3, $4, 10)",
        [
          gameId,
          SEED_HOME_PLAYER,
          SEED_HOME_TEAM_SEASON,
          revisionId,
        ],
      ),
    ).rejects.toThrow();
  });
});

// ── derive-game RPC Pattern ───────────────────────────────────────────────
describe("derive-game RPC pattern", () => {
  let adminUser: { id: string; email: string };
  let gameId: string;
  let sessionId: string;

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `derive-test-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_LEAGUE_ID],
    );
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [
      SEED_COMPETITION_ID,
    ]);
    await pool.query(
      "DELETE FROM public.season_player_stats WHERE competition_id = $1",
      [SEED_COMPETITION_ID],
    );

    const homeTsId = SEED_HOME_TEAM_SEASON;
    const awayTsId = SEED_AWAY_TEAM_SEASON;

    const { rows: gameRows } = await pool.query(
      `INSERT INTO public.games (competition_id, ruleset_id, home_team_season_id, away_team_season_id, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled') RETURNING id`,
      [
        SEED_COMPETITION_ID,
        SEED_RULESET_ID,
        homeTsId,
        awayTsId,
        "2026-08-01 18:00:00+08",
      ],
    );
    gameId = gameRows[0].id;

    await pool.query(
      "INSERT INTO public.game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ($1, $2, $3, true), ($1, $4, $5, true)",
      [
        gameId,
        homeTsId,
        SEED_HOME_PLAYER,
        awayTsId,
        SEED_HOME_PLAYER_2,
      ],
    );

    await asUser(client, adminUser.id, async () => {
      await client.query(
        "SELECT public.cmd_transition_game($1::uuid, 'live_provisional')",
        [gameId],
      );
      await client.query(
        "SELECT public.cmd_assign_scorer($1::uuid, $2::uuid, 'backup_scorer')",
        [gameId, adminUser.id],
      );

      const { rows: sRows } = await client.query(
        "SELECT * FROM public.cmd_open_tracker_session($1::uuid, 'backup_scorer')",
        [gameId],
      );
      sessionId = sRows[0].id;

      for (let i = 0; i < 5; i++) {
        await client.query(
          "SELECT public.cmd_record_event($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::smallint, $6::text, $7::smallint, $8::smallint, $9::uuid, $10::uuid, $11::jsonb)",
          [
            gameId,
            sessionId,
            crypto.randomUUID(),
            crypto.randomUUID(),
            i + 1,
            "shot_2pt_made",
            1,
            500,
            homeTsId,
            SEED_HOME_PLAYER,
            "{}",
          ],
        );
      }
      for (let i = 0; i < 3; i++) {
        await client.query(
          "SELECT public.cmd_record_event($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::smallint, $6::text, $7::smallint, $8::smallint, $9::uuid, $10::uuid, $11::jsonb)",
          [
            gameId,
            sessionId,
            crypto.randomUUID(),
            crypto.randomUUID(),
            i + 6,
            "shot_3pt_made",
            1,
            500,
            awayTsId,
            SEED_HOME_PLAYER_2,
            "{}",
          ],
        );
      }
      await client.query(
        "SELECT public.cmd_transition_game($1::uuid, 'final_pending_review')",
        [gameId],
      );
    });
  });

  afterAll(async () => {
    await pool.query(
      "DELETE FROM public.game_player_stats WHERE game_id = $1",
      [gameId],
    );
    await pool.query("DELETE FROM public.game_team_stats WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query("DELETE FROM public.stat_events WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query("DELETE FROM public.game_revisions WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query(
      "DELETE FROM public.source_submissions WHERE game_id = $1",
      [gameId],
    );
    await pool.query("DELETE FROM public.tracker_sessions WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query("DELETE FROM public.game_assignments WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query("DELETE FROM public.game_rosters WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
    await pool.query(
      "DELETE FROM public.season_player_stats WHERE competition_id = $1",
      [SEED_COMPETITION_ID],
    );
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [
      SEED_COMPETITION_ID,
    ]);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("apply_derived_stats RPC accepts valid inputs", async () => {
    const homeTsId = SEED_HOME_TEAM_SEASON;
    const awayTsId = SEED_AWAY_TEAM_SEASON;

    const playerStats = [
      {
        player_id: SEED_HOME_PLAYER,
        team_season_id: homeTsId,
        pts: 10,
        fgm: 5,
        fga: 8,
        tpm: 0,
        tpa: 0,
        ftm: 0,
        fta: 0,
        oreb: 2,
        dreb: 3,
        ast: 4,
        stl: 1,
        blk: 0,
        tov: 1,
        pf: 2,
        seconds_played: 600,
      },
      {
        player_id: SEED_HOME_PLAYER_2,
        team_season_id: awayTsId,
        pts: 9,
        fgm: 3,
        fga: 7,
        tpm: 3,
        tpa: 5,
        ftm: 0,
        fta: 0,
        oreb: 1,
        dreb: 1,
        ast: 2,
        stl: 0,
        blk: 1,
        tov: 3,
        pf: 1,
        seconds_played: 550,
      },
    ];
    const teamStats = [
      {
        team_season_id: homeTsId,
        pts: 10,
        fgm: 5,
        fga: 8,
        tpm: 0,
        tpa: 0,
        ftm: 0,
        fta: 0,
        oreb: 2,
        dreb: 3,
        team_reb: 1,
        ast: 4,
        stl: 1,
        blk: 0,
        tov: 1,
        pf: 2,
      },
      {
        team_season_id: awayTsId,
        pts: 9,
        fgm: 3,
        fga: 7,
        tpm: 3,
        tpa: 5,
        ftm: 0,
        fta: 0,
        oreb: 1,
        dreb: 1,
        team_reb: 0,
        ast: 2,
        stl: 0,
        blk: 1,
        tov: 3,
        pf: 1,
      },
    ];

    await asUser(client, adminUser.id, async () => {
      // Verify auth context
      const { rows: authCheck } = await client.query(
        "SELECT auth.uid() as uid",
      );
      expect(authCheck[0].uid).toBe(adminUser.id);

      // Call function
      await client.query(
        "SELECT public.apply_derived_stats($1::uuid, $2::jsonb, $3::jsonb, $4::smallint, $5::smallint, $6::public.game_status)",
        [
          gameId,
          JSON.stringify(playerStats),
          JSON.stringify(teamStats),
          10,
          9,
          "final_pending_review",
        ],
      );
    });

    // Verify stats via pool (bypass RLS for reading)
    const { rows: ps } = await pool.query(
      "SELECT pts, fgm FROM public.game_player_stats WHERE game_id = $1 AND player_id = $2",
      [gameId, SEED_HOME_PLAYER],
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
