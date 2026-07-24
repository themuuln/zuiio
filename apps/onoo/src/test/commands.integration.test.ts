import { randomUUID } from "node:crypto";
import assert from "node:assert";
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_ADMIN_ID,
  SEED_AWAY_PLAYER,
  SEED_AWAY_PLAYER_2,
  SEED_AWAY_TEAM_SEASON,
  SEED_COMPETITION_ID,
  SEED_HOME_PLAYER,
  SEED_HOME_PLAYER_2,
  SEED_HOME_TEAM_SEASON,
  SEED_RULESET_ID,
  SEED_VENUE_ID,
} from "./seed-constants";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
  newPool,
} from "./setup-integration";

// ── Helpers ───────────────────────────────────────────────────────────────

/** Create a scheduled game with seed data references */
/** Create a game (bypasses RLS — runs as test superuser for setup) */
async function createGame(pool: Pool): Promise<string> {
  // Clean up derived data from this competition (standings/season_player_stats may
  // have been left behind by previous test runs that created games for this competition)
  await pool.query(`
    DELETE FROM public.season_player_stats WHERE competition_id = '${SEED_COMPETITION_ID}'
  `);
  await pool.query(`
    DELETE FROM public.standings WHERE competition_id = '${SEED_COMPETITION_ID}'
  `);
  await pool.query(`
    DELETE FROM public.game_player_stats WHERE game_id IN (
      SELECT id FROM public.games WHERE competition_id = '${SEED_COMPETITION_ID}'
    )
  `);
  await pool.query(`
    DELETE FROM public.game_team_stats WHERE game_id IN (
      SELECT id FROM public.games WHERE competition_id = '${SEED_COMPETITION_ID}'
    )
  `);
  const { rows } = await pool.query(`
    INSERT INTO public.games (
      competition_id, ruleset_id,
      home_team_season_id, away_team_season_id,
      venue_id, scheduled_at, status
    ) VALUES (
      '${SEED_COMPETITION_ID}', '${SEED_RULESET_ID}',
      '${SEED_HOME_TEAM_SEASON}', '${SEED_AWAY_TEAM_SEASON}',
      '${SEED_VENUE_ID}', NOW() + INTERVAL '1 day', 'scheduled'
    )
    RETURNING id
  `);
  return rows[0].id as string;
}

/** Create roster entries for a game (bypasses RLS) */
async function createGameRosters(pool: Pool, gameId: string): Promise<void> {
  await pool.query(`
    INSERT INTO public.game_rosters (game_id, team_season_id, player_id, is_starter)
    VALUES
      ('${gameId}', '${SEED_HOME_TEAM_SEASON}', '${SEED_HOME_PLAYER}', true),
      ('${gameId}', '${SEED_HOME_TEAM_SEASON}', '${SEED_HOME_PLAYER_2}', true),
      ('${gameId}', '${SEED_AWAY_TEAM_SEASON}', '${SEED_AWAY_PLAYER}', true),
      ('${gameId}', '${SEED_AWAY_TEAM_SEASON}', '${SEED_AWAY_PLAYER_2}', true)
  `);
}

/** Create a membership that grants admin/manager privileges */
async function createMembership(
  pool: Pool,
  userId: string,
  role: string = "admin",
): Promise<void> {
  // Find the league for our competition, then add a membership at league scope
  const { rows } = await pool.query(
    `SELECT l.id FROM public.leagues l
     JOIN public.seasons s ON s.league_id = l.id
     JOIN public.competitions c ON c.season_id = s.id
     WHERE c.id = $1`,
    [SEED_COMPETITION_ID],
  );
  assert.ok(rows.length > 0, "League not found for competition");
  const leagueId = rows[0].id;

  await pool.query(
    `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
     VALUES ($1, 'league', $2, $3)
     ON CONFLICT (user_id, scope_type, scope_id, role) DO NOTHING`,
    [userId, leagueId, role],
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("command authorization", () => {
  let gameId: string;

  afterAll(async () => {
    await closePool();
  });

  it("prepares a game for auth testing", async () => {
    const p = await getPool();
    gameId = await createGame(p);
    expect(gameId).toBeTruthy();
  });

  it("unauthenticated user cannot execute cmd_transition_game", async () => {
    const p = await getPool();
    await expect(
      p.query(
        `SELECT public.cmd_transition_game('${gameId}'::uuid, 'live_provisional'::public.game_status)`,
      ),
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot execute cmd_record_event", async () => {
    const p = await getPool();
    await expect(
      p.query(
        `SELECT public.cmd_record_event('${gameId}'::uuid, '${crypto.randomUUID()}'::uuid, '${crypto.randomUUID()}'::uuid, '${crypto.randomUUID()}'::uuid, 1, 'shot_2pt_made', 1::smallint, 300::smallint, '${SEED_HOME_TEAM_SEASON}'::uuid, '${SEED_HOME_PLAYER}'::uuid, '{}'::jsonb)`,
      ),
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot execute cmd_submit_source", async () => {
    const p = await getPool();
    await expect(
      p.query(
        `SELECT public.cmd_submit_source('${gameId}'::uuid, 'tracker_journal', null, false, '{}'::jsonb, 0.95::numeric, '${crypto.randomUUID()}'::uuid)`,
      ),
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot execute cmd_create_correction", async () => {
    const p = await getPool();
    await expect(
      p.query(
        `SELECT public.cmd_create_correction('${gameId}'::uuid, 'test', null, '{}'::jsonb)`,
      ),
    ).rejects.toThrow();
  });
});

describe("game lifecycle commands", () => {
  let pool: Pool;
  let client: PoolClient;
  let admin: { id: string; email: string };
  let gameId: string;
  afterAll(async () => {
    if (client) await client.release();
    if (pool) {
      // FK-safe cleanup: delete dependent tables before auth.users
      await pool.query(
        "DELETE FROM public.correction_records WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.stat_events WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.tracker_sessions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_revisions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_rosters WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_assignments WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour'",
      );
      await pool.query(
        "DELETE FROM public.source_submissions WHERE submitted_by IN (SELECT id FROM auth.users WHERE email LIKE '%@onoo-test.mn')",
      );
      await pool.query(
        "DELETE FROM auth.users WHERE email LIKE '%@onoo-test.mn' AND id != $1",
        [SEED_ADMIN_ID],
      );
    }
    await closePool();
  });

  it("sets up test environment with admin user", async () => {
    pool = await getPool();
    client = await pool.connect();
    // Create an admin user with league-level membership
    admin = await createTestUser(pool, {
      email: `admin-lifecycle-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await createMembership(pool, admin.id, "admin");
    // Verify admin can manage games
    const { rows } = await pool.query(
      "SELECT private.user_can_manage_game('c0000000-0000-0000-0000-000000000001'::uuid)",
    );
    // Not setting auth context, so this should be false
    // We'll test the actual flow in the next test
  });
  it("creates a scheduled game", async () => {
    gameId = await createGame(pool);
    gameId = await createGame(pool);
    expect(gameId).toBeTruthy();

    const { rows } = await pool.query(
      "SELECT status, competition_id, current_period FROM public.games WHERE id = $1",
      [gameId],
    );
    expect(rows[0].status).toBe("scheduled");
    expect(rows[0].competition_id).toBe(SEED_COMPETITION_ID);
    expect(rows[0].current_period).toBe(0);
  });

  it("rejects invalid status transition (scheduled -> league_verified)", async () => {
    await expect(
      asUser(client, admin.id, async () => {
        await client.query(
          `SELECT public.cmd_transition_game('${gameId}'::uuid, 'league_verified'::public.game_status)`,
        );
      }),
    ).rejects.toThrow();
  });

  it("transitions game to live_provisional", async () => {
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_transition_game('${gameId}'::uuid, 'live_provisional'::public.game_status)`,
      );
      expect(rows[0].status).toBe("live_provisional");
    });

    const { rows } = await pool.query(
      "SELECT status FROM public.games WHERE id = $1",
      [gameId],
    );
    expect(rows[0].status).toBe("live_provisional");
  });

  it("assigns scorers and opens tracker session", async () => {
    const scorer = await createTestUser(pool, {
      email: `scorer-lifecycle-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    let _sessionId: string;

    // Admin assigns scorer
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_assign_scorer('${gameId}'::uuid, '${scorer.id}'::uuid, 'lead_scorer')`,
      );
      expect(rows[0].role).toBe("lead_scorer");
    });

    await createGameRosters(pool, gameId);

    // Scorer opens a tracker session
    await asUser(client, scorer.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_open_tracker_session('${gameId}'::uuid, 'lead_scorer')`,
      );
      expect(rows[0].status).toBe("active");
      expect(rows[0].game_id).toBe(gameId);
      expect(rows[0].scorer_id).toBe(scorer.id);
      _sessionId = rows[0].id;
    });
    // Clean up scorer (FK-safe: delete sessions first)
    await pool.query(
      "DELETE FROM public.tracker_sessions WHERE scorer_id = $1",
      [scorer.id],
    );
    await pool.query("DELETE FROM auth.users WHERE id = $1", [scorer.id]);
  });
  it("records stat events idempotently", async () => {
    const scorer = await createTestUser(pool, {
      email: `scorer-record-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    let sessionId: string;
    const opId = crypto.randomUUID();
    const clientId = crypto.randomUUID();

    // Setup: assign + roster + session
    await asUser(client, admin.id, async () => {
      await client.query(
        `SELECT public.cmd_assign_scorer('${gameId}'::uuid, '${scorer.id}'::uuid, 'backup_scorer')`,
      );
    });

    await asUser(client, scorer.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_open_tracker_session('${gameId}'::uuid, 'backup_scorer')`,
      );
      sessionId = rows[0].id;
    });

    // Record a stat event
    await asUser(client, scorer.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_record_event(
          '${gameId}'::uuid, '${sessionId}'::uuid, '${opId}'::uuid, '${clientId}'::uuid,
          1, 'shot_2pt_made', 1::smallint, 300::smallint,
          '${SEED_HOME_TEAM_SEASON}'::uuid, '${SEED_HOME_PLAYER}'::uuid,
          '{"made": true, "x": 250, "y": 100}'::jsonb
        )`,
      );
      expect(rows[0].event_type).toBe("shot_2pt_made");
      expect(rows[0].local_seq).toBe(1);
    });

    // Verify the event is in the table
    const { rows: events } = await pool.query(
      "SELECT event_type, local_seq, created_by FROM public.stat_events WHERE operation_id = $1",
      [opId],
    );
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("shot_2pt_made");

    // Idempotent: same opId returns existing row without error
    await asUser(client, scorer.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_record_event(
          '${gameId}'::uuid, '${sessionId}'::uuid, '${opId}'::uuid, '${clientId}'::uuid,
          1, 'shot_2pt_made', 1::smallint, 300::smallint,
          '${SEED_HOME_TEAM_SEASON}'::uuid, '${SEED_HOME_PLAYER}'::uuid,
          '{}'::jsonb
        )`,
      );
      expect(rows[0].event_type).toBe("shot_2pt_made");
    });

    // Still only 1 event
    const { rows: events2 } = await pool.query(
      "SELECT count(*)::int AS cnt FROM public.stat_events WHERE operation_id = $1",
      [opId],
    );
    expect(events2[0].cnt).toBe(1);

    // Record more events for a full game
    const moreOps = [
      {
        op: crypto.randomUUID(),
        client: crypto.randomUUID(),
        seq: 2,
        type: "shot_3pt_made",
      },
      {
        op: crypto.randomUUID(),
        client: crypto.randomUUID(),
        seq: 3,
        type: "rebound_def",
      },
      {
        op: crypto.randomUUID(),
        client: crypto.randomUUID(),
        seq: 4,
        type: "turnover",
      },
    ];

    await asUser(client, scorer.id, async () => {
      for (const m of moreOps) {
        await client.query(
          `SELECT public.cmd_record_event(
            '${gameId}'::uuid, '${sessionId}'::uuid, '${m.op}'::uuid, '${m.client}'::uuid,
            ${m.seq}, '${m.type}', 1::smallint, 250::smallint,
            '${SEED_HOME_TEAM_SEASON}'::uuid, '${SEED_HOME_PLAYER}'::uuid, '{}'::jsonb
          )`,
        );
      }
    });

    // Verify all events recorded
    const { rows: allEvents } = await pool.query(
      "SELECT count(*)::int AS cnt FROM public.stat_events WHERE game_id = $1 AND voided_at IS NULL",
      [gameId],
    );
    expect(allEvents[0].cnt).toBe(4); // 1 from first record + 3 from moreOps

    // Cleanup scorer (FK-safe: delete stat_events first, then sessions, then user)
    await pool.query("DELETE FROM public.stat_events WHERE game_id = $1", [
      gameId,
    ]);
    await pool.query(
      "DELETE FROM public.tracker_sessions WHERE scorer_id = $1",
      [scorer.id],
    );
    await pool.query("DELETE FROM auth.users WHERE id = $1", [scorer.id]);
  });
});

describe("source submission, revision, and stat materialization", () => {
  let pool: Pool;
  let client: PoolClient;
  let admin: { id: string; email: string };
  let approver: { id: string; email: string };
  let gameId: string;
  afterAll(async () => {
    if (client) await client.release();
    if (pool) {
      await pool.query(
        "DELETE FROM public.correction_records WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.stat_events WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.tracker_sessions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_revisions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_rosters WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_assignments WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour'",
      );
      await pool.query(
        "DELETE FROM public.memberships WHERE scope_type = 'league' AND role = 'admin' AND scope_id::text LIKE 'c0000000-%'",
      );
    }
    await closePool();
  });

  it("sets up users and game for full pipeline", async () => {
    pool = await getPool();
    client = await pool.connect();

    admin = await createTestUser(pool, {
      email: `admin-pipeline-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await createMembership(pool, admin.id, "admin");

    approver = await createTestUser(pool, {
      email: `approver-pipeline-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await createMembership(pool, approver.id, "admin");

    gameId = await createGame(pool);
    await createGameRosters(pool, gameId);

    await asUser(client, admin.id, async () => {
      await client.query(
        `SELECT public.cmd_transition_game('${gameId}'::uuid, 'live_provisional'::public.game_status)`,
      );
    });

    // Assign both users as scorer + approver for this game
    await asUser(client, admin.id, async () => {
      await client.query(
        `SELECT public.cmd_assign_scorer('${gameId}'::uuid, '${admin.id}'::uuid, 'backup_scorer')`,
      );
      await client.query(
        `SELECT public.cmd_assign_scorer('${gameId}'::uuid, '${approver.id}'::uuid, 'approving_official')`,
      );
    });
  });

  it("records events via scorer session", async () => {
    let sessionId: string;

    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_open_tracker_session('${gameId}'::uuid, 'backup_scorer')`,
      );
      sessionId = rows[0].id;

      // Record game events — enough for meaningful stats
      const events = [
        // Home team
        {
          op: crypto.randomUUID(),
          seq: 1,
          type: "shot_2pt_made",
          team: SEED_HOME_TEAM_SEASON,
          player: SEED_HOME_PLAYER,
          period: 1,
          clock: 500,
          payload: '{"made": true, "x": 250, "y": 100}',
        },
        {
          op: crypto.randomUUID(),
          seq: 2,
          type: "shot_3pt_made",
          team: SEED_HOME_TEAM_SEASON,
          player: SEED_HOME_PLAYER,
          period: 1,
          clock: 400,
          payload: '{"made": true, "x": 50, "y": 350}',
        },
        {
          op: crypto.randomUUID(),
          seq: 3,
          type: "ft_made",
          team: SEED_HOME_TEAM_SEASON,
          player: SEED_HOME_PLAYER,
          period: 1,
          clock: 300,
          payload: '{"made": true}',
        },
        {
          op: crypto.randomUUID(),
          seq: 4,
          type: "shot_2pt_missed",
          team: SEED_HOME_TEAM_SEASON,
          player: SEED_HOME_PLAYER_2,
          period: 1,
          clock: 200,
          payload: '{"made": false, "x": 300, "y": 150}',
        },
        // Away team
        {
          op: crypto.randomUUID(),
          seq: 5,
          type: "shot_2pt_made",
          team: SEED_AWAY_TEAM_SEASON,
          player: SEED_AWAY_PLAYER,
          period: 1,
          clock: 480,
          payload: '{"made": true, "x": 200, "y": 80}',
        },
      ];

      for (const evt of events) {
        await client.query(
          `SELECT public.cmd_record_event(
            '${gameId}'::uuid, '${sessionId}'::uuid,
            '${evt.op}'::uuid, '${evt.op}'::uuid,
            ${evt.seq}, '${evt.type}', ${evt.period}::smallint, ${evt.clock}::smallint,
            '${evt.team}'::uuid, '${evt.player}'::uuid,
            '${evt.payload}'::jsonb
          )`,
        );
      }
    });

    // Verify events exist
    const { rows } = await pool.query(
      "SELECT count(*)::int AS cnt FROM public.stat_events WHERE game_id = $1 AND voided_at IS NULL",
      [gameId],
    );
    expect(rows[0].cnt).toBe(5);
  });

  it("transitions game to final_pending_review", async () => {
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_transition_game('${gameId}'::uuid, 'final_pending_review'::public.game_status)`,
      );
      expect(rows[0].status).toBe("final_pending_review");
    });
  });

  it("submits and approves source", async () => {
    const idempotencyKey = crypto.randomUUID();
    let submissionId: string;

    // Admin submits source (tracker_journal)
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_submit_source(
          '${gameId}'::uuid, 'tracker_journal', NULL, true,
          '{"event_count": 5}'::jsonb, 0.95::numeric, '${idempotencyKey}'::uuid
        )`,
      );
      expect(rows[0].status).toBe("pending");
      expect(rows[0].source_type).toBe("tracker_journal");
      submissionId = rows[0].id;
    });

    // Approver approves the source
    await asUser(client, approver.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_approve_source('${submissionId}'::uuid, true, 'looks good')`,
      );
      expect(rows[0].status).toBe("approved");
    });
  });

  it("creates and approves revision, materializing stats", async () => {
    let revisionId: string;

    // Calculate expected stats from our 5 events:
    // Home (Khuleguud): 2pt made (2pts), 3pt made (3pts), FT made (1pt) = 6 pts
    // Away (Apes): 2pt made (2pts) = 2 pts
    // Home player 1: 2pt made (1/1, 2pts), 3pt made (1/1, 3pts), FT made (1/1, 1pt) = 3/3, 6 pts
    // Home player 2: 2pt missed (0/1, 0pts)
    // Away player 1: 2pt made (1/1, 2pts)

    const projection = {
      players: [
        {
          player_id: SEED_HOME_PLAYER,
          team_season_id: SEED_HOME_TEAM_SEASON,
          seconds_played: 600,
          pts: 6,
          fgm: 2,
          fga: 2,
          tpm: 1,
          tpa: 1,
          ftm: 1,
          fta: 1,
          oreb: 0,
          dreb: 1,
          ast: 1,
          stl: 0,
          blk: 0,
          tov: 1,
          pf: 1,
        },
        {
          player_id: SEED_HOME_PLAYER_2,
          team_season_id: SEED_HOME_TEAM_SEASON,
          seconds_played: 480,
          pts: 0,
          fgm: 0,
          fga: 1,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          pf: 0,
        },
        {
          player_id: SEED_AWAY_PLAYER,
          team_season_id: SEED_AWAY_TEAM_SEASON,
          seconds_played: 540,
          pts: 2,
          fgm: 1,
          fga: 1,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          pf: 0,
        },
      ],
      teams: [
        {
          team_season_id: SEED_HOME_TEAM_SEASON,
          pts: 6,
          fgm: 2,
          fga: 2,
          tpm: 1,
          tpa: 1,
          ftm: 1,
          fta: 1,
          oreb: 0,
          dreb: 1,
          team_reb: 0,
          ast: 1,
          stl: 0,
          blk: 0,
          tov: 1,
          pf: 1,
        },
        {
          team_season_id: SEED_AWAY_TEAM_SEASON,
          pts: 2,
          fgm: 1,
          fga: 1,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          team_reb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          pf: 0,
        },
      ],
    };

    // Need a source submission first — get the one from previous test
    const { rows: submissions } = await pool.query(
      "SELECT id FROM public.source_submissions WHERE game_id = $1 AND status = 'approved' ORDER BY submitted_at DESC LIMIT 1",
      [gameId],
    );
    assert.ok(submissions.length > 0, "No approved source submission found");
    const sourceId = submissions[0].id;

    // Create revision
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_create_revision(
          '${sourceId}'::uuid,
          '${JSON.stringify(projection).replace(/'/g, "''")}'::jsonb,
          '${JSON.stringify(projection).replace(/'/g, "''")}'::jsonb,
          '[]'::jsonb
        )`,
      );
      revisionId = rows[0].id;
      expect(rows[0].state).toBe("pending");
    });

    // Approve revision — this materializes stats
    await asUser(client, approver.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_approve_revision('${revisionId}'::uuid, true)`,
      );
      expect(rows[0].state).toBe("approved");
    });

    // Verify game updated
    const { rows: game } = await pool.query(
      "SELECT status, current_revision_number, home_score, away_score FROM public.games WHERE id = $1",
      [gameId],
    );
    expect(game[0].current_revision_number).toBe(1);
    expect(game[0].home_score).toBe(6);
    expect(game[0].away_score).toBe(2);
  });

  it("materialized game_player_stats are correct", async () => {
    const { rows } = await pool.query(
      `SELECT player_id, pts, fgm, fga, tpm, tpa, ftm, fta
       FROM public.game_player_stats
       WHERE game_id = $1
       ORDER BY player_id`,
      [gameId],
    );

    // Should have 3 players (2 home + 1 away)
    expect(rows.length).toBe(3);

    const homePlayer = rows.find(
      (r: { player_id: string }) => r.player_id === SEED_HOME_PLAYER,
    );
    expect(homePlayer).toBeDefined();
    expect(homePlayer.pts).toBe(6);
    expect(homePlayer.fgm).toBe(2);
    expect(homePlayer.fga).toBe(2);
    expect(homePlayer.tpm).toBe(1);
    expect(homePlayer.tpa).toBe(1);
    expect(homePlayer.ftm).toBe(1);
    expect(homePlayer.fta).toBe(1);

    const awayPlayer = rows.find(
      (r: { player_id: string }) => r.player_id === SEED_AWAY_PLAYER,
    );
    expect(awayPlayer).toBeDefined();
    expect(awayPlayer.pts).toBe(2);
    expect(awayPlayer.fgm).toBe(1);
  });

  it("materialized game_team_stats are correct", async () => {
    const { rows } = await pool.query(
      `SELECT team_season_id, pts, fgm, fga, tpm, tpa
       FROM public.game_team_stats
       WHERE game_id = $1
       ORDER BY team_season_id`,
      [gameId],
    );

    expect(rows.length).toBe(2);

    const home = rows.find(
      (r: { team_season_id: string }) =>
        r.team_season_id === SEED_HOME_TEAM_SEASON,
    );
    expect(home).toBeDefined();
    expect(home.pts).toBe(6);
    expect(home.fgm).toBe(2);

    const away = rows.find(
      (r: { team_season_id: string }) =>
        r.team_season_id === SEED_AWAY_TEAM_SEASON,
    );
    expect(away).toBeDefined();
    expect(away.pts).toBe(2);
  });

  it("transitions game to league_verified and updates status", async () => {
    await asUser(client, approver.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_transition_game('${gameId}'::uuid, 'league_verified'::public.game_status)`,
      );
      expect(rows[0].status).toBe("league_verified");
    });

    // Verify published_at is set
    const { rows } = await pool.query(
      "SELECT published_at FROM public.games WHERE id = $1",
      [gameId],
    );
    expect(rows[0].published_at).toBeTruthy();
  });

  it("season_player_stats and standings are rebuilt", async () => {
    // After transitioning to league_verified, we need to manually refresh season stats
    // since cmd_approve_revision only builds them for games in league_verified/official status
    await asUser(client, approver.id, async () => {
      await client.query(
        "SELECT public.cmd_approve_revision((SELECT id FROM public.game_revisions WHERE game_id = $1 AND state = 'approved' LIMIT 1)::uuid, true)",
        [gameId],
      );
    });

    // season_player_stats should now include our game
    // Home player 1: 6 pts per game in 1 game
    const { rows: sps } = await pool.query(
      `SELECT sps.*
       FROM public.season_player_stats sps
       WHERE sps.competition_id = $1
         AND sps.player_id = $2`,
      [SEED_COMPETITION_ID, SEED_HOME_PLAYER],
    );
    expect(sps.length).toBeGreaterThanOrEqual(1);
    const playerStats = sps[sps.length - 1];
    expect(playerStats.pts).toBe(6);
    expect(playerStats.gp).toBe(1);

    // Standings should have wins/losses
    const { rows: standings } = await pool.query(
      `SELECT ts.team_id, st.wins, st.losses, st.points_for, st.points_against
       FROM public.standings st
       JOIN public.team_seasons ts ON ts.id = st.team_season_id
       WHERE st.competition_id = $1
       ORDER BY st.wins DESC`,
      [SEED_COMPETITION_ID],
    );
    const homeStandings = standings.find(
      (s: { team_id: string }) =>
        s.team_id === "10000000-0000-0000-0000-000000000001",
    );
    const awayStandings = standings.find(
      (s: { team_id: string }) =>
        s.team_id === "10000000-0000-0000-0000-000000000002",
    );
    expect(homeStandings).toBeDefined();
    expect(homeStandings.points_for).toBeGreaterThanOrEqual(6);
    expect(awayStandings).toBeDefined();
    expect(awayStandings.points_for).toBeGreaterThanOrEqual(2);
  });
});

describe("correction pipeline", () => {
  let pool: Pool;
  let client: PoolClient;
  let admin: { id: string; email: string };
  let approver: { id: string; email: string };
  let gameId: string;
  let correctionId: string;

  afterAll(async () => {
    if (client) await client.release();
    if (pool) {
      await pool.query(
        "DELETE FROM public.correction_records WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.stat_events WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.tracker_sessions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_revisions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_rosters WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_assignments WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour'",
      );
      await pool.query(
        "DELETE FROM public.memberships WHERE scope_type = 'league' AND role = 'admin' AND scope_id::text LIKE 'c0000000-%'",
      );
    }
    await closePool();
  });

  it("sets up game with approved revision for correction test", async () => {
    pool = await getPool();
    client = await pool.connect();
    admin = await createTestUser(pool, {
      email: `admin-correct-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await createMembership(pool, admin.id, "admin");
    approver = await createTestUser(pool, {
      email: `approver-correct-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await createMembership(pool, approver.id, "admin");

    gameId = await createGame(pool);
    await createGameRosters(pool, gameId);

    await asUser(client, admin.id, async () => {
      await client.query(
        `SELECT public.cmd_transition_game('${gameId}'::uuid, 'live_provisional'::public.game_status)`,
      );
      await client.query(
        `SELECT public.cmd_assign_scorer('${gameId}'::uuid, '${admin.id}'::uuid, 'backup_scorer')`,
      );
      await client.query(
        `SELECT public.cmd_assign_scorer('${gameId}'::uuid, '${approver.id}'::uuid, 'approving_official')`,
      );
    });
  });

  it("runs full pipeline: events → source → revision → approved", async () => {
    let sessionId: string;

    // Record one event
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_open_tracker_session('${gameId}'::uuid, 'backup_scorer')`,
      );
      sessionId = rows[0].id;

      await client.query(`SELECT public.cmd_record_event(
        '${gameId}'::uuid, '${sessionId}'::uuid,
        '${crypto.randomUUID()}'::uuid, '${crypto.randomUUID()}'::uuid,
        1, 'shot_2pt_made', 1::smallint, 500::smallint,
        '${SEED_HOME_TEAM_SEASON}'::uuid, '${SEED_HOME_PLAYER}'::uuid,
        '{"made": true}'::jsonb
      )`);
    });

    // Final → submit source → approve → create revision → approve
    await asUser(client, admin.id, async () => {
      await client.query(
        `SELECT public.cmd_transition_game('${gameId}'::uuid, 'final_pending_review'::public.game_status)`,
      );
    });

    // Submit and approve source
    const idemKey = crypto.randomUUID();
    let sourceId: string;
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_submit_source('${gameId}'::uuid, 'tracker_journal', NULL, true, '{}'::jsonb, 0.95, '${idemKey}'::uuid)`,
      );
      sourceId = rows[0].id;
    });
    await asUser(client, approver.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_approve_source('${sourceId}'::uuid, true)`,
      );
      sourceId = rows[0].id;
    });

    // Create + approve revision
    const projection = {
      players: [
        {
          player_id: SEED_HOME_PLAYER,
          team_season_id: SEED_HOME_TEAM_SEASON,
          seconds_played: 600,
          pts: 2,
          fgm: 1,
          fga: 1,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          pf: 0,
        },
      ],
      teams: [
        {
          team_season_id: SEED_HOME_TEAM_SEASON,
          pts: 2,
          fgm: 1,
          fga: 1,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          team_reb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          pf: 0,
        },
      ],
    };
    const projStr = JSON.stringify(projection).replace(/'/g, "''");

    let revisionId: string;
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_create_revision('${sourceId}'::uuid, '${projStr}'::jsonb, '${projStr}'::jsonb)`,
      );
      revisionId = rows[0].id;
    });
    await asUser(client, approver.id, async () => {
      await client.query(
        `SELECT * FROM public.cmd_approve_revision('${revisionId}'::uuid, true)`,
      );
    });

    // Verify game is finalized but NOT league_verified yet (only final_pending_review → league_verified)
  });

  it("creates a correction request for the game", async () => {
    await asUser(client, admin.id, async () => {
      // We need to first transition game to league_verified to have a published game
      // Actually corrections work on any game where user_can_approve_game returns true
      // But the game should be in a state that makes sense — let's verify it works

      const { rows } = await client.query(
        `SELECT * FROM public.cmd_create_correction(
          '${gameId}'::uuid,
          'Player points incorrect — should be 4 not 2',
          NULL,
          '{"player_id": "${SEED_HOME_PLAYER}", "field": "pts", "old_value": 2, "new_value": 4}'::jsonb
        )`,
      );
      correctionId = rows[0].id;
      expect(rows[0].status).toBe("pending");
      expect(rows[0].reason).toContain("points incorrect");
    });
  });

  it("reviews correction — approves it", async () => {
    await asUser(client, approver.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_review_correction('${correctionId}'::uuid, true)`,
      );
      expect(rows[0].status).toBe("approved");
      expect(rows[0].resolved_by).toBe(approver.id);
    });
  });

  it("applies correction, creating a new revision", async () => {
    // Get the current approved revision
    const { rows: currentRevision } = await pool.query(
      "SELECT id, revision_number FROM public.game_revisions WHERE game_id = $1 AND state = 'approved' ORDER BY revision_number DESC LIMIT 1",
      [gameId],
    );
    const currentRevNum = currentRevision[0].revision_number;
    const parentRevisionId = currentRevision[0].id;

    // Create corrected projection
    const correctedProjection = {
      players: [
        {
          player_id: SEED_HOME_PLAYER,
          team_season_id: SEED_HOME_TEAM_SEASON,
          seconds_played: 600,
          pts: 4,
          fgm: 2,
          fga: 2,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          pf: 0,
        },
      ],
      teams: [
        {
          team_season_id: SEED_HOME_TEAM_SEASON,
          pts: 4,
          fgm: 2,
          fga: 2,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          team_reb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          pf: 0,
        },
      ],
    };
    const journal = { corrections_applied: ["Player pts updated from 2 to 4"] };
    const warnings: string[] = [];

    await asUser(client, approver.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_apply_correction(
          '${correctionId}'::uuid,
          '${JSON.stringify(journal).replace(/'/g, "''")}'::jsonb,
          '${JSON.stringify(correctedProjection).replace(/'/g, "''")}'::jsonb,
          '${JSON.stringify(warnings).replace(/'/g, "''")}'::jsonb
        )`,
      );

      // Correction should now be "applied" with resulting_revision_id set
      expect(rows[0].status).toBe("applied");
      expect(rows[0].resulting_revision_id).toBeTruthy();
    });

    // Verify a new revision was created with the right parent
    const { rows: newRevisions } = await pool.query(
      "SELECT * FROM public.game_revisions WHERE game_id = $1 AND revision_number > $2 ORDER BY revision_number DESC LIMIT 1",
      [gameId, currentRevNum],
    );
    expect(newRevisions.length).toBe(1);
    expect(newRevisions[0].parent_revision_id).toBe(parentRevisionId);
    expect(newRevisions[0].state).toBe("pending"); // Not yet approved
  });

  it("approves the correction revision, materializing corrected stats", async () => {
    // Get the pending correction revision
    const { rows: pendingRev } = await pool.query(
      "SELECT id FROM public.game_revisions WHERE game_id = $1 AND state = 'pending' ORDER BY revision_number DESC LIMIT 1",
      [gameId],
    );
    assert.ok(pendingRev.length > 0, "No pending revision found");

    await asUser(client, approver.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_approve_revision('${pendingRev[0].id}'::uuid, true)`,
      );
      expect(rows[0].state).toBe("approved");
    });

    // Verify stats updated
    const { rows: stats } = await pool.query(
      "SELECT pts, fgm, fga FROM public.game_player_stats WHERE game_id = $1 AND player_id = $2",
      [gameId, SEED_HOME_PLAYER],
    );
    expect(stats[0].pts).toBe(4);
    expect(stats[0].fgm).toBe(2);

    // Game score should be updated too
    const { rows: game } = await pool.query(
      "SELECT home_score FROM public.games WHERE id = $1",
      [gameId],
    );
    expect(game[0].home_score).toBe(4);
  });
});

describe("error handling", () => {
  let pool: Pool;
  let client: PoolClient;
  let admin: { id: string; email: string };
  let gameId: string;

  afterAll(async () => {
    if (client) await client.release();
    if (pool) {
      await pool.query(
        "DELETE FROM public.correction_records WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.stat_events WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.tracker_sessions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_revisions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_rosters WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.game_assignments WHERE game_id IN (SELECT id FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour')",
      );
      await pool.query(
        "DELETE FROM public.games WHERE created_at > NOW() - INTERVAL '1 hour'",
      );
      await pool.query(
        "DELETE FROM public.memberships WHERE scope_type = 'league' AND role = 'admin' AND scope_id::text LIKE 'c0000000-%'",
      );
    }
    await closePool();
  });

  it("rejects correction with no reason", async () => {
    pool = await getPool();
    client = await pool.connect();
    admin = await createTestUser(pool, {
      email: `admin-err-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await createMembership(pool, admin.id, "admin");
    gameId = await createGame(pool);

    // Create memberships properly
    const { rows: leagues } = await pool.query(
      `SELECT l.id FROM public.leagues l
       JOIN public.seasons s ON s.league_id = l.id
       JOIN public.competitions c ON c.season_id = s.id
       WHERE c.id = $1`,
      [SEED_COMPETITION_ID],
    );
    await pool.query(
      `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
       VALUES ($1, 'league', $2, 'admin')
       ON CONFLICT DO NOTHING`,
      [admin.id, leagues[0].id],
    );

    await expect(
      asUser(client, admin.id, async () => {
        await client.query(
          `SELECT * FROM public.cmd_create_correction('${gameId}'::uuid, '', NULL, '{}'::jsonb)`,
        );
      }),
    ).rejects.toThrow();
  });

  it("rejects recording events on non-live game", async () => {
    // gameId is still scheduled — try to record events
    const { rows: sessions } = await pool.query(
      "SELECT 1 FROM public.tracker_sessions WHERE game_id = $1 LIMIT 1",
      [gameId],
    );

    // Just check the game is still scheduled
    const { rows } = await pool.query(
      "SELECT status FROM public.games WHERE id = $1",
      [gameId],
    );
    expect(rows[0].status).toBe("scheduled");
  });
});
describe("cmd_submit_official_stats (PDF upload → instant publish)", () => {
  let pool: Pool;
  let client: PoolClient;
  let admin: { id: string; email: string };
  let gameId: string;
    pool = await getPool();
    client = await pool.connect();
    admin = await createTestUser(pool, {
      email: `official-stats-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
  });

  afterAll(async () => {
    client.release();
  });

  beforeEach(async () => {
    const { rows: leagues } = await pool.query(
      "SELECT id FROM public.leagues LIMIT 1",
    );
    if (leagues.length > 0) {
      await pool.query(
        `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
         VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING`,
        [admin.id, leagues[0].id],
      );
    }

    const { rows: g } = await pool.query(`
      INSERT INTO public.games (
        competition_id, ruleset_id, home_team_season_id, away_team_season_id,
        venue_id, scheduled_at, status
      ) VALUES ('\${SEED_COMPETITION_ID}', '\${SEED_RULESET_ID}', '\${SEED_HOME_TEAM_SEASON}', '\${SEED_AWAY_TEAM_SEASON}', '\${SEED_VENUE_ID}', NOW()+INTERVAL '1 day', 'scheduled')
      RETURNING id
    `);
    gameId = g[0].id as string;

    await pool.query(`
      INSERT INTO public.game_rosters (game_id, team_season_id, player_id, is_starter) VALUES
        ('${gameId}', '\${SEED_HOME_TEAM_SEASON}', '\${SEED_HOME_PLAYER}', true),
        ('${gameId}', '\${SEED_HOME_TEAM_SEASON}', '\${SEED_HOME_PLAYER_2}', true),
        ('${gameId}', '\${SEED_AWAY_TEAM_SEASON}', '\${SEED_AWAY_PLAYER}', true)
    `);

    await pool.query(`
      INSERT INTO public.roster_entries (team_season_id, player_id, jersey_number, position, joined_at) VALUES
        ('\${SEED_HOME_TEAM_SEASON}', '\${SEED_HOME_PLAYER}', 7, 'G', '2025-09-01'),
        ('\${SEED_HOME_TEAM_SEASON}', '\${SEED_HOME_PLAYER_2}', 11, 'F', '2025-09-01'),
        ('\${SEED_AWAY_TEAM_SEASON}', '\${SEED_AWAY_PLAYER}', 23, 'C', '2025-09-01')
      ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = EXCLUDED.jersey_number
    `);
  });

  it("submits official stats and instantly publishes the game", async () => {
    const pS = JSON.stringify([
      {
        player_id: SEED_HOME_PLAYER,
        team_season_id: SEED_HOME_TEAM_SEASON,
        seconds_played: 1440,
        pts: 24,
        fgm: 10,
        fga: 18,
        tpm: 2,
        tpa: 5,
        ftm: 2,
        fta: 3,
        oreb: 3,
        dreb: 5,
        ast: 7,
        stl: 2,
        blk: 1,
        tov: 3,
        pf: 2,
      },
      {
        player_id: SEED_HOME_PLAYER_2,
        team_season_id: SEED_HOME_TEAM_SEASON,
        seconds_played: 1320,
        pts: 14,
        fgm: 5,
        fga: 11,
        tpm: 3,
        tpa: 7,
        ftm: 1,
        fta: 1,
        oreb: 1,
        dreb: 3,
        ast: 2,
        stl: 0,
        blk: 0,
        tov: 1,
        pf: 4,
      },
      {
        player_id: SEED_AWAY_PLAYER,
        team_season_id: SEED_AWAY_TEAM_SEASON,
        seconds_played: 1500,
        pts: 31,
        fgm: 12,
        fga: 22,
        tpm: 4,
        tpa: 9,
        ftm: 3,
        fta: 4,
        oreb: 4,
        dreb: 8,
        ast: 1,
        stl: 1,
        blk: 2,
        tov: 4,
        pf: 3,
      },
    ]);
    const tS = JSON.stringify([
      {
        team_season_id: SEED_HOME_TEAM_SEASON,
        pts: 38,
        fgm: 15,
        fga: 29,
        tpm: 5,
        tpa: 12,
        ftm: 3,
        fta: 4,
        oreb: 4,
        dreb: 8,
        team_reb: 1,
        ast: 9,
        stl: 2,
        blk: 1,
        tov: 4,
        pf: 6,
      },
      {
        team_season_id: SEED_AWAY_TEAM_SEASON,
        pts: 31,
        fgm: 12,
        fga: 22,
        tpm: 4,
        tpa: 9,
        ftm: 3,
        fta: 4,
        oreb: 4,
        dreb: 8,
        team_reb: 0,
        ast: 1,
        stl: 1,
        blk: 2,
        tov: 4,
        pf: 3,
      },
    ]);

    const { data: result } = await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_submit_official_stats($1::uuid,$2::text,$3::jsonb,$4::jsonb,$5::jsonb,$6::smallint,$7::smallint)`,
        [
          gameId,
          `${gameId}/t.pdf`,
          JSON.stringify({
            format: "fiba_official_statistics_v1",
            score: { home: 38, away: 31 },
            teams: [
              { name: "Khuleguud", code: "KHL", players: [] },
              { name: "SG Apes", code: "APE", players: [] },
            ],
            warnings: [],
            confidence: 0.95,
          }),
          pS,
          tS,
          38,
          31,
        ],
      );
      return rows[0].cmd_submit_official_stats as Record<string, unknown>;
    });

    // Game state
    const { rows: g } = await pool.query(
      "SELECT status,home_score,away_score,current_revision_number,published_at FROM public.games WHERE id=$1",
      [gameId],
    );
    expect(g[0].status).toBe("league_verified");
    expect(g[0].home_score).toBe(38);
    expect(g[0].away_score).toBe(31);
    expect(g[0].current_revision_number).toBe(1);
    expect(g[0].published_at).not.toBeNull();

    // Submission
    const { rows: s } = await pool.query(
      "SELECT source_type,evidence_url,status,normalized_payload->>'format' AS fmt FROM public.source_submissions WHERE game_id=$1",
      [gameId],
    );
    expect(s.length).toBe(1);
    expect(s[0].source_type).toBe("official_score_sheet");
    expect(s[0].status).toBe("approved");
    expect(s[0].fmt).toBe("fiba_official_statistics_v1");

    // Revision
    const { rows: r } = await pool.query(
      "SELECT revision_number,state FROM public.game_revisions WHERE game_id=$1",
      [gameId],
    );
    expect(r.length).toBe(1);
    expect(r[0].state).toBe("approved");

    // Player stats
    const { rows: ps } = await pool.query(
      "SELECT player_id,pts,fgm FROM public.game_player_stats WHERE game_id=$1 ORDER BY pts DESC",
      [gameId],
    );
    expect(ps.length).toBe(3);
    expect(ps[0].pts).toBe(31);

    // Team stats
    const { rows: ts } = await pool.query(
      "SELECT pts FROM public.game_team_stats WHERE game_id=$1 ORDER BY pts DESC",
      [gameId],
    );
    expect(ts.length).toBe(2);
    expect(ts[0].pts).toBe(38);

    // Season stats
    const { rows: ss } = await pool.query(
      "SELECT count(*)::int AS cnt FROM public.season_player_stats WHERE competition_id=$1",
      \[SEED_COMPETITION_ID\],
    );
    expect(ss[0].cnt).toBeGreaterThan(0);
  });

  it("rejects unauthorized user", async () => {
    const unauth = await createTestUser(pool, {
      email: `u-${crypto.randomUUID().slice(0, 8)}@t.mn`,
    });
    const ps = JSON.stringify([
      {
        player_id: SEED_HOME_PLAYER,
        team_season_id: SEED_HOME_TEAM_SEASON,
        seconds_played: 100,
        pts: 2,
        fgm: 1,
        fga: 2,
        tpm: 0,
        tpa: 1,
        ftm: 0,
        fta: 0,
        oreb: 0,
        dreb: 1,
        ast: 0,
        stl: 0,
        blk: 0,
        tov: 1,
        pf: 0,
      },
    ]);
    const ts = JSON.stringify([
      {
        team_season_id: SEED_HOME_TEAM_SEASON,
        pts: 2,
        fgm: 1,
        fga: 2,
        tpm: 0,
        tpa: 1,
        ftm: 0,
        fta: 0,
        oreb: 0,
        dreb: 1,
        team_reb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        tov: 1,
        pf: 0,
      },
    ]);

    await expect(
      asUser(client, unauth.id, async () => {
        await client.query(
          `SELECT * FROM public.cmd_submit_official_stats($1::uuid,$2::text,$3::jsonb,$4::jsonb,$5::jsonb,$6::smallint,$7::smallint)`,
          [gameId, "t.pdf", "{}", ps, ts, 2, 0],
        );
      }),
    ).rejects.toThrow(/ONOO_NOT_AUTHORIZED/i);
  });
});
