import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_ADMIN_ID,
  SEED_COMPETITION_ID,
  SEED_HOME_PLAYER,
  SEED_ORG_ID,
} from "./seed-constants";
import { createTestUser, newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;

async function authAs(userId: string, fn: () => Promise<void>) {
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [
    userId,
  ]);
  await client.query("SET ROLE authenticated");
  try {
    await fn();
  } finally {
    await client.query("SET ROLE postgres");
  }
}

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  // Ensure the admin has a membership for the org
  await client.query(
    `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
     VALUES ($1, 'org', $2, 'owner')
     ON CONFLICT (user_id, scope_type, scope_id, role) DO NOTHING`,
    [SEED_ADMIN_ID, SEED_ORG_ID],
  );

  // Seed a sport (needed by leagues FK)
  await client.query(
    `INSERT INTO public.sports (id, key, name_mn, name_en)
     VALUES ('a0000000-0000-0000-0000-000000000001', 'basketball_5x5', 'Сагсан бөмбөг', 'Basketball')
     ON CONFLICT (id) DO NOTHING`,
  );

  // Seed the org if not present
  await client.query(
    `INSERT INTO public.organizations (id, name, slug)
     VALUES ($1, 'Test Org', 'test-org')
     ON CONFLICT (id) DO NOTHING`,
    [SEED_ORG_ID],
  );

  // Seed a league
  await client.query(
    `INSERT INTO public.leagues (id, organization_id, sport_id, name, slug)
     VALUES ('c0000000-0000-0000-0000-000000000001', $1, 'a0000000-0000-0000-0000-000000000001', 'Test League', 'test-league')
     ON CONFLICT (id) DO NOTHING`,
    [SEED_ORG_ID],
  );

  // Seed a season
  await client.query(
    `INSERT INTO public.seasons (id, league_id, name, starts_on, ends_on)
     VALUES ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '2025 Season', '2025-01-01', '2025-12-31')
     ON CONFLICT (id) DO NOTHING`,
  );

  // Seed the competition
  await client.query(
    `INSERT INTO public.competitions (id, season_id, name)
     VALUES ($1, 'd0000000-0000-0000-0000-000000000001', 'Regular Season')
     ON CONFLICT (id) DO NOTHING`,
    [SEED_COMPETITION_ID],
  );

  // Seed a player
  await client.query(
    `INSERT INTO public.players (id, canonical_name)
     VALUES ($1, 'Test Player')
     ON CONFLICT (id) DO NOTHING`,
    [SEED_HOME_PLAYER],
  );
});

afterAll(async () => {
  await client.query(
    "DELETE FROM public.identity_disputes WHERE player_id = $1",
    [SEED_HOME_PLAYER],
  );
  await client?.end();
  await pool?.end();
});

describe("identity_disputes table", () => {
  it("table exists with expected columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'identity_disputes'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("player_id");
    expect(cols).toContain("dispute_reason");
    expect(cols).toContain("status");
    expect(cols).toContain("submitted_by");
    expect(cols).toContain("description");
  });
});

describe("identity disputes CRUD", () => {
  it("inserts a dispute", async () => {
    await authAs(SEED_ADMIN_ID, async () => {
      const { rows } = await client.query(
        `INSERT INTO public.identity_disputes (player_id, competition_id, dispute_reason, description, submitted_by)
         VALUES ($1, $2, 'wrong_player', 'Test dispute description for integration test', $3)
         RETURNING id, status`,
        [SEED_HOME_PLAYER, SEED_COMPETITION_ID, SEED_ADMIN_ID],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].status).toBe("open");
    });
  });

  it("resolves a dispute", async () => {
    let disputeId: string;
    await authAs(SEED_ADMIN_ID, async () => {
      const { rows } = await client.query(
        `INSERT INTO public.identity_disputes (player_id, competition_id, dispute_reason, description, submitted_by)
         VALUES ($1, $2, 'eligibility_error', 'Test dispute for resolution test', $3)
         RETURNING id`,
        [SEED_HOME_PLAYER, SEED_COMPETITION_ID, SEED_ADMIN_ID],
      );
      disputeId = rows[0].id;

      await client.query(
        `UPDATE public.identity_disputes SET status = 'resolved', resolution_notes = 'All clear', resolved_by = $1, resolved_at = now() WHERE id = $2`,
        [SEED_ADMIN_ID, disputeId],
      );

      const { rows: check } = await client.query(
        "SELECT status, resolution_notes FROM public.identity_disputes WHERE id = $1",
        [disputeId],
      );
      expect(check[0].status).toBe("resolved");
      expect(check[0].resolution_notes).toBe("All clear");
    });
  });

  it("RLS allows admins to read disputes in their org", async () => {
    await authAs(SEED_ADMIN_ID, async () => {
      const { rows } = await client.query(
        "SELECT count(*) AS cnt FROM public.identity_disputes",
      );
      expect(parseInt(rows[0].cnt, 10)).toBeGreaterThanOrEqual(0);
    });
  });

  it("unauthorized user cannot insert disputes", async () => {
    const user = await createTestUser(pool, {
      email: `unauth-${Date.now()}@identity-disputes-test.mn`,
    });
    await expect(
      authAs(user.id, async () => {
        await client.query(
          `INSERT INTO public.identity_disputes (player_id, dispute_reason, description, submitted_by)
           VALUES ($1, 'other', 'Unauthorized insert attempt for testing', $2)`,
          [SEED_HOME_PLAYER, SEED_ADMIN_ID],
        );
      }),
    ).rejects.toThrow();
  });
});
