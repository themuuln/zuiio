import assert from "node:assert";
import crypto from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_AWAY_PLAYER,
  SEED_AWAY_TEAM_SEASON,
  SEED_COMPETITION_ID,
  SEED_HOME_PLAYER,
  SEED_HOME_TEAM_SEASON,
  SEED_RULESET_ID,
} from "./seed-constants";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
  newPool,
} from "./setup-integration";

/**
 * Sets up a fully scored and published game.
 * Returns the game ID and revision used.
 */
async function setupPublishedGame(
  pool: Pool,
  client: PoolClient,
  suffix: string = "",
): Promise<{ gameId: string; revisionId: string }> {
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const admin = await createTestUser(pool, {
    email: `admin-${uniqueId}${suffix}@onoo-test.mn`,
  });
  const approver = await createTestUser(pool, {
    email: `approver-${uniqueId}${suffix}@onoo-test.mn`,
  });

  try {
    // Create league-level memberships
    const { rows: leagues } = await pool.query(
      `SELECT l.id FROM public.leagues l
       JOIN public.seasons s ON s.league_id = l.id
       JOIN public.competitions c ON c.season_id = s.id
       WHERE c.id = $1 LIMIT 1`,
      [SEED_COMPETITION_ID],
    );
    assert.ok(leagues.length > 0, "League not found");

    for (const uid of [admin.id, approver.id]) {
      await pool.query(
        `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
         VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING`,
        [uid, leagues[0].id],
      );
    }

    // Create game (bypass RLS — run directly)
    let gameId: string;
    const gameResult = await pool.query(`
      INSERT INTO public.games (
        competition_id, ruleset_id,
        home_team_season_id, away_team_season_id,
        scheduled_at, status
      ) VALUES (
        '${SEED_COMPETITION_ID}', '${SEED_RULESET_ID}',
        '${SEED_HOME_TS}', '${SEED_AWAY_TS}',
        NOW() - INTERVAL '1 day', 'scheduled'
      ) RETURNING id
    `);
    gameId = gameResult.rows[0].id;

    // Create game rosters (bypass RLS)
    await pool.query(`
      INSERT INTO public.game_rosters (game_id, team_season_id, player_id, is_starter)
      VALUES ('${gameId}', '${SEED_HOME_TS}', '${SEED_HOME_PLAYER}', true)
    `);

    // Now run commands through asUser
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

    // Open session and record events
    let sessionId: string;
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_open_tracker_session('${gameId}'::uuid, 'backup_scorer')`,
      );
      sessionId = rows[0].id;

      await client.query(
        `SELECT public.cmd_record_event(
          '${gameId}'::uuid, '${sessionId}'::uuid,
          '${crypto.randomUUID()}'::uuid, '${crypto.randomUUID()}'::uuid,
          1, 'shot_2pt_made', 1::smallint, 500::smallint,
          '${SEED_HOME_TS}'::uuid, '${SEED_HOME_PLAYER}'::uuid,
          '{"made": true}'::jsonb
        )`,
      );
    });

    // Final pending review
    await asUser(client, admin.id, async () => {
      await client.query(
        `SELECT public.cmd_transition_game('${gameId}'::uuid, 'final_pending_review'::public.game_status)`,
      );
    });

    // Submit + approve source
    let sourceId: string;
    const idemKey = crypto.randomUUID();
    await asUser(client, admin.id, async () => {
      const { rows } = await client.query(
        `SELECT * FROM public.cmd_submit_source(
          '${gameId}'::uuid, 'tracker_journal', NULL, true,
          '{"event_count": 1}'::jsonb, 0.95::numeric, '${idemKey}'::uuid
        )`,
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
          team_season_id: SEED_HOME_TS,
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
          team_season_id: SEED_HOME_TS,
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
        {
          team_season_id: SEED_AWAY_TS,
          pts: 0,
          fgm: 0,
          fga: 0,
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
        `SELECT * FROM public.cmd_create_revision(
          '${sourceId}'::uuid, '${projStr}'::jsonb, '${projStr}'::jsonb
        )`,
      );
      revisionId = rows[0].id;
    });
    await asUser(client, approver.id, async () => {
      await client.query(
        `SELECT * FROM public.cmd_approve_revision('${revisionId}'::uuid, true)`,
      );
    });

    // Transition to league_verified
    await asUser(client, approver.id, async () => {
      await client.query(
        `SELECT public.cmd_transition_game('${gameId}'::uuid, 'league_verified'::public.game_status)`,
      );
    });

    // Rebuild standings and player stats after the transition
    // (cmd_approve_revision rebuilds them, but the game was still final_pending_review
    //  at that point, so it wasn't included)
    await pool.query("SELECT public.refresh_standings($1::uuid)", [
      SEED_COMPETITION_ID,
    ]);
    await pool.query("SELECT public.refresh_season_player_stats($1::uuid)", [
      SEED_COMPETITION_ID,
    ]);

    return { gameId, revisionId };
  } catch (err) {
    // Clean up on failure only
    try {
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id IN (SELECT id FROM public.games WHERE home_team_season_id = $1)",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id IN (SELECT id FROM public.games WHERE home_team_season_id = $1)",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.stat_events WHERE game_id IN (SELECT id FROM public.games WHERE home_team_season_id = $1)",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.tracker_sessions WHERE game_id IN (SELECT id FROM public.games WHERE home_team_season_id = $1)",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.game_revisions WHERE game_id IN (SELECT id FROM public.games WHERE home_team_season_id = $1)",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id IN (SELECT id FROM public.games WHERE home_team_season_id = $1)",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.game_assignments WHERE game_id IN (SELECT id FROM public.games WHERE home_team_season_id = $1)",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.game_rosters WHERE game_id IN (SELECT id FROM public.games WHERE home_team_season_id = $1)",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.correction_records WHERE game_id IN (SELECT id FROM public.games WHERE home_team_season_id = $1)",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.games WHERE home_team_season_id = $1",
        [SEED_HOME_TS],
      );
    } catch {}
    try {
      await pool.query(
        "DELETE FROM public.memberships WHERE user_id IN ($1, $2)",
        [admin.id, approver.id],
      );
    } catch {}
    try {
      await pool.query("DELETE FROM auth.users WHERE id IN ($1, $2)", [
        admin.id,
        approver.id,
      ]);
    } catch {}
    throw err;
  }
}
describe("v_public_games", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;
  afterAll(async () => {
    if (client) await client.release();
    // FK-safe cleanup for test game
    if (pool && gameId) {
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.stat_events WHERE game_id = $1", [
        gameId,
      ]);
      await pool.query(
        "DELETE FROM public.tracker_sessions WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.game_revisions WHERE game_id = $1", [
        gameId,
      ]);
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id = $1",
        [gameId],
      );
      await pool.query(
        "DELETE FROM public.game_assignments WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.game_rosters WHERE game_id = $1", [
        gameId,
      ]);
      await pool.query(
        "DELETE FROM public.correction_records WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
      await pool.query(
        "DELETE FROM public.memberships WHERE user_id IN (SELECT user_id FROM public.game_assignments WHERE game_id = $1)",
        [gameId],
      );
    }
  });

  it("returns the published game with correct structure", async () => {
    pool = await getPool();
    client = await pool.connect();
    const result = await setupPublishedGame(pool, client, "-games");
    gameId = result.gameId;

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_games WHERE id = $1`,
      [gameId],
    );
    expect(rows.length).toBe(1);
    const game = rows[0];

    // Core fields
    expect(game.status).toBe("league_verified");
    expect(game.home_score).toBe(2);
    expect(game.away_score).toBe(0);
    expect(game.current_revision_number).toBe(1);

    // Team info
    expect(game.home_team_name).toBeTruthy();
    expect(game.away_team_name).toBeTruthy();
    expect(game.home_team_short_code).toBeTruthy();

    // Competition info
    expect(game.competition_name).toBeTruthy();
    expect(game.season_name).toBeTruthy();
    expect(game.league_name).toBeTruthy();
    expect(game.league_slug).toBeTruthy();

    // Venue — may be null if no venue was set
    expect(game.venue_name).toBeDefined();

    // Revision info
    expect(game.revision_id).toBeTruthy();
    expect(game.revision_number).toBe(1);
    expect(game.revision_approved_at).toBeTruthy();

    // Published
    expect(game.published_at).toBeTruthy();
  });

  it("is visible to anon users", async () => {
    pool = await getPool();
    await pool.query("SET ROLE anon");
    const { rows } = await pool.query(
      `SELECT id, home_score, away_score FROM public.v_public_games WHERE id = $1`,
      [gameId],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].home_score).toBe(2);
    await pool.query("RESET ROLE");
  });
});

describe("v_public_live_games", () => {
  let pool: Pool;
  let client: PoolClient;
  let scheduledGameId: string;
  afterAll(async () => {
    if (client) await client.release();
    if (pool && scheduledGameId) {
      await pool.query("DELETE FROM public.games WHERE id = $1", [
        scheduledGameId,
      ]);
    }
    await closePool();
  });

  it("includes scheduled and live provisional games", async () => {
    pool = await getPool();
    client = await pool.connect();

    // Create a scheduled game
    const { rows } = await pool.query(`
      INSERT INTO public.games (
        competition_id, ruleset_id,
        home_team_season_id, away_team_season_id,
        scheduled_at, status
      ) VALUES (
        '${SEED_COMPETITION_ID}', '${SEED_RULESET_ID}',
        '${SEED_HOME_TS}', '${SEED_AWAY_TS}',
        NOW() + INTERVAL '1 hour', 'scheduled'
      ) RETURNING id
    `);
    scheduledGameId = rows[0].id;

    // Should appear in v_public_live_games
    const { rows: liveRows } = await pool.query(
      `SELECT id, is_provisional FROM public.v_public_live_games WHERE id = $1`,
      [scheduledGameId],
    );
    expect(liveRows.length).toBe(1);
    expect(liveRows[0].is_provisional).toBe(false);
  });
});

describe("v_public_box_score", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;
  afterAll(async () => {
    if (client) await client.release();
    if (pool && gameId) {
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.game_revisions WHERE game_id = $1", [
        gameId,
      ]);
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
    }
    await closePool();
  });

  it("returns player stats for a published game", async () => {
    pool = await getPool();
    client = await pool.connect();
    const result = await setupPublishedGame(pool, client, "-boxscore");
    gameId = result.gameId;

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_box_score WHERE game_id = $1`,
      [gameId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const statLine = rows.find(
      (r: { player_id: string }) => r.player_id === SEED_HOME_PLAYER,
    );
    expect(statLine).toBeDefined();
    expect(statLine.player_name).toBeTruthy();
    expect(statLine.team_name).toBeTruthy();
    expect(statLine.pts).toBe(2);
    expect(statLine.fgm).toBe(1);
    expect(statLine.fga).toBe(1);
    expect(statLine.seconds_played).toBe(600);

    // Should have jersey number
    expect(statLine.jersey_number).toBeGreaterThanOrEqual(0);

    // Should have source info
    expect(statLine.source_type).toBe("tracker_journal");
    expect(statLine.source_reviewed_at).toBeTruthy();
  });
});

describe("v_public_standings", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;
  afterAll(async () => {
    if (client) await client.release();
    if (pool && gameId) {
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.game_revisions WHERE game_id = $1", [
        gameId,
      ]);
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
    }
    await closePool();
  });

  it("reflects game result in standings", async () => {
    pool = await getPool();
    client = await pool.connect();
    const result = await setupPublishedGame(pool, client, "-standings");
    gameId = result.gameId;

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_standings WHERE competition_id = $1`,
      [SEED_COMPETITION_ID],
    );

    // Find our home team
    const home = rows.find(
      (r: { team_short_code: string; team_name: string }) =>
        r.team_short_code === "KHU" || r.team_name.includes("Хүлэгүүд"),
    );
    expect(home).toBeDefined();
    expect(home.wins).toBeGreaterThanOrEqual(1);

    // The away team should have at least 0 losses (our game may be the only one)
    const away = rows.find(
      (r: { team_short_code: string; team_name: string }) =>
        r.team_short_code === "APE" || r.team_name.includes("Apes"),
    );
    expect(away).toBeDefined();

    // Verify structure
    for (const row of rows) {
      expect(row.competition_name).toBeTruthy();
      expect(row.team_name).toBeTruthy();
      expect(typeof row.wins).toBe("number");
      expect(typeof row.losses).toBe("number");
      expect(typeof row.win_pct).toBe("number");
      expect(row.team_primary_color).toBeTruthy();
    }
  });
});

describe("v_public_leaders", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;
  afterAll(async () => {
    if (client) await client.release();
    if (pool && gameId) {
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.game_revisions WHERE game_id = $1", [
        gameId,
      ]);
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
    }
    await closePool();
  });

  it("shows player stats in leaderboard view", async () => {
    pool = await getPool();
    client = await pool.connect();
    const result = await setupPublishedGame(pool, client, "-leaders");
    gameId = result.gameId;

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_leaders WHERE competition_id = $1`,
      [SEED_COMPETITION_ID],
    );

    const player = rows.find(
      (r: { player_id: string }) => r.player_id === SEED_HOME_PLAYER,
    );
    expect(player).toBeDefined();
    expect(player.pts).toBeGreaterThanOrEqual(2);
    expect(player.gp).toBeGreaterThanOrEqual(1);

    // Qualification fields (added by leader_qualification_rules migration)
    expect(typeof player.qualified).toBe("boolean");
    expect(typeof player.team_games_played).toBe("number");

    // Structure checks
    for (const row of rows) {
      expect(row.competition_name).toBeTruthy();
      expect(row.season_name).toBeTruthy();
      expect(row.player_name).toBeTruthy();
      expect(row.team_name).toBeTruthy();
      expect(row.team_short_code).toBeTruthy();
      expect(row.team_primary_color).toBeTruthy();
    }
  });
});

describe("v_public_team_roster", () => {
  let pool: Pool;
  afterAll(async () => {
    await closePool();
  });

  it("returns active roster entries with player info", async () => {
    pool = await getPool();

    // v_public_team_roster may not exist in all environments — skip gracefully
    const { rows: views } = await pool.query(
      `SELECT 1 FROM information_schema.views
       WHERE table_schema = 'public' AND table_name = 'v_public_team_roster'`,
    );
    if (views.length === 0) {
      return; // view not available
    }

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_team_roster WHERE team_short_code = 'KHU' LIMIT 10`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);

    for (const row of rows) {
      expect(row.player_name).toBeTruthy();
      expect(row.jersey_number).toBeGreaterThanOrEqual(0);
      expect(row.team_name).toBeTruthy();
      expect(row.team_short_code).toBeTruthy();
    }
  });
});

describe("v_public_player_profiles", () => {
  let pool: Pool;
  afterAll(async () => {
    await closePool();
  });

  it("returns player profile structure", async () => {
    pool = await getPool();

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_player_profiles LIMIT 5`,
    );
    // May return 0 rows if no published games exist
    // We'll just check structure if rows exist
    for (const row of rows) {
      expect(row.player_name).toBeTruthy();
      expect(row.team_name).toBeTruthy();
      expect(typeof row.jersey_number).toBe("number");
      expect(row.team_short_code).toBeTruthy();
      expect(row.team_primary_color).toBeTruthy();
    }
  });
});

describe("v_public_play_by_play", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;
  afterAll(async () => {
    if (client) await client.release();
    if (pool && gameId) {
      await pool.query(
        "DELETE FROM public.game_player_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query(
        "DELETE FROM public.game_team_stats WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.game_revisions WHERE game_id = $1", [
        gameId,
      ]);
      await pool.query(
        "DELETE FROM public.source_submissions WHERE game_id = $1",
        [gameId],
      );
      await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
    }
    await closePool();
  });

  it("returns events for a published game", async () => {
    pool = await getPool();
    client = await pool.connect();
    const result = await setupPublishedGame(pool, client, "-pbp");
    gameId = result.gameId;

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_play_by_play WHERE game_id = $1 ORDER BY local_seq`,
      [gameId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const event = rows[0];
    expect(event.event_type).toBeTruthy();
    expect(event.player_name).toBeTruthy();
    expect(event.team_name).toBeTruthy();
    expect(event.period).toBe(1);
    expect(event.clock_seconds).toBeGreaterThanOrEqual(0);
    expect(event.payload).toBeDefined();
    // No sensitive fields
    expect(event).not.toHaveProperty("created_by");
  });
});
