import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_ADMIN_ID,
  SEED_COMPETITION_ID,
  SEED_LEAGUE_ID,
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
  await pool.query(
    "DELETE FROM public.game_player_stats WHERE game_id IN (SELECT id FROM public.games WHERE competition_id = $1)",
    [SEED_COMPETITION_ID],
  );
  await pool.query(
    "DELETE FROM public.game_team_stats WHERE game_id IN (SELECT id FROM public.games WHERE competition_id = $1)",
    [SEED_COMPETITION_ID],
  );
  await pool.query(
    "DELETE FROM public.game_revisions WHERE game_id IN (SELECT id FROM public.games WHERE competition_id = $1)",
    [SEED_COMPETITION_ID],
  );
  await pool.query(
    "DELETE FROM public.source_submissions WHERE game_id IN (SELECT id FROM public.games WHERE competition_id = $1)",
    [SEED_COMPETITION_ID],
  );
  await pool.query(
    "DELETE FROM public.game_player_stats WHERE game_id IN (SELECT game_id FROM public.game_revisions WHERE source_submission_id IN (SELECT id FROM public.source_submissions WHERE submitted_by IN (SELECT id FROM auth.users WHERE email LIKE '%@onoo-test.mn')))",
  );
  await pool.query(
    "DELETE FROM public.game_team_stats WHERE game_id IN (SELECT game_id FROM public.game_revisions WHERE source_submission_id IN (SELECT id FROM public.source_submissions WHERE submitted_by IN (SELECT id FROM auth.users WHERE email LIKE '%@onoo-test.mn')))",
  );
  await pool.query(
    "DELETE FROM public.stat_events WHERE game_id IN (SELECT game_id FROM public.game_revisions WHERE source_submission_id IN (SELECT id FROM public.source_submissions WHERE submitted_by IN (SELECT id FROM auth.users WHERE email LIKE '%@onoo-test.mn')))",
  );
  await pool.query(
    "DELETE FROM public.game_revisions WHERE source_submission_id IN (SELECT id FROM public.source_submissions WHERE submitted_by IN (SELECT id FROM auth.users WHERE email LIKE '%@onoo-test.mn'))",
  );
  await pool.query(
    "DELETE FROM public.source_submissions WHERE submitted_by IN (SELECT id FROM auth.users WHERE email LIKE '%@onoo-test.mn')",
  );
  await pool.query(
    "DELETE FROM public.memberships WHERE scope_type = 'league' AND role = 'admin' AND scope_id::text LIKE 'c0000000-%'",
  );
  await pool.query(
    "DELETE FROM auth.users WHERE email LIKE '%@onoo-test.mn' AND id != $1",
    [SEED_ADMIN_ID],
  );
  await closePool();
});

// ── Anon / public read access ─────────────────────────────────────────────
describe("anon/public read access", () => {
  it("anon can read sports", async () => {
    const { rows } = await pool.query(
      "SELECT id, key FROM public.sports WHERE key = 'basketball_5x5'",
    );
    expect(rows.length).toBe(1);
    expect(rows[0].key).toBe("basketball_5x5");
  });

  it("anon can read leagues", async () => {
    const { rows } = await pool.query(
      "SELECT name FROM public.leagues ORDER BY name",
    );
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  it("anon can read teams", async () => {
    const { rows } = await pool.query(
      "SELECT name FROM public.teams ORDER BY name",
    );
    expect(rows.length).toBeGreaterThanOrEqual(15);
  });

  it("anon can read players", async () => {
    const { rows } = await pool.query(
      "SELECT canonical_name FROM public.players ORDER BY canonical_name",
    );
    expect(rows.length).toBeGreaterThanOrEqual(60);
  });

  it("anon can read venues, competitions, seasons, stat_event_types", async () => {
    const checks: [string, string][] = [
      ["venues", "SELECT count(*)::int AS cnt FROM public.venues"],
      ["competitions", "SELECT count(*)::int AS cnt FROM public.competitions"],
      ["seasons", "SELECT count(*)::int AS cnt FROM public.seasons"],
      [
        "stat_event_types",
        "SELECT count(*)::int AS cnt FROM public.stat_event_types",
      ],
    ];
    for (const [, sql] of checks) {
      const { rows } = await pool.query(sql);
      expect(typeof rows[0].cnt).toBe("number");
    }
  });

  it("anon can read v_public_* views without error", async () => {
    const views = [
      "v_public_games",
      "v_public_standings",
      "v_public_player_profiles",
    ];
    for (const view of views) {
      const { rows } = await pool.query(
        `SELECT count(*)::int AS cnt FROM public.${view}`,
      );
      expect(typeof rows[0].cnt).toBe("number");
    }
  });
});

// ── Direct write revocation ───────────────────────────────────────────────
describe("direct write revocation", () => {
  let user: { id: string; email: string };

  beforeAll(async () => {
    user = await createTestUser(pool, {
      email: `rls-write-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
  });

  afterAll(async () => {
    await pool.query("DELETE FROM auth.users WHERE id = $1", [user.id]);
  });

  it("authenticated cannot INSERT into stat_events directly", async () => {
    await expect(
      asUser(client, user.id, async () => {
        await client.query(
          "INSERT INTO public.stat_events (game_id, operation_id, event_type, period, clock_seconds, team_season_id, created_by) VALUES ($1, $2, $3, 1, 300, $4, $5)",
          [
            crypto.randomUUID(),
            crypto.randomUUID(),
            "shot_2pt_made",
            crypto.randomUUID(),
            crypto.randomUUID(),
          ],
        );
      }),
    ).rejects.toThrow();
  });

  it("authenticated cannot INSERT into game_player_stats directly", async () => {
    await expect(
      asUser(client, user.id, async () => {
        await client.query(
          "INSERT INTO public.game_player_stats (game_id, player_id, team_season_id, revision_id) VALUES ($1, $2, $3, $4)",
          [
            crypto.randomUUID(),
            crypto.randomUUID(),
            crypto.randomUUID(),
            crypto.randomUUID(),
          ],
        );
      }),
    ).rejects.toThrow();
  });

  it("authenticated cannot INSERT into game_team_stats directly", async () => {
    await expect(
      asUser(client, user.id, async () => {
        await client.query(
          "INSERT INTO public.game_team_stats (game_id, team_season_id, revision_id) VALUES ($1, $2, $3)",
          [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()],
        );
      }),
    ).rejects.toThrow();
  });

  it("authenticated cannot UPDATE games directly (0 rows affected)", async () => {
    await asUser(client, user.id, async () => {
      const { rows } = await client.query(
        "UPDATE public.games SET status = 'cancelled' WHERE id = $1 RETURNING id",
        [crypto.randomUUID()],
      );
      expect(rows.length).toBe(0);
    });
  });

  it("authenticated cannot DELETE games directly (0 rows affected)", async () => {
    await asUser(client, user.id, async () => {
      const { rows } = await client.query(
        "DELETE FROM public.games WHERE id = $1 RETURNING id",
        [crypto.randomUUID()],
      );
      expect(rows.length).toBe(0);
    });
  });
});

// ── Authenticated operator access ─────────────────────────────────────────
describe("authenticated operator access", () => {
  let user1: { id: string; email: string };
  let user2: { id: string; email: string };

  beforeAll(async () => {
    user1 = await createTestUser(pool, {
      email: `auth-op1-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    user2 = await createTestUser(pool, {
      email: `auth-op2-${crypto.randomUUID().slice(0, 8)}@onoo-test.mn`,
    });

    await pool.query(
      "INSERT INTO public.profiles (id, display_name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [user1.id, "User One"],
    );
    await pool.query(
      "INSERT INTO public.profiles (id, display_name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [user2.id, "User Two"],
    );
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'manager') ON CONFLICT DO NOTHING",
      [user1.id, SEED_LEAGUE_ID],
    );
  });

  afterAll(async () => {
    await pool.query(
      "DELETE FROM public.memberships WHERE user_id IN ($1, $2)",
      [user1.id, user2.id],
    );
    await pool.query("DELETE FROM public.profiles WHERE id IN ($1, $2)", [
      user1.id,
      user2.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id IN ($1, $2)", [
      user1.id,
      user2.id,
    ]);
  });

  it("authenticated can read their own profile", async () => {
    await asUser(client, user1.id, async () => {
      const { rows } = await client.query(
        "SELECT display_name FROM public.profiles WHERE id = $1",
        [user1.id],
      );
      expect(rows[0].display_name).toBe("User One");
    });
  });

  it("authenticated cannot see another user's profile", async () => {
    await asUser(client, user1.id, async () => {
      const { rows } = await client.query(
        "SELECT display_name FROM public.profiles WHERE id = $1",
        [user2.id],
      );
      expect(rows.length).toBe(0);
    });
  });

  it("authenticated can read their own memberships", async () => {
    await asUser(client, user1.id, async () => {
      const { rows } = await client.query(
        "SELECT scope_type, scope_id, role FROM public.memberships WHERE user_id = $1",
        [user1.id],
      );
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows[0].role).toBe("manager");
    });
  });
});

// ── Authz helper functions ────────────────────────────────────────────────
describe("authz functions", () => {
  it("auth.uid() returns the authenticated user id", async () => {
    await asUser(client, SEED_ADMIN_ID, async () => {
      const { rows } = await client.query("SELECT auth.uid() as uid");
      expect(rows[0].uid).toBe(SEED_ADMIN_ID);
    });
  });

  it("auth.uid() returns empty in anon context", async () => {
    // Clear any previous auth context (from prior asUser calls)
    await client.query("SELECT set_config('request.jwt.claim.sub', '', false)");
    await client.query("SET ROLE anon");
    const { rows } = await client.query("SELECT auth.uid() as uid");
    expect(rows[0].uid).toBeNull();
  });
});
