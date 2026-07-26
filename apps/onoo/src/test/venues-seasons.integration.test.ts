/**
 * Integration tests for venues and seasons CRUD.
 *
 * Tests venues (create/read/update/delete), seasons (create/list),
 * and team_seasons linking. Follows the admin-operations test pattern.
 *
 * Run: pnpm test:integration
 */

import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_COMPETITION_ID,
  SEED_LEAGUE_ID,
  SEED_VENUE_ID,
} from "./seed-constants";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
} from "./setup-integration";

let pool: Pool;
let client: PoolClient;

interface CreatedEntities {
  venueId?: string;
  seasonId?: string;
  competitionId?: string;
  teamId?: string;
  teamSeasonId?: string;
}

beforeAll(async () => {
  pool = await getPool();
  client = await pool.connect();
});

afterAll(async () => {
  if (client) client.release();
  await closePool();
});

async function cleanupEntities(entities: CreatedEntities) {
  if (entities.teamSeasonId) {
    await pool.query(
      "DELETE FROM public.game_rosters WHERE team_season_id = $1",
      [entities.teamSeasonId],
    );
    await pool.query("DELETE FROM public.team_seasons WHERE id = $1", [
      entities.teamSeasonId,
    ]);
  }
  if (entities.teamId) {
    await pool.query("DELETE FROM public.teams WHERE id = $1", [
      entities.teamId,
    ]);
  }
  if (
    entities.competitionId &&
    entities.competitionId !== SEED_COMPETITION_ID
  ) {
    await pool.query("DELETE FROM public.standings WHERE competition_id = $1", [
      entities.competitionId,
    ]);
    await pool.query(
      "DELETE FROM public.season_player_stats WHERE competition_id = $1",
      [entities.competitionId],
    );
    await pool.query(
      "DELETE FROM public.game_rosters WHERE team_season_id IN (SELECT id FROM public.team_seasons WHERE competition_id = $1)",
      [entities.competitionId],
    );
    await pool.query(
      "DELETE FROM public.team_seasons WHERE competition_id = $1",
      [entities.competitionId],
    );
    await pool.query("DELETE FROM public.competitions WHERE id = $1", [
      entities.competitionId,
    ]);
  }
  if (entities.seasonId) {
    await pool.query("DELETE FROM public.competitions WHERE season_id = $1", [
      entities.seasonId,
    ]);
    await pool.query("DELETE FROM public.seasons WHERE id = $1", [
      entities.seasonId,
    ]);
  }
  if (entities.venueId && entities.venueId !== SEED_VENUE_ID) {
    await pool.query("DELETE FROM public.games WHERE venue_id = $1", [
      entities.venueId,
    ]);
    await pool.query("DELETE FROM public.venues WHERE id = $1", [
      entities.venueId,
    ]);
  }
}

// ── Venue CRUD ────────────────────────────────────────────────────────────

describe("venues CRUD", () => {
  const entities: CreatedEntities = {};

  afterAll(async () => {
    await cleanupEntities(entities);
  });

  it("creates a venue with name, city, and capacity", async () => {
    const { rows } = await pool.query(
      `INSERT INTO public.venues (name, city, capacity)
       VALUES ($1, $2, $3) RETURNING id, name, city, capacity`,
      ["Тест Арена", "Улаанбаатар", 5000],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Тест Арена");
    expect(rows[0].city).toBe("Улаанбаатар");
    expect(rows[0].capacity).toBe(5000);
    entities.venueId = rows[0].id;
  });

  it("reads a venue by id", async () => {
    if (!entities.venueId) return;
    const { rows } = await pool.query(
      "SELECT id, name, city, capacity FROM public.venues WHERE id = $1",
      [entities.venueId],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Тест Арена");
    expect(rows[0].capacity).toBe(5000);
  });

  it("allows public read access to venues", async () => {
    await client.query("SET ROLE anon");
    try {
      const { rows } = await client.query(
        "SELECT id, name FROM public.venues WHERE id = $1",
        [entities.venueId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe("Тест Арена");
    } finally {
      await client.query("SET ROLE authenticated");
    }
  });

  it("updates a venue name and city", async () => {
    if (!entities.venueId) return;
    const { rows } = await pool.query(
      `UPDATE public.venues SET name = $1, city = $2
       WHERE id = $3 RETURNING name, city`,
      ["Шинэ Арена", "Дархан", entities.venueId],
    );
    expect(rows[0].name).toBe("Шинэ Арена");
    expect(rows[0].city).toBe("Дархан");
  });

  it("allows venue with null capacity", async () => {
    const { rows } = await pool.query(
      `INSERT INTO public.venues (name, city)
       VALUES ($1, $2) RETURNING id, capacity`,
      ["Хөдөө Арена", "Эрдэнэт"],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].capacity).toBeNull();
    await pool.query("DELETE FROM public.venues WHERE id = $1", [rows[0].id]);
  });

  it("deletes a venue", async () => {
    if (!entities.venueId) return;
    await pool.query("DELETE FROM public.venues WHERE id = $1", [
      entities.venueId,
    ]);
    const { rows } = await pool.query(
      "SELECT id FROM public.venues WHERE id = $1",
      [entities.venueId],
    );
    expect(rows.length).toBe(0);
    entities.venueId = "";
  });

  it("blocks anonymous user from creating a venue", async () => {
    await client.query("SET ROLE anon");
    await expect(
      client.query(
        "INSERT INTO public.venues (name) VALUES ($1) RETURNING id",
        ["Hacker Venue"],
      ),
    ).rejects.toThrow();
  });
});

// ── Season CRUD ────────────────────────────────────────────────────────────

describe("admin CRUD > seasons", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `venueseason-admin-${randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_LEAGUE_ID],
    );
  });

  afterAll(async () => {
    await cleanupEntities(entities);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("creates a season for the league", async () => {
    const label = `Test Season ${randomUUID().slice(0, 8)}`;
    const { rows } = await pool.query(
      `INSERT INTO public.seasons (league_id, name, starts_on, ends_on)
       VALUES ($1, $2, $3, $4) RETURNING id, name`,
      [SEED_LEAGUE_ID, label, "2026-06-01", "2027-05-31"],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe(label);
    entities.seasonId = rows[0].id;
  });

  it("creates a competition for the season", async () => {
    if (!entities.seasonId) return;
    const label = `Test Competition ${randomUUID().slice(0, 8)}`;
    const { rows } = await pool.query(
      `INSERT INTO public.competitions (season_id, name)
       VALUES ($1, $2) RETURNING id`,
      [entities.seasonId, label],
    );
    expect(rows.length).toBe(1);
    entities.competitionId = rows[0].id;
  });

  it("lists seasons for a league", async () => {
    const { rows } = await pool.query(
      "SELECT id, name, starts_on, ends_on FROM public.seasons WHERE league_id = $1 ORDER BY starts_on DESC",
      [SEED_LEAGUE_ID],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    // The seed has at least one season for The League
    const ourSeason = rows.find(
      (r: { id: string }) => r.id === entities.seasonId,
    );
    expect(ourSeason).toBeDefined();
    expect(ourSeason.starts_on).toBe("2026-06-01");
  });

  it("reads a season through RLS as admin", async () => {
    if (!entities.seasonId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        "SELECT id, name FROM public.seasons WHERE id = $1",
        [entities.seasonId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].name).toContain("Test Season");
    });
  });

  it("allows public read access to seasons", async () => {
    if (!entities.seasonId) return;
    await client.query("SET ROLE anon");
    try {
      const { rows } = await client.query(
        "SELECT id, name FROM public.seasons WHERE id = $1",
        [entities.seasonId],
      );
      expect(rows.length).toBe(1);
    } finally {
      await client.query("SET ROLE authenticated");
    }
  });

  it("blocks anonymous user from creating a season", async () => {
    await client.query("SET ROLE anon");
    await expect(
      client.query(
        "INSERT INTO public.seasons (league_id, name) VALUES ($1, $2) RETURNING id",
        [SEED_LEAGUE_ID, "Hacked Season"],
      ),
    ).rejects.toThrow();
  });

  it("enforces unique (league_id, name) constraint", async () => {
    if (!entities.seasonId) return;
    // First, read back our season name
    const { rows: existing } = await pool.query(
      "SELECT name FROM public.seasons WHERE id = $1",
      [entities.seasonId],
    );
    await expect(
      pool.query(
        "INSERT INTO public.seasons (league_id, name) VALUES ($1, $2) RETURNING id",
        [SEED_LEAGUE_ID, existing[0].name],
      ),
    ).rejects.toThrow();
  });
});

// ── Team Season CRUD ──────────────────────────────────────────────────────

describe("admin CRUD > team_seasons", () => {
  const entities: CreatedEntities = {};
  let adminUser: { id: string; email: string };

  beforeAll(async () => {
    adminUser = await createTestUser(pool, {
      email: `teamseason-admin-${randomUUID().slice(0, 8)}@onoo-test.mn`,
    });
    await pool.query(
      "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'league', $2, 'admin') ON CONFLICT DO NOTHING",
      [adminUser.id, SEED_LEAGUE_ID],
    );

    // Create a team for the team_season link
    const teamSlug = `ts-test-team-${randomUUID().slice(0, 8)}`;
    const { rows: t } = await pool.query(
      "INSERT INTO public.teams (name, slug, short_code, league_id) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Team Season Test", teamSlug, teamSlug, SEED_LEAGUE_ID],
    );
    entities.teamId = t[0].id;

    // Create a season and competition
    const label = `TS-Season-${randomUUID().slice(0, 8)}`;
    const { rows: s } = await pool.query(
      "INSERT INTO public.seasons (league_id, name, starts_on, ends_on) VALUES ($1, $2, $3, $4) RETURNING id",
      [SEED_LEAGUE_ID, label, "2026-01-01", "2026-12-31"],
    );
    entities.seasonId = s[0].id;

    const { rows: c } = await pool.query(
      "INSERT INTO public.competitions (season_id, name) VALUES ($1, $2) RETURNING id",
      [entities.seasonId, `TS-Comp-${randomUUID().slice(0, 8)}`],
    );
    entities.competitionId = c[0].id;
  });

  afterAll(async () => {
    await cleanupEntities(entities);
    await pool.query("DELETE FROM public.memberships WHERE user_id = $1", [
      adminUser.id,
    ]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [adminUser.id]);
  });

  it("creates a team_season linking team to competition", async () => {
    if (!entities.competitionId || !entities.teamId) return;
    const { rows } = await pool.query(
      `INSERT INTO public.team_seasons (team_id, competition_id)
       VALUES ($1, $2) RETURNING id, team_id, competition_id`,
      [entities.teamId, entities.competitionId],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].team_id).toBe(entities.teamId);
    expect(rows[0].competition_id).toBe(entities.competitionId);
    entities.teamSeasonId = rows[0].id;
  });

  it("reads back the team_season through RLS", async () => {
    if (!entities.teamSeasonId) return;
    await asUser(client, adminUser.id, async () => {
      const { rows } = await client.query(
        `SELECT ts.id, t.name
         FROM public.team_seasons ts
         JOIN public.teams t ON t.id = ts.team_id
         WHERE ts.id = $1`,
        [entities.teamSeasonId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBeTruthy();
    });
  });

  it("allows public read access to team_seasons", async () => {
    if (!entities.teamSeasonId) return;
    await client.query("SET ROLE anon");
    try {
      const { rows } = await client.query(
        "SELECT id FROM public.team_seasons WHERE id = $1",
        [entities.teamSeasonId],
      );
      expect(rows.length).toBe(1);
    } finally {
      await client.query("SET ROLE authenticated");
    }
  });
});
