// @vitest-environment node
/**
 * Production-readiness integration tests for Onoo public pages.
 *
 * Covers edge cases, data integrity, security, and all views that
 * data.ts queries but are not yet tested in public-views.integration.test.ts.
 *
 * Run: supabase start && pnpm test:integration
 */

import crypto from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_ADMIN_ID,
  SEED_AWAY_PLAYER,
  SEED_AWAY_TEAM_SEASON,
  SEED_COMPETITION_ID,
  SEED_HOME_PLAYER,
  SEED_HOME_TEAM_SEASON,
  SEED_LEAGUE_ID,
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

// ── Shared helper: create a fully published game ──────────────────────────

/**
 * Create a fully scored and published game, returning the game ID.
 * Uses seed data for teams, venues, and rulesets.
 */
async function createPublishedGame(
  pool: Pool,
  client: PoolClient,
  suffix: string = "",
): Promise<string> {
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const admin = await createTestUser(pool, {
    email: `admin-pr-${uniqueId}${suffix}@onoo-test.mn`,
  });
  const approver = await createTestUser(pool, {
    email: `approver-pr-${uniqueId}${suffix}@onoo-test.mn`,
  });

  // Grant admin membership for the seed league
  await pool.query(
    "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
    [admin.id, SEED_LEAGUE_ID],
  );
  await pool.query(
    "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
    [approver.id, SEED_LEAGUE_ID],
  );

  // Create game (bypass RLS — direct SQL)
  const gameResult = await pool.query(`
    INSERT INTO public.games (
      competition_id, ruleset_id,
      home_team_season_id, away_team_season_id,
      venue_id, scheduled_at, status
    ) VALUES (
      '${SEED_COMPETITION_ID}', '${SEED_RULESET_ID}',
      '${SEED_HOME_TEAM_SEASON}', '${SEED_AWAY_TEAM_SEASON}',
      '${SEED_VENUE_ID}', NOW() - INTERVAL '2 days', 'scheduled'
    ) RETURNING id
  `);
  const gameId: string = gameResult.rows[0].id;

  // Create game rosters
  await pool.query(`
    INSERT INTO public.game_rosters (game_id, team_season_id, player_id, is_starter)
    VALUES ('${gameId}', '${SEED_HOME_TEAM_SEASON}', '${SEED_HOME_PLAYER}', true)
  `);

  // Run lifecycle via asUser
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

  // Open session and record an event (so play_by_play has data)
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
        '${SEED_HOME_TEAM_SEASON}'::uuid, '${SEED_HOME_PLAYER}'::uuid,
        '{"made": true}'::jsonb
      )`,
    );
  });

  // Transition to final_pending_review
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

  // Create + approve revision with projection
  interface PlayerProjection {
    player_id: string;
    team_season_id: string;
    seconds_played: number;
    pts: number; fgm: number; fga: number; tpm: number; tpa: number;
    ftm: number; fta: number; oreb: number; dreb: number;
    ast: number; stl: number; blk: number; tov: number; pf: number;
  }

  interface TeamProjection {
    team_season_id: string;
    pts: number; fgm: number; fga: number; tpm: number; tpa: number;
    ftm: number; fta: number; oreb: number; dreb: number; team_reb: number;
    ast: number; stl: number; blk: number; tov: number; pf: number;
  }

  const projection: { players: PlayerProjection[]; teams: TeamProjection[] } = {
    players: [{
      player_id: SEED_HOME_PLAYER,
      team_season_id: SEED_HOME_TEAM_SEASON,
      seconds_played: 600,
      pts: 2, fgm: 1, fga: 1, tpm: 0, tpa: 0, ftm: 0, fta: 0,
      oreb: 0, dreb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0,
    }],
    teams: [
      {
        team_season_id: SEED_HOME_TEAM_SEASON,
        pts: 2, fgm: 1, fga: 1, tpm: 0, tpa: 0, ftm: 0, fta: 0,
        oreb: 0, dreb: 0, team_reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0,
      },
      {
        team_season_id: SEED_AWAY_TEAM_SEASON,
        pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
        oreb: 0, dreb: 0, team_reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0,
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

  // Rebuild standings and player stats
  await pool.query("SELECT public.refresh_standings($1::uuid)", [SEED_COMPETITION_ID]);
  await pool.query("SELECT public.refresh_season_player_stats($1::uuid)", [SEED_COMPETITION_ID]);

  return gameId;
}

/** Clean up game + all its dependent rows. */
async function cleanupGame(pool: Pool, gameId: string): Promise<void> {
  if (!gameId) return;
  for (const table of [
    "correction_records", "game_player_stats", "game_team_stats",
    "stat_events", "tracker_sessions", "game_revisions",
    "source_submissions", "game_assignments", "game_rosters",
  ]) {
    try {
      await pool.query(`DELETE FROM public.${table} WHERE game_id = $1`, [gameId]);
    } catch { /* non-fatal */ }
  }
  try { await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]); } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// MISSING VIEWS
// ═══════════════════════════════════════════════════════════════════════════

describe("v_public_shot_zones", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;

  afterAll(async () => {
    if (gameId) await cleanupGame(pool, gameId);
    if (client) client.release();
    await closePool();
  });

  it("returns empty when no shot coordinate data exists", async () => {
    pool = await getPool();
    client = await pool.connect();
    gameId = await createPublishedGame(pool, client, "-shotzone");

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_shot_zones WHERE competition_id = $1`,
      [SEED_COMPETITION_ID],
    );
    // The view filters on payload having x/y coords — we recorded a plain
    // '{"made": true}' payload with no coordinates, so it should be empty.
    expect(rows).toHaveLength(0);
  });

  it("has correct column structure", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'v_public_shot_zones'
       ORDER BY ordinal_position`,
    );
    const cols: string[] = rows.map(
      (r: { column_name: string }) => r.column_name,
    );
    expect(cols).toContain("player_id");
    expect(cols).toContain("zone_key");
    expect(cols).toContain("made");
    expect(cols).toContain("attempted");
  });
});

describe("v_public_awards", () => {
  let pool: Pool;

  /**
   * Create a test user with a matching profile row.
   * The awards table's granted_by FK references public.profiles(id).
   */
  async function createTestUserWithProfile(pool: Pool): Promise<{ id: string }> {
    const { id } = await createTestUser(pool);
    await pool.query(
       `INSERT INTO public.profiles (id, display_name)
       VALUES ($1, 'Test Awarder')
       ON CONFLICT (id) DO NOTHING`,
      [id],
    );
    return { id };
  }

  afterAll(async () => {
    await closePool();
  });

  it("returns awards with correct structure", async () => {
    pool = await getPool();
    const awarder = await createTestUserWithProfile(pool);

    const { rows } = await pool.query(
      `INSERT INTO public.awards (competition_id, award_type, player_id, granted_by, note)
       VALUES ($1::uuid, 'player_of_week', $2::uuid, $3::uuid, 'Test award')
       RETURNING id`,
      [SEED_COMPETITION_ID, SEED_HOME_PLAYER, awarder.id],
    );
    const awardId: string = rows[0].id;

    const result = await pool.query(
      `SELECT * FROM public.v_public_awards WHERE id = $1`,
      [awardId],
    );
    expect(result.rows).toHaveLength(1);
    const award = result.rows[0] as {
      award_type: string;
      player_name: string;
      competition_name: string;
      granted_at: string;
    };
    expect(award.award_type).toBe("player_of_week");
    expect(award.player_name).toBeTruthy();
    expect(award.competition_name).toBeTruthy();
    expect(award.granted_at).toBeTruthy();

    // Cleanup
    await pool.query("DELETE FROM public.awards WHERE id = $1", [awardId]);
  });

  it("excludes awards for hidden players", async () => {
    pool = await getPool();
    const awarder = await createTestUserWithProfile(pool);

    // Create a hidden player
    const hideTag = crypto.randomUUID().slice(0, 8);
    const hidden = (
      await pool.query(
        `INSERT INTO public.players (canonical_name, name_latin, position, visibility)
         VALUES ('Hidden_'||$1, 'hidden_'||$1, 'PG', 'hidden') RETURNING id`,
        [hideTag],
      )
    ).rows[0] as { id: string };

    const { rows } = await pool.query(
      `INSERT INTO public.awards (competition_id, award_type, player_id, granted_by)
       VALUES ($1::uuid, 'mvp', $2::uuid, $3::uuid)
       RETURNING id`,
      [SEED_COMPETITION_ID, hidden.id, awarder.id],
    );
    const awardId: string = rows[0].id;

    const result = await pool.query(
      `SELECT * FROM public.v_public_awards WHERE id = $1`,
      [awardId],
    );
    expect(result.rows).toHaveLength(0);

    // Cleanup
    await pool.query("DELETE FROM public.awards WHERE id = $1", [awardId]);
    await pool.query("DELETE FROM public.players WHERE id = $1", [hidden.id]);
  });
});

describe("v_public_players", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;

  afterAll(async () => {
    if (gameId) await cleanupGame(pool, gameId);
    if (client) client.release();
    await closePool();
  });

  it("returns lean player rows for search", async () => {
    pool = await getPool();
    client = await pool.connect();
    gameId = await createPublishedGame(pool, client, "-players-vw");

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_players LIMIT 10`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const first = rows[0] as Record<string, unknown>;
    // Lean view: limited columns
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("canonical_name");
    expect(first).toHaveProperty("name_latin");
    expect(first).toHaveProperty("team_name");
    expect(first).toHaveProperty("team_slug");
    expect(first).toHaveProperty("short_code");
    // Should NOT have per-game stat columns
    expect(first).not.toHaveProperty("points_per_game");
    expect(first).not.toHaveProperty("assists_per_game");
  });

  it("supports ilike search pattern used by data.ts", async () => {
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_players
       WHERE canonical_name ILIKE $1 OR name_latin ILIKE $1
       ORDER BY canonical_name
       LIMIT 8`,
      ["%test%"],
    );
    expect(Array.isArray(rows)).toBe(true);
  });

  it("excludes hidden players", async () => {
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_players
       WHERE canonical_name = 'Нэргүй тоглогч'`,
    );
    expect(rows).toHaveLength(0);
  });
});

describe("v_public_player_directory", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;

  afterAll(async () => {
    if (gameId) await cleanupGame(pool, gameId);
    if (client) client.release();
    await closePool();
  });

  it("returns rich player rows with computed stats", async () => {
    pool = await getPool();
    client = await pool.connect();
    gameId = await createPublishedGame(pool, client, "-pdir");

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_player_directory LIMIT 10`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const first = rows[0] as Record<string, unknown>;
    // Rich view has per-game stats
    expect(first).toHaveProperty("player_id");
    expect(first).toHaveProperty("player_name");
    expect(first).toHaveProperty("games_played");
    expect(first).toHaveProperty("points_per_game");
    expect(first).toHaveProperty("rebounds_per_game");
    expect(first).toHaveProperty("assists_per_game");
    expect(first).toHaveProperty("team_primary_color");
  });

  it("supports the global search OR pattern", async () => {
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_player_directory
       WHERE player_name ILIKE $1
          OR player_name_latin ILIKE $1
          OR team_name ILIKE $1
       ORDER BY points_per_game DESC
       LIMIT 20`,
      ["%test%"],
    );
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe("v_public_team_game_stats", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;

  afterAll(async () => {
    if (gameId) await cleanupGame(pool, gameId);
    if (client) client.release();
    await closePool();
  });

  it("returns one row per team for a published game", async () => {
    pool = await getPool();
    client = await pool.connect();
    gameId = await createPublishedGame(pool, client, "-tgs");

    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_team_game_stats WHERE game_id = $1
       ORDER BY home_away`,
      [gameId],
    );
    // Should have 2 rows (home + away perspective)
    expect(rows).toHaveLength(2);

    for (const row of rows as Array<Record<string, unknown>>) {
      expect(row.team_season_id).toBeTruthy();
      expect(typeof row.team_pts).toBe("number");
      expect(typeof row.opp_pts).toBe("number");
      expect(row.home_away).toMatch(/^home|away$/);
      expect(row.opp_team_name).toBeTruthy();
      expect(row.opp_team_slug).toBeTruthy();
    }

    // Verify home team has the right score
    const homeRow = rows.find(
      (r: Record<string, unknown>) => r.home_away === "home",
    );
    expect(homeRow).toBeDefined();
    expect(homeRow!.team_pts).toBe(2);
    expect(homeRow!.opp_pts).toBe(0);
  });
});

describe("v_athlete_timeline", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;

  afterAll(async () => {
    if (gameId) await cleanupGame(pool, gameId);
    if (client) client.release();
    await closePool();
  });

  it("returns game events for a player with published games", async () => {
    pool = await getPool();
    client = await pool.connect();
    gameId = await createPublishedGame(pool, client, "-tl");

    const { rows } = await pool.query(
      `SELECT * FROM public.v_athlete_timeline
       WHERE entity_id = $1
       ORDER BY event_date DESC
       LIMIT 10`,
      [SEED_HOME_PLAYER],
    );
    // May be empty if no canonical identity — check structure when data exists
    expect(Array.isArray(rows)).toBe(true);
    if (rows.length > 0) {
      const event = rows[0] as Record<string, unknown>;
      expect(event.event_type).toBe("game");
      expect(event.event_id).toBeTruthy();
      expect(event.event_date).toBeTruthy();
    }
  });

  it("has correct column structure", async () => {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'v_athlete_timeline'
       ORDER BY ordinal_position`,
    );
    const cols: string[] = rows.map(
      (r: { column_name: string }) => r.column_name,
    );
    expect(cols).toContain("event_type");
    expect(cols).toContain("entity_id");
    expect(cols).toContain("event_id");
    expect(cols).toContain("event_date");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EDGE CASES — Status boundaries
// ═══════════════════════════════════════════════════════════════════════════

describe("v_public_games — status boundaries", () => {
  let pool: Pool;
  let client: PoolClient;
  let verifiedGameId: string;
  let provisionalGameId: string;
  let cancelledGameId: string;

  afterAll(async () => {
    if (client) client.release();
    if (pool) {
      if (verifiedGameId) await cleanupGame(pool, verifiedGameId);
      if (provisionalGameId) {
        await pool.query("DELETE FROM public.games WHERE id = $1", [provisionalGameId]);
      }
      if (cancelledGameId) {
        await pool.query("DELETE FROM public.games WHERE id = $1", [cancelledGameId]);
      }
    }
    await closePool();
  });

  it("excludes provisional games (live_provisional, final_pending_review)", async () => {
    pool = await getPool();
    client = await pool.connect();
    verifiedGameId = await createPublishedGame(pool, client, "-status");

    // Create a game that stays in 'scheduled' status
    const { rows: provRows } = await pool.query(`
      INSERT INTO public.games (
        competition_id, ruleset_id,
        home_team_season_id, away_team_season_id,
        venue_id, scheduled_at, status
      ) VALUES (
        '${SEED_COMPETITION_ID}', '${SEED_RULESET_ID}',
        '${SEED_HOME_TEAM_SEASON}', '${SEED_AWAY_TEAM_SEASON}',
        '${SEED_VENUE_ID}', NOW() + INTERVAL '1 day', 'scheduled'
      ) RETURNING id
    `);
    provisionalGameId = provRows[0].id;

    // v_public_games should only return the verified game, not the scheduled one
    const { rows } = await pool.query(
      `SELECT id, status FROM public.v_public_games
       WHERE id IN ($1, $2)
       ORDER BY id`,
      [verifiedGameId, provisionalGameId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(verifiedGameId);
    expect(rows[0].status).toBe("league_verified");
  });

  it("excludes cancelled games from v_public_games", async () => {
    const { rows } = await pool.query(`
      INSERT INTO public.games (
        competition_id, ruleset_id,
        home_team_season_id, away_team_season_id,
        venue_id, scheduled_at, status
      ) VALUES (
        '${SEED_COMPETITION_ID}', '${SEED_RULESET_ID}',
        '${SEED_HOME_TEAM_SEASON}', '${SEED_AWAY_TEAM_SEASON}',
        '${SEED_VENUE_ID}', NOW() + INTERVAL '2 days', 'cancelled'
      ) RETURNING id
    `);
    cancelledGameId = rows[0].id;

    const result = await pool.query(
      `SELECT id FROM public.v_public_games WHERE id = $1`,
      [cancelledGameId],
    );
    expect(result.rows).toHaveLength(0);
  });
});

describe("v_public_live_games — status coverage", () => {
  let pool: Pool;

  afterAll(async () => {
    await closePool();
  });

  it("includes scheduled, cancelled, and postponed games", async () => {
    pool = await getPool();

    const statuses = ["scheduled", "cancelled", "postponed"] as const;
    const ids: string[] = [];

    for (const status of statuses) {
      const { rows } = await pool.query(`
        INSERT INTO public.games (
          competition_id, ruleset_id,
          home_team_season_id, away_team_season_id,
          venue_id, scheduled_at, status
        ) VALUES (
          '${SEED_COMPETITION_ID}', '${SEED_RULESET_ID}',
          '${SEED_HOME_TEAM_SEASON}', '${SEED_AWAY_TEAM_SEASON}',
          '${SEED_VENUE_ID}', NOW() + INTERVAL '3 days', '${status}'
        ) RETURNING id
      `);
      ids.push(rows[0].id);
    }

    for (const id of ids) {
      const result = await pool.query(
        `SELECT id, status, is_provisional FROM public.v_public_live_games WHERE id = $1`,
        [id],
      );
      expect(result.rows).toHaveLength(1);
      // scheduled/cancelled/postponed games should NOT be provisional
      const game = result.rows[0] as Record<string, unknown>;
      expect(game.is_provisional).toBe(false);
    }

    // Cleanup
    for (const id of ids) {
      await pool.query("DELETE FROM public.games WHERE id = $1", [id]);
    }
  });

  it("excludes league_verified and official games", async () => {
    pool = await getPool();

    const { rows } = await pool.query(`
      SELECT COUNT(*) as cnt FROM public.v_public_live_games
      WHERE status IN ('league_verified', 'official')
    `);
    const row = rows[0] as { cnt: string };
    expect(Number(row.cnt)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EDGE CASES — Hidden player masking
// ═══════════════════════════════════════════════════════════════════════════

describe("Hidden player visibility masking", () => {
  let pool: Pool;
  let hidePlayerId: string;
  let teamSeasonId: string;

  afterAll(async () => {
    if (pool) {
      if (hidePlayerId) {
        await pool.query("DELETE FROM public.roster_entries WHERE player_id = $1", [hidePlayerId]);
        await pool.query("DELETE FROM public.players WHERE id = $1", [hidePlayerId]);
      }
    }
    await closePool();
  });

  it("v_public_team_roster masks hidden player identity", async () => {
    pool = await getPool();

    const tag = crypto.randomUUID().slice(0, 8);
    const pResult = await pool.query(
      `INSERT INTO public.players (canonical_name, name_latin, position, visibility)
       VALUES ('HiddenTest_'||$1, 'hiddentest_'||$1, 'PG', 'hidden') RETURNING id`,
      [tag],
    );
    hidePlayerId = pResult.rows[0].id;

    // Add them to the seed team's roster
    const tsResult = await pool.query(
      `SELECT id FROM public.team_seasons
       WHERE competition_id = $1 LIMIT 1`,
      [SEED_COMPETITION_ID],
    );
    teamSeasonId = tsResult.rows[0].id;

    await pool.query(
      `INSERT INTO public.roster_entries (team_season_id, player_id, jersey_number)
       VALUES ($1, $2, 99)
       ON CONFLICT DO NOTHING`,
      [teamSeasonId, hidePlayerId],
    );

    const { rows } = await pool.query(
      `SELECT player_name, player_name_latin, player_position, photo_url
       FROM public.v_public_team_roster
       WHERE player_id = $1`,
      [hidePlayerId],
    );
    expect(rows).toHaveLength(1);
    const row = rows[0] as Record<string, unknown>;
    expect(row.player_name).toBe("Нэргүй тоглогч");
    expect(row.player_name_latin).toBeNull();
    expect(row.player_position).toBeNull();
    expect(row.photo_url).toBeNull();
  });

  it("v_public_player_profiles masks hidden player identity", async () => {
    const { rows } = await pool.query(
      `SELECT player_name, player_name_latin, photo_url, nationality, player_position
       FROM public.v_public_player_profiles
       WHERE player_id = $1`,
      [hidePlayerId],
    );

    if (rows.length > 0) {
      const row = rows[0] as Record<string, unknown>;
      expect(row.player_name).toBe("Нэргүй тоглогч");
      expect(row.player_name_latin).toBeNull();
      expect(row.photo_url).toBeNull();
      expect(row.nationality).toBeNull();
      expect(row.player_position).toBeNull();
    }
    // If no rows, the competition has no published games — that's also valid
  });

  it("v_public_players excludes hidden players entirely", async () => {
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_players WHERE id = $1`,
      [hidePlayerId],
    );
    expect(rows).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EDGE CASES — Empty state resilience
// ═══════════════════════════════════════════════════════════════════════════

describe("Public view empty state resilience", () => {
  let pool: Pool;

  afterAll(async () => {
    await closePool();
  });

  it("v_public_games returns empty (not error) for future date", async () => {
    pool = await getPool();
    const { rows } = await pool.query(`
      SELECT * FROM public.v_public_games
      WHERE scheduled_at >= '2099-01-01' AND scheduled_at < '2099-01-02'
      ORDER BY scheduled_at
    `);
    expect(rows).toHaveLength(0);
  });

  it("v_public_box_score returns empty for non-existent game", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_box_score WHERE game_id = $1`,
      [fakeId],
    );
    expect(rows).toHaveLength(0);
  });

  it("v_public_standings returns empty for non-existent competition", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_standings WHERE competition_id = $1`,
      [fakeId],
    );
    expect(rows).toHaveLength(0);
  });

  it("v_public_leaders returns empty for non-existent competition", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_leaders WHERE competition_id = $1`,
      [fakeId],
    );
    expect(rows).toHaveLength(0);
  });

  it("v_public_play_by_play returns empty for non-existent game", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_play_by_play WHERE game_id = $1`,
      [fakeId],
    );
    expect(rows).toHaveLength(0);
  });

  it("v_public_live_games returns empty (not error) for far future date", async () => {
    const { rows } = await pool.query(`
      SELECT * FROM public.v_public_live_games
      WHERE scheduled_at >= '2099-06-01' AND scheduled_at < '2099-06-02'
      ORDER BY scheduled_at
    `);
    expect(rows).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY — Anon role access
// ═══════════════════════════════════════════════════════════════════════════

describe("Anon role can read all public views", () => {
  let pool: Pool;

  afterAll(async () => {
    await pool?.query("RESET ROLE");
    await closePool();
  });

  const views = [
    "v_public_games",
    "v_public_live_games",
    "v_public_box_score",
    "v_public_standings",
    "v_public_leaders",
    "v_public_team_roster",
    "v_public_player_profiles",
    "v_public_play_by_play",
    "v_public_shot_zones",
    "v_public_awards",
    "v_public_players",
    "v_public_player_directory",
    "v_public_team_game_stats",
  ];

  for (const view of views) {
    it(`anon can SELECT from ${view}`, async () => {
      pool = await getPool();
      // Set role to anon for RLS
      await pool.query("SET ROLE anon");
      try {
        const { rows } = await pool.query(
          `SELECT * FROM public.${view} LIMIT 1`,
        );
        // Should not throw — even if the view is empty
        expect(Array.isArray(rows)).toBe(true);
      } finally {
        await pool.query("RESET ROLE");
      }
    });
  }
});

describe("v_athlete_timeline is readable by anon", () => {
  let pool: Pool;

  afterAll(async () => {
    await pool?.query("RESET ROLE");
    await closePool();
  });

  it("anon can SELECT from v_athlete_timeline", async () => {
    pool = await getPool();
    await pool.query("SET ROLE anon");
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.v_athlete_timeline LIMIT 1`,
      );
      expect(Array.isArray(rows)).toBe(true);
    } finally {
      await pool.query("RESET ROLE");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DATA INTEGRITY — Query patterns from data.ts
// ═══════════════════════════════════════════════════════════════════════════

describe("data.ts query patterns against public views", () => {
  let pool: Pool;
  let client: PoolClient;
  let gameId: string;

  afterAll(async () => {
    if (gameId) await cleanupGame(pool, gameId);
    if (client) client.release();
    await closePool();
  });

  it("getGamesByDate pattern — UNION of v_public_games + v_public_live_games", async () => {
    pool = await getPool();
    client = await pool.connect();
    gameId = await createPublishedGame(pool, client, "-patterns");

    // Simulate the query from data.ts getGamesByDate
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const start = `${dateStr}T00:00:00`;
    const end = `${dateStr}T23:59:59`;

    // Query v_public_games for date range
    const { rows: verified } = await pool.query(
      `SELECT id, status, home_score, away_score, home_team_name, away_team_name,
              home_team_short_code, away_team_short_code,
              home_team_primary_color, away_team_primary_color,
              competition_name, season_name, league_name, league_slug
       FROM public.v_public_games
       WHERE scheduled_at >= $1::timestamptz
         AND scheduled_at < $2::timestamptz
       ORDER BY scheduled_at`,
      [start, end],
    );

    // Query v_public_live_games for date range
    const { rows: live } = await pool.query(
      `SELECT id, status, home_score, away_score, home_team_name, away_team_name,
              home_team_short_code, away_team_short_code,
              home_team_primary_color, away_team_primary_color,
              competition_name, season_name, league_name, league_slug,
              is_provisional
       FROM public.v_public_live_games
       WHERE scheduled_at >= $1::timestamptz
         AND scheduled_at < $2::timestamptz
       ORDER BY scheduled_at`,
      [start, end],
    );

    // The published game (scheduled 2 days ago) may or may not be in today's range
    // but the queries should never error regardless
    expect(Array.isArray(verified)).toBe(true);
    expect(Array.isArray(live)).toBe(true);
  });

  it("getGameById pattern — v_public_games then v_public_live_games fallback", async () => {
    const { rows: fromVerified } = await pool.query(
      `SELECT * FROM public.v_public_games WHERE id = $1`,
      [gameId],
    );
    if (fromVerified.length === 0) {
      // Fallback: try v_public_live_games
      const { rows: fromLive } = await pool.query(
        `SELECT * FROM public.v_public_live_games WHERE id = $1`,
        [gameId],
      );
      expect(fromLive.length).toBe(0); // published game shouldn't be in live view
    } else {
      const row = fromVerified[0] as Record<string, unknown>;
      expect(row.id).toBe(gameId);
      expect(row.status).toBe("league_verified");
    }
  });

  it("getTeamBySlug pattern — multi-view team page query", async () => {
    // This simulates the parallel queries in getTeamBySlug
    const { rows: roster } = await pool.query(
      `SELECT * FROM public.v_public_team_roster
       WHERE team_slug = $1`,
      ["khasin-khuleguud"], // seed team
    );
    expect(roster.length).toBeGreaterThanOrEqual(1);

    const first = roster[0] as Record<string, unknown>;
    const teamId: string = first.team_id as string;

    const { rows: standings } = await pool.query(
      `SELECT * FROM public.v_public_standings
       WHERE team_slug = $1
       LIMIT 1`,
      ["khasin-khuleguud"],
    );

    const { rows: leaders } = await pool.query(
      `SELECT * FROM public.v_public_leaders
       WHERE team_id = $1
       ORDER BY pts DESC`,
      [teamId],
    );

    expect(Array.isArray(standings)).toBe(true);
    expect(Array.isArray(leaders)).toBe(true);
  });

  it("getLeaders pattern — qualified filter and search", async () => {
    // Default: only qualified players
    const { rows: qualified } = await pool.query(
      `SELECT * FROM public.v_public_leaders
       WHERE qualified = true
       ORDER BY pts DESC`,
    );
    expect(Array.isArray(qualified)).toBe(true);

    // Include unqualified
    const { rows: all } = await pool.query(
      `SELECT * FROM public.v_public_leaders
       ORDER BY pts DESC`,
    );
    expect(all.length).toBeGreaterThanOrEqual(qualified.length);

    // Search pattern
    const { rows: searched } = await pool.query(
      `SELECT * FROM public.v_public_leaders
       WHERE (player_name ILIKE $1 OR player_name_latin ILIKE $1)
       ORDER BY pts DESC`,
      ["%test%"],
    );
    expect(Array.isArray(searched)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ACADEMY — Public views
// ═══════════════════════════════════════════════════════════════════════════

describe("v_public_academy_programs", () => {
  let pool: Pool;

  afterAll(async () => {
    await closePool();
  });

  it("returns active programs with academy context", async () => {
    pool = await getPool();
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_academy_programs LIMIT 10`,
    );
    // At least the seed "Тест Академи" test program exists
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const row = rows[0] as Record<string, unknown>;
    expect(row).toHaveProperty("id");
    expect(row).toHaveProperty("academy_name");
    expect(row).toHaveProperty("name");
    expect(row).toHaveProperty("price_mnt");
    expect(row).toHaveProperty("duration_weeks");
    expect(row).toHaveProperty("location_name");
  });

  it("is readable by anon role", async () => {
    pool = await getPool();
    await pool.query("SET ROLE anon");
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.v_public_academy_programs LIMIT 1`,
      );
      expect(Array.isArray(rows)).toBe(true);
    } finally {
      await pool.query("RESET ROLE");
    }
  });

  it("has correct column structure", async () => {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'v_public_academy_programs'
       ORDER BY ordinal_position`,
    );
    const cols: string[] = rows.map(
      (r: { column_name: string }) => r.column_name,
    );
    expect(cols).toContain("id");
    expect(cols).toContain("name");
    expect(cols).toContain("age_group");
    expect(cols).toContain("price_mnt");
    expect(cols).toContain("academy_name");
    expect(cols).toContain("location_name");
  });
});

describe("v_public_academy_trainers", () => {
  let pool: Pool;

  afterAll(async () => {
    await closePool();
  });

  it("returns trainers with specialties array", async () => {
    pool = await getPool();
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_academy_trainers LIMIT 10`,
    );
    expect(Array.isArray(rows)).toBe(true);
    if (rows.length > 0) {
      const row = rows[0] as Record<string, unknown>;
      expect(row).toHaveProperty("name");
      expect(row).toHaveProperty("photo_url");
      expect(row).toHaveProperty("specialties");
      expect(row).toHaveProperty("bio");
    }
  });

  it("is readable by anon role", async () => {
    pool = await getPool();
    await pool.query("SET ROLE anon");
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.v_public_academy_trainers LIMIT 1`,
      );
      expect(Array.isArray(rows)).toBe(true);
    } finally {
      await pool.query("RESET ROLE");
    }
  });
});

describe("v_public_academy_locations", () => {
  let pool: Pool;

  afterAll(async () => {
    await closePool();
  });

  it("returns locations with address and hours", async () => {
    pool = await getPool();
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_academy_locations LIMIT 10`,
    );
    expect(Array.isArray(rows)).toBe(true);
    if (rows.length > 0) {
      const row = rows[0] as Record<string, unknown>;
      expect(row).toHaveProperty("name");
      expect(row).toHaveProperty("address");
      expect(row).toHaveProperty("city");
      expect(row).toHaveProperty("hours");
    }
  });

  it("is readable by anon role", async () => {
    pool = await getPool();
    await pool.query("SET ROLE anon");
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.v_public_academy_locations LIMIT 1`,
      );
      expect(Array.isArray(rows)).toBe(true);
    } finally {
      await pool.query("RESET ROLE");
    }
  });
});

describe("Academy views — empty state resilience", () => {
  let pool: Pool;

  afterAll(async () => {
    await closePool();
  });

  it("v_public_academy_programs is empty (not error) for non-existent academy", async () => {
    pool = await getPool();
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_academy_programs
       WHERE academy_id = '00000000-0000-0000-0000-000000000000'`,
    );
    expect(rows).toHaveLength(0);
  });

  it("v_public_academy_trainers is empty for non-existent academy", async () => {
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_academy_trainers
       WHERE academy_id = '00000000-0000-0000-0000-000000000000'`,
    );
    expect(rows).toHaveLength(0);
  });

  it("v_public_academy_locations is empty for non-existent academy", async () => {
    const { rows } = await pool.query(
      `SELECT * FROM public.v_public_academy_locations
       WHERE academy_id = '00000000-0000-0000-0000-000000000000'`,
    );
    expect(rows).toHaveLength(0);
  });
});
