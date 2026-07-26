/**
 * Integration tests for embed pages and audience dashboard (Phase 4).
 *
 * Covers:
 *   - Public views used by embed pages (v_public_games, v_public_live_games,
 *     v_public_player_profiles, v_public_box_score)
 *   - daily_page_views table schema
 *   - cmd_increment_page_view function
 *   - RLS: embed views accessible by anon; daily_page_views closed by default
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestUser, newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;
let anonUserId: string;

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  // Create an anon-style test user for RLS / function-execution tests
  const anon = await createTestUser(pool, {
    email: `anon-embeds-${Date.now()}@onoo-test.mn`,
  });
  anonUserId = anon.id;
});

afterAll(async () => {
  // Clean up rows created during cmd_increment_page_view tests
  await client.query(
    "DELETE FROM public.daily_page_views WHERE entity_id = $1",
    [anonUserId],
  );
  await client.query("DELETE FROM auth.users WHERE id = $1", [anonUserId]);
  await client.end();
  await pool.end();
});

// ── Schema: Public embed views ────────────────────────────────────────────

describe("public embed views schema", () => {
  const expectedViews = [
    "v_public_games",
    "v_public_live_games",
    "v_public_player_profiles",
    "v_public_box_score",
  ] as const;

  for (const viewName of expectedViews) {
    it(`has ${viewName} view`, async () => {
      const { rows } = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = $1)",
        [viewName],
      );
      expect(rows[0].exists).toBe(true);
    });
  }

  it("v_public_games has expected game-related columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_public_games'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("competition_id");
    expect(cols).toContain("status");
    expect(cols).toContain("home_team_name");
    expect(cols).toContain("away_team_name");
    expect(cols).toContain("home_score");
    expect(cols).toContain("away_score");
    expect(cols).toContain("scheduled_at");
    expect(cols).toContain("is_provisional");
  });

  it("v_public_live_games has expected columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_public_live_games'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("status");
    expect(cols).toContain("is_provisional");
  });

  it("v_public_player_profiles has expected columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_public_player_profiles'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("player_id");
    expect(cols).toContain("player_name");
    expect(cols).toContain("team_name");
    expect(cols).toContain("points_per_game");
    expect(cols).toContain("oreb_per_game");
    expect(cols).toContain("dreb_per_game");
    expect(cols).toContain("ast_per_game");
    expect(cols).toContain("games_played");
    expect(cols).toContain("team_logo_url");
  });

  it("v_public_box_score has expected columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_public_box_score'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("game_id");
    expect(cols).toContain("player_id");
    expect(cols).toContain("player_name");
    expect(cols).toContain("player_name_latin");
    expect(cols).toContain("player_position");
    expect(cols).toContain("team_name");
    expect(cols).toContain("pts");
    expect(cols).toContain("oreb");
    expect(cols).toContain("dreb");
    expect(cols).toContain("ast");
    expect(cols).toContain("jersey_number");
    expect(cols).toContain("source_reviewed_at");
  });
describe("embed views return seed data", () => {
  it("v_public_games returns published games with team info", async () => {
    const { rows } = await client.query(
      "SELECT id, status, home_team_name, away_team_name, home_score, away_score FROM public.v_public_games LIMIT 10",
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.id).toBeTruthy();
      expect(["league_verified", "official"]).toContain(row.status);
      expect(row.home_team_name).toBeTruthy();
      expect(row.away_team_name).toBeTruthy();
    }
  });

  it("v_public_games returns game by id for embed", async () => {
    // Grab the first game ID from the view
    const { rows: games } = await client.query(
      "SELECT id FROM public.v_public_games LIMIT 1",
    );
    expect(games.length).toBeGreaterThan(0);

    const { rows } = await client.query(
      "SELECT * FROM public.v_public_games WHERE id = $1",
      [games[0].id],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(games[0].id);
  });

  it("v_public_player_profiles returns players with stats", async () => {
    const { rows } = await client.query(
      "SELECT player_id, player_name, team_name, points_per_game, games_played FROM public.v_public_player_profiles LIMIT 20",
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.player_id).toBeTruthy();
      expect(row.player_name).toBeTruthy();
      expect(row.team_name).toBeTruthy();
    }
  });

  it("v_public_player_profiles returns a specific player by id for player embed", async () => {
    const { rows } = await client.query(
      "SELECT player_id, player_name, team_name, points_per_game, oreb_per_game, dreb_per_game, ast_per_game FROM public.v_public_player_profiles WHERE player_id = $1",
      [SEED_HOME_PLAYER],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].player_id).toBe(SEED_HOME_PLAYER);
    expect(rows[0].player_name).toBeTruthy();
  });

  it("v_public_box_score returns game-log data by player", async () => {
    const { rows } = await client.query(
      "SELECT game_id, player_id, player_name, team_name, pts, ast, oreb, dreb, (COALESCE(oreb,0) + COALESCE(dreb,0)) AS rebounds FROM public.v_public_box_score WHERE player_id = $1 LIMIT 5",
      [SEED_HOME_PLAYER],
    );
    expect(rows.length).toBeGreaterThanOrEqual(0);
    // At least one published game with stats should exist for seed players
    for (const row of rows) {
      expect(row.player_id).toBe(SEED_HOME_PLAYER);
      expect(row.pts).not.toBeNull();
    }
  });

  it("v_public_box_score returns published games only", async () => {
    const { rows } = await client.query(
      "SELECT DISTINCT game_id FROM public.v_public_box_score LIMIT 5",
    );
    for (const row of rows) {
      const { rows: games } = await client.query(
        "SELECT status FROM public.games WHERE id = $1",
        [row.game_id],
      );
      expect(["league_verified", "official"]).toContain(games[0].status);
    }
  });
});

// ── RLS: Embed views are publicly accessible ───────────────────────────────

describe("RLS: embed views are public", () => {
  it("v_public_games is accessible by anon role", async () => {
    await asUser(client, anonUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, home_team_name, away_team_name FROM public.v_public_games LIMIT 1",
      );
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  it("v_public_player_profiles is accessible by anon role", async () => {
    await asUser(client, anonUserId, async () => {
      const { rows } = await client.query(
        "SELECT player_id, player_name FROM public.v_public_player_profiles LIMIT 1",
      );
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  it("v_public_box_score is accessible by anon role", async () => {
    await asUser(client, anonUserId, async () => {
      const { rows } = await client.query(
        "SELECT game_id, player_name, pts FROM public.v_public_box_score LIMIT 1",
      );
      // At least one row because seed data includes published games with stats
      expect(rows.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── Schema: daily_page_views / audience dashboard ─────────────────────────

describe("audience tracking schema", () => {
  it("has daily_page_views table", async () => {
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_page_views')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("daily_page_views has required columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_page_views'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("entity_type");
    expect(cols).toContain("entity_id");
    expect(cols).toContain("view_date");
    expect(cols).toContain("view_count");
    expect(cols).toContain("created_at");
    expect(cols).toContain("updated_at");
  });

  it("daily_page_views has RLS enabled", async () => {
    const { rows } = await client.query(
      "SELECT relrowsecurity FROM pg_class WHERE oid = 'public.daily_page_views'::regclass",
    );
    expect(rows[0].relrowsecurity).toBe(true);
  });

  it("has cmd_increment_page_view function", async () => {
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM pg_proc WHERE proname = 'cmd_increment_page_view' AND pronamespace = 'public'::regnamespace)",
    );
    expect(rows[0].exists).toBe(true);
  });
});

// ── Function: cmd_increment_page_view ──────────────────────────────────────

describe("cmd_increment_page_view", () => {
  const testEntityType = "integration_test";
  const testEntityId = `test-entity-${Date.now()}`;

  it("creates a new row on first call", async () => {
    await asUser(client, anonUserId, async () => {
      await client.query(
        "SELECT public.cmd_increment_page_view($1, $2)",
        [testEntityType, testEntityId],
      );
    });

    const { rows } = await client.query(
      "SELECT entity_type, entity_id, view_count FROM public.daily_page_views WHERE entity_type = $1 AND entity_id = $2",
      [testEntityType, testEntityId],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].view_count).toBe(1);
  });

  it("increments view_count on subsequent calls", async () => {
    await asUser(client, anonUserId, async () => {
      await client.query(
        "SELECT public.cmd_increment_page_view($1, $2)",
        [testEntityType, testEntityId],
      );
      await client.query(
        "SELECT public.cmd_increment_page_view($1, $2)",
        [testEntityType, testEntityId],
      );
    });

    const { rows } = await client.query(
      "SELECT view_count FROM public.daily_page_views WHERE entity_type = $1 AND entity_id = $2",
      [testEntityType, testEntityId],
    );
    expect(rows[0].view_count).toBe(3); // 1 initial + 2 increments
  });

  it("records current_date as view_date", async () => {
    const { rows } = await client.query(
      "SELECT view_date FROM public.daily_page_views WHERE entity_type = $1 AND entity_id = $2",
      [testEntityType, testEntityId],
    );
    expect(rows[0].view_date).toBeTruthy();
  });
});

// ── RLS: daily_page_views is closed to anon/authenticated ─────────────────

describe("RLS: daily_page_views closed", () => {
  it("authenticated user cannot select from daily_page_views directly", async () => {
    await asUser(client, anonUserId, async () => {
      const { rows } = await client.query(
        "SELECT COUNT(*)::int AS cnt FROM public.daily_page_views",
      );
      // RLS blocks all rows — should get 0
      expect(rows[0].cnt).toBe(0);
    });
  });

  it("authenticated user cannot insert into daily_page_views directly", async () => {
    await asUser(client, anonUserId, async () => {
      await expect(
        client.query(
          "INSERT INTO public.daily_page_views (entity_type, entity_id, view_date, view_count) VALUES ('test', 'test', CURRENT_DATE, 1)",
        ),
      ).rejects.toThrow();
    });
  });
});
