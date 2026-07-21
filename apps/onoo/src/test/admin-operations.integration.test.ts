/**
 * Integration test for admin CRUD operations against real database.
 * Tests that admin users can create, read, update, and delete entities
 * while non-admins and unauthenticated users are rejected.
 */
import { type Pool, type PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
  newPool,
} from "./setup-integration";

// ── Seed data IDs ──────────────────────────────────────────────────────────
const SEED_LEAGUE_ID = "c0000000-0000-0000-0000-000000000001";
const SEED_COMPETITION_ID = "e0000000-0000-0000-0000-000000000001";
const SEED_SPORT_ID = "a0000000-0000-0000-0000-000000000001";
const SEED_VENUE_ID = "f0000000-0000-0000-0000-000000000001";
const SEED_ADMIN_ID = "397692e0-915f-4361-9f75-f84d0883ba80";

// Pool for direct queries (bypasses RLS)
let pool: Pool;
// Client for RLS-authenticated queries
let client: PoolClient;

interface CreatedEntities {
  leagueId?: string;
  seasonId?: string;
  competitionId?: string;
  teamId?: string;
  teamSeasonId?: string;
  playerId?: string;
  gameId?: string;
}

beforeAll(async () => {
  pool = await getPool();
  client = await pool.connect();
});

afterAll(async () => {
  if (client) client.release();
  await closePool();
});

// ── Clean up test-created data between describe blocks ─────────────────────
async function cleanupEntities(entities: CreatedEntities) {
  if (entities.gameId) {
    await pool.query("DELETE FROM public.game_rosters WHERE game_id = $1", [entities.gameId]);
    await pool.query("DELETE FROM public.game_assignments WHERE game_id = $1", [entities.gameId]);
    await pool.query("DELETE FROM public.games WHERE id = $1", [entities.gameId]);
  }
  if (entities.teamSeasonId) {
    await pool.query("DELETE FROM public.game_rosters WHERE team_season_id = $1", [entities.teamSeasonId]);
    await pool.query("DELETE FROM public.team_seasons WHERE id = $1", [entities.teamSeasonId]);
  }
  if (entities.competitionId && entities.competitionId !== SEED_COMPETITION_ID) {
    await pool.query("DELETE FROM public.competitions WHERE id = $1", [entities.competitionId]);
  }
  if (entities.seasonId) {
    await pool.query("DELETE FROM public.seasons WHERE id = $1", [entities.seasonId]);
  }
  if (entities.teamId) {
    await pool.query("DELETE FROM public.roster_entries WHERE team_id = $1", [entities.teamId]);
    await pool.query("DELETE FROM public.teams WHERE id = $1", [entities.teamId]);
  }
  if (entities.playerId) {
    await pool.query("DELETE FROM public.roster_entries WHERE player_id = $1", [entities.playerId]);
    await pool.query("DELETE FROM public.players WHERE id = $1", [entities.playerId]);
  }
  if (entities.leagueId) {
    await pool.query("DELETE FROM public.memberships WHERE scope_id = $1", [entities.leagueId]);
    await pool.query("DELETE FROM public.leagues WHERE id = $1", [entities.leagueId]);
  }
}

// ── League CRUD ────────────────────────────────────────────────────────────
describe("admin CRUD > leagues", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };

  beforeAll(async () => {
    adminUser = await createTestUser(pool, { email: `league-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn` });
    // Grant admin membership for seed league
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_LEAGUE_ID],
    );
  });

  afterAll(async () => {
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [adminUser.id]);
    await cleanupEntities(entities);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("allows admin to create a league", async () => {
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `INSERT INTO public.leagues (name, slug, sport_id)
         VALUES ($1, $2, $3) RETURNING id, name, slug`,
        ["Integration Test League", `test-league-${crypto.randomUUID().slice(0, 8)}`, SEED_SPORT_ID],
      );
      expect(rows[0].name).toBe("Integration Test League");
      entities.leagueId = rows[0].id;
    });
  });

  it("allows admin to read leagues", async () => {
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "SELECT id, name, slug FROM public.leagues WHERE id = $1",
        [entities.leagueId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].slug).toContain("test-league-");
    });
  });

  it("allows admin to update a league", async () => {
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "UPDATE public.leagues SET name = $1 WHERE id = $2 RETURNING name",
        ["Updated Test League", entities.leagueId],
      );
      expect(rows[0].name).toBe("Updated Test League");
    });
  });

  it("blocks anonymous user from creating a league", async () => {
    // Run as 'anon' role — should be blocked by RLS
    await client.query("SET ROLE anon");
    await expect(
      client.query(
        "INSERT INTO public.leagues (name, slug, sport_id) VALUES ($1, $2, $3) RETURNING id",
        ["Hacker League", "hack-attempt", SEED_SPORT_ID],
      ),
    ).rejects.toThrow();
  });

  it("allows admin to delete a league", async () => {
    if (!entities.leagueId) return;
    await asUser(client, adminUser.id, async () => {
      // Clean up memberships first
      await pool.query("DELETE FROM public.memberships WHERE scope_id = $1", [entities.leagueId]);
      await client.query("DELETE FROM public.leagues WHERE id = $1 RETURNING id", [entities.leagueId]);
    });
    // Verify gone
    const { rows } = await pool.query("SELECT id FROM public.leagues WHERE id = $1", [entities.leagueId]);
    expect(rows.length).toBe(0);
    entities.leagueId = undefined;
  });
});

// ── Team CRUD ──────────────────────────────────────────────────────────────
describe("admin CRUD > teams", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `team-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_LEAGUE_ID],
    );
  });

  afterAll(async () => {
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [adminUser.id]);
    await cleanupEntities(entities);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("creates a team and adds it to the league competition", async () => {
    await asUser(client, adminUser.id, async () => {
      // Create team
      const teamSlug = `test-team-${crypto.randomUUID().slice(0, 8)}`;
      const { rows: teamRows } = await client.query(
        `INSERT INTO public.teams (name, slug, sport_id)
         VALUES ($1, $2, $3) RETURNING id`,
        ["Integration Test Team", teamSlug, SEED_SPORT_ID],
      );
      entities.teamId = teamRows[0].id;

      // Verify we can read it back
      const { rows: read } = await client.query(
        "SELECT name, slug FROM public.teams WHERE id = $1",
        [entities.teamId],
      );
      expect(read[0].name).toBe("Integration Test Team");
    });
  });

  it("creates a team_season for the competition", async () => {
    if (!entities.teamId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `INSERT INTO public.team_seasons (team_id, competition_id)
         VALUES ($1, $2) RETURNING id`,
        [entities.teamId, SEED_COMPETITION_ID],
      );
      entities.teamSeasonId = rows[0].id;
    });
  });

  it("blocks non-admin from creating teams", async () => {
    const nonAdmin = await createTestUser(pool, {
      email: `non-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    try {
      await asUser(client, nonAdmin.id, async () => {
        await expect(
          client.query(
            "INSERT INTO public.teams (name, slug, sport_id) VALUES ($1, $2, $3) RETURNING id",
            ["Non Admin Team", `na-${crypto.randomUUID().slice(0, 8)}`, SEED_SPORT_ID],
          ),
        ).rejects.toThrow();
      });
    } finally {
      await pool.query("DELETE FROM auth.users WHERE id = $1", [nonAdmin.id]);
    }
  });
});

// ── Season CRUD ────────────────────────────────────────────────────────────
describe("admin CRUD > seasons", () => {
  let adminUser: { id: string; email: string };
  let seasonId: string;

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `season-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_LEAGUE_ID],
    );
  });

  afterAll(async () => {
    if (seasonId) {
      await pool.query("DELETE FROM public.seasons WHERE id = $1", [seasonId]);
    }
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [adminUser.id]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("creates a season for the league", async () => {
    await asUser(client, adminUser.id, async () => {
      const label = `Integration Test ${new Date().getFullYear()}`;
      const { rows } = await client.query(
        "INSERT INTO public.seasons (league_id, label, starts_at, ends_at, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [SEED_LEAGUE_ID, label, "2026-01-01", "2026-12-31", false],
      );
      seasonId = rows[0].id;
      expect(rows[0].id).toBeTruthy();
    });
  });

  it("reads back the created season", async () => {
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "SELECT label, is_active FROM public.seasons WHERE id = $1",
        [seasonId],
      );
      expect(rows[0].is_active).toBe(false);
    });
  });
});

// ── Player CRUD ────────────────────────────────────────────────────────────
describe("admin CRUD > players", () => {
  let adminUser: { id: string; email: string };
  let playerId: string;

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `player-admin-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_LEAGUE_ID],
    );
  });

  afterAll(async () => {
    if (playerId) await pool.query("DELETE FROM public.players WHERE id = $1", [playerId]);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [adminUser.id]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("creates a player", async () => {
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "INSERT INTO public.players (full_name, jersey_number, sport_id) VALUES ($1, $2, $3) RETURNING id, full_name",
        ["Test Player", 99, SEED_SPORT_ID],
      );
      playerId = rows[0].id;
      expect(rows[0].full_name).toBe("Test Player");
    });
  });

  it("updates a player", async () => {
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "UPDATE public.players SET full_name = $1 WHERE id = $2 RETURNING full_name",
        ["Updated Test Player", playerId],
      );
      expect(rows[0].full_name).toBe("Updated Test Player");
    });
  });

  it("deletes a player", async () => {
    await asUser(client, adminUser.id, async () => {
      // Delete roster entries first
      await pool.query("DELETE FROM public.roster_entries WHERE player_id = $1", [playerId]);
      await client.query("DELETE FROM public.players WHERE id = $1 RETURNING id", [playerId]);
    });
    const { rows } = await pool.query("SELECT id FROM public.players WHERE id = $1", [playerId]);
    expect(rows.length).toBe(0);
    playerId = "";
  });
});

// ── Admin API Auth Enforcement ─────────────────────────────────────────────
describe("admin API auth enforcement", () => {
  let nonAdminUser: { id: string; email: string };
  let leagueId: string;

  beforeAll(async () => {
    nonAdminUser = await createTestUser(pool, {
      email: `no-role-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
  });

  afterAll(async () => {
    if (leagueId) {
      await pool.query("DELETE FROM public.memberships WHERE scope_id = $1", [leagueId]);
      await pool.query("DELETE FROM public.leagues WHERE id = $1", [leagueId]);
    }
    await pool.query("DELETE FROM auth.users WHERE id = $1", [nonAdminUser.id]);
  });

  it("blocks user without admin membership from creating a league", async () => {
    await asUser(client, nonAdminUser.id, async () => {
      await expect(
        client.query(
          `INSERT INTO public.leagues (name, slug, sport_id) VALUES ($1, $2, $3) RETURNING id`,
          ["No Access League", `na-${crypto.randomUUID().slice(0, 8)}`, SEED_SPORT_ID],
        ),
      ).rejects.toThrow();
    });
  });

  it("seed admin can exercise admin privileges", async () => {
    // The seed admin user (397692e0...) should have league_admin role
    await asUser(client, SEED_ADMIN_ID, async () => {
      const leagueSlug = `seed-test-${crypto.randomUUID().slice(0, 8)}`;
      const { rows } = await client.query(
        "INSERT INTO public.leagues (name, slug, sport_id) VALUES ($1, $2, $3) RETURNING id",
        ["Seed Admin League", leagueSlug, SEED_SPORT_ID],
      );
      leagueId = rows[0].id;
      expect(rows[0].id).toBeTruthy();
    });
  });
});

// ── Game Operations ────────────────────────────────────────────────────────
describe("game operations against real DB", () => {
  let adminUser: { id: string; email: string };
  let gameId: string;

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `game-op-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_LEAGUE_ID],
    );

    // Clean any leftover standings for seed competition
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [SEED_COMPETITION_ID]);
    await pool.query("DELETE FROM public.season_player_stats WHERE competition_id = $1", [SEED_COMPETITION_ID]);
  });

  afterAll(async () => {
    // Clean up game data
    await pool.query("DELETE FROM public.stat_events WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.tracker_sessions WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.game_assignments WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.game_rosters WHERE game_id = $1", [gameId]);
    await pool.query("DELETE FROM public.games WHERE id = $1", [gameId]);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [adminUser.id]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("creates a game under the seed competition", async () => {
    const homeTsId = "30000000-0000-0000-0000-000000000001";
    const awayTsId = "30000000-0000-0000-0000-000000000002";

    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `INSERT INTO public.games (competition_id, ruleset_id, home_team_season_id, away_team_season_id, scheduled_at, venue_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
         RETURNING id`,
        [SEED_COMPETITION_ID, "90000000-0000-0000-0000-000000000001", homeTsId, awayTsId, "2026-08-01 18:00:00+08", SEED_VENUE_ID],
      );
      gameId = rows[0].id;
    });
    expect(gameId).toBeTruthy();
  });

  it("transitions game through full lifecycle using commands", async () => {
    if (!gameId) return;
    const scorer = await createTestUser(pool, {
      email: `scorer-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    let sessionId: string;

    try {
      await asUser(client, adminUser.id, async () => {
        // Transition to live
        await client.query("SELECT public.cmd_transition_game($1::uuid, 'live_provisional')", [gameId]);

        // Assign scorer
        await client.query("SELECT public.cmd_assign_scorer($1::uuid, $2::uuid, 'lead_scorer')", [gameId, scorer.id]);

        // Open session
        const { rows } = await client.query(
          "SELECT * FROM public.cmd_open_tracker_session($1::uuid, 'lead_scorer')",
          [gameId],
        );
        sessionId = rows[0].id;

        // Record a stat event
        await client.query(
          "SELECT public.cmd_record_event($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::smallint, $6::text, $7::smallint, $8::smallint, $9::uuid, $10::uuid, $11::jsonb)",
          [gameId, sessionId, crypto.randomUUID(), crypto.randomUUID(), 1, "shot_2pt_made", 0, 500, gameId, adminUser.id, "{}"],
        );

        // Transition to final
        await client.query("SELECT public.cmd_transition_game($1::uuid, 'final_pending_review')", [gameId]);

        // Submit source
        const { rows: subRows } = await client.query(
          "SELECT * FROM public.cmd_submit_source($1::uuid, 'tracker_journal', $2::uuid, true, '{}'::jsonb, 0.95, $3::uuid)",
          [gameId, null, crypto.randomUUID()],
        );
        const sourceId = subRows[0].id;

        // Approve source
        await client.query("SELECT public.cmd_approve_source($1::uuid, true)", [sourceId]);

        // Create revision
        await client.query(
          "SELECT public.cmd_create_revision($1::uuid, '{\"players\":[],\"teams\":[]}'::jsonb, '{\"players\":[],\"teams\":[]}'::jsonb)",
          [sourceId],
        );

        // Approve revision
        await client.query("SELECT public.cmd_approve_revision((SELECT id FROM public.game_revisions WHERE game_id = $1 AND state = 'applied' LIMIT 1)::uuid, true)", [gameId]);
      });
    } finally {
      await pool.query("DELETE FROM public.tracker_sessions WHERE scorer_id = $1", [scorer.id]);
      await pool.query("DELETE FROM auth.users WHERE id = $1", [scorer.id]);
    }
  });
});
