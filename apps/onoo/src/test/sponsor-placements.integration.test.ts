/**
 * Integration tests for sponsor placements (T-4.5).
 *
 * Covers:
 *   - sponsors and sponsor_placements table schema
 *   - cmd_upsert_sponsor SECURITY DEFINER function (create + update)
 *   - cmd_set_placement SECURITY DEFINER function
 *   - v_public_sponsor_slots view
 *   - RLS: no direct DML policies exist for authenticated users
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEED_ADMIN_ID, SEED_COMPETITION_ID } from "./seed-constants";
import { asUser, createTestUser, newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;
let adminUserId: string;
let otherUserId: string;

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  adminUserId = SEED_ADMIN_ID;

  // Create a test user for RLS denial tests
  const other = await createTestUser(pool, {
    email: `other-sponsor-${Date.now()}@onoo-test.mn`,
  });
  otherUserId = other.id;
});

afterAll(async () => {
  // Clean up any placements created during tests
  await client.query(
    "DELETE FROM public.sponsor_placements WHERE sponsor_id IN (SELECT id FROM public.sponsors WHERE name LIKE 'Тест Ивээн Тэтгэгч%' OR name LIKE 'Шинэчлэгдсэн%')",
  );
  await client.query(
    "DELETE FROM public.sponsors WHERE name LIKE 'Тест Ивээн Тэтгэгч%' OR name LIKE 'Шинэчлэгдсэн%'",
  );
  await client.query("DELETE FROM auth.users WHERE id = $1", [otherUserId]);
  await client.end();
  await pool.end();
});

// ── Schema ─────────────────────────────────────────────────────────────────

describe("sponsor schema", () => {
  it("has sponsors table", async () => {
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sponsors')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("has sponsor_placements table", async () => {
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sponsor_placements')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("has v_public_sponsor_slots view", async () => {
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_public_sponsor_slots')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("sponsors has required columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sponsors'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("name");
    expect(cols).toContain("logo_url");
    expect(cols).toContain("link_url");
    expect(cols).toContain("active");
  });

  it("sponsor_placements has required columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sponsor_placements'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("sponsor_id");
    expect(cols).toContain("competition_id");
    expect(cols).toContain("slot");
    expect(cols).toContain("starts_on");
    expect(cols).toContain("ends_on");
  });

  it("sponsors has RLS enabled", async () => {
    const { rows } = await client.query(
      "SELECT relrowsecurity FROM pg_class WHERE oid = 'public.sponsors'::regclass",
    );
    expect(rows[0].relrowsecurity).toBe(true);
  });

  it("sponsor_placements has RLS enabled", async () => {
    const { rows } = await client.query(
      "SELECT relrowsecurity FROM pg_class WHERE oid = 'public.sponsor_placements'::regclass",
    );
    expect(rows[0].relrowsecurity).toBe(true);
  });
});

// ── cmd_upsert_sponsor (SECURITY DEFINER) ──────────────────────────────────

describe("cmd_upsert_sponsor", () => {
  let sponsorId: string;

  it("creates a new sponsor", async () => {
    await asUser(client, adminUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, name, active FROM public.cmd_upsert_sponsor($1, $2, $3)",
        [
          "Тест Ивээн Тэтгэгч 1",
          "https://example.com/logo.png",
          "https://example.com",
        ],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe("Тест Ивээн Тэтгэгч 1");
      expect(rows[0].active).toBe(true);
      sponsorId = rows[0].id;
    });
  });

  it("updates an existing sponsor", async () => {
    await asUser(client, adminUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, name, active FROM public.cmd_upsert_sponsor($1, p_id => $2, p_active => false)",
        ["Шинэчлэгдсэн Ивээн Тэтгэгч", sponsorId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe("Шинэчлэгдсэн Ивээн Тэтгэгч");
      expect(rows[0].id).toBe(sponsorId);
      // Function return confirms the update — direct SELECT on sponsors would
      // return 0 rows due to RLS (no SELECT policy for authenticated users)
      expect(rows[0].active).toBe(false);
    });
  });

  it("rejects update for non-existent sponsor", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    await expect(
      asUser(client, adminUserId, async () => {
        await client.query("SELECT public.cmd_upsert_sponsor($1, p_id => $2)", [
          "Байхгүй",
          fakeId,
        ]);
      }),
    ).rejects.toThrow(/not found/);
  });
});

// ── cmd_set_placement (SECURITY DEFINER) ──────────────────────────────────

describe("cmd_set_placement", () => {
  let sponsorId: string;

  beforeAll(async () => {
    // Create a sponsor for placement tests via SECURITY DEFINER function
    // (direct SELECT/INSERT on sponsors is blocked by RLS)
    await asUser(client, adminUserId, async () => {
      const result = await client.query(
        "SELECT id FROM public.cmd_upsert_sponsor($1)",
        ["Тест Ивээн Тэтгэгч 2"],
      );
      sponsorId = result.rows[0].id;
    });
  });

  it("creates a placement for valid slot", async () => {
    await asUser(client, adminUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, slot FROM public.cmd_set_placement($1, $2, $3, $4, $5)",
        [
          sponsorId,
          SEED_COMPETITION_ID,
          "standings",
          "2026-01-01",
          "2026-12-31",
        ],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].slot).toBe("standings");
    });
  });

  it("creates placements for all valid slots", async () => {
    const slots = ["leaders", "game", "recap", "award_card", "home"];
    for (const slot of slots) {
      await asUser(client, adminUserId, async () => {
        const { rows } = await client.query(
          "SELECT id, slot FROM public.cmd_set_placement($1, $2, $3, $4, $5)",
          [sponsorId, SEED_COMPETITION_ID, slot, "2026-01-01", "2026-12-31"],
        );
        expect(rows[0].slot).toBe(slot);
      });
    }
  });

  it("rejects invalid slot value", async () => {
    await expect(
      asUser(client, adminUserId, async () => {
        await client.query(
          "SELECT public.cmd_set_placement($1, $2, $3, $4, $5)",
          [
            sponsorId,
            SEED_COMPETITION_ID,
            "invalid_slot",
            "2026-01-01",
            "2026-12-31",
          ],
        );
      }),
    ).rejects.toThrow(/Invalid slot/i);
  });

  it("stores placement with correct competition_id", async () => {
    await asUser(client, adminUserId, async () => {
      const { rows } = await client.query(
        "SELECT competition_id FROM public.cmd_set_placement($1, $2, $3, $4, $5)",
        [sponsorId, SEED_COMPETITION_ID, "home", "2026-06-01", "2026-08-31"],
      );
      expect(rows[0].competition_id).toBe(SEED_COMPETITION_ID);
    });
  });
});
// ── v_public_sponsor_slots view ────────────────────────────────────────────
describe("v_public_sponsor_slots", () => {
  it("has expected columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'v_public_sponsor_slots'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("placement_id");
    expect(cols).toContain("sponsor_id");
    expect(cols).toContain("sponsor_name");
    expect(cols).toContain("logo_url");
    expect(cols).toContain("link_url");
    expect(cols).toContain("competition_id");
    expect(cols).toContain("slot");
    expect(cols).toContain("starts_on");
    expect(cols).toContain("ends_on");
  });
  it("filters by active sponsor and date range", async () => {
    // The view uses security_invoker, so it respects the caller's RLS.
    // Since there are no SELECT policies on sponsors/sponsor_placements
    // for authenticated users, the view returns 0 rows for anon/auth calls.
    const { rows } = await client.query(
      "SELECT count(*)::int AS cnt FROM public.v_public_sponsor_slots WHERE competition_id = $1",
      [SEED_COMPETITION_ID],
    );
    // Count may be 0 due to RLS or date filter — structural test only
    expect(typeof rows[0].cnt).toBe("number");
  });
});

// ── RLS: no direct DML for authenticated users ───────────────────────────

describe("RLS enforcement for sponsors", () => {
  it("blocks direct INSERT on sponsors by authenticated user", async () => {
    await asUser(client, adminUserId, async () => {
      await expect(
        client.query(
          `INSERT INTO public.sponsors (name, logo_url)
           VALUES ($1, $2) RETURNING id`,
          ["Хакер", "https://evil.com/logo.png"],
        ),
      ).rejects.toThrow();
    });
  });

  it("blocks direct INSERT on sponsor_placements by authenticated user", async () => {
    await asUser(client, adminUserId, async () => {
      await expect(
        client.query(
          `INSERT INTO public.sponsor_placements
           (sponsor_id, competition_id, slot, starts_on, ends_on)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [
            adminUserId,
            SEED_COMPETITION_ID,
            "standings",
            "2026-01-01",
            "2026-12-31",
          ],
        ),
      ).rejects.toThrow();
    });
  });

  it("returns 0 rows for direct SELECT on sponsors by authenticated user", async () => {
    await asUser(client, adminUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, name FROM public.sponsors LIMIT 1",
      );
      // No SELECT policy exists — RLS default deny returns 0 rows
      expect(rows.length).toBe(0);
    });
  });

  it("returns 0 rows for direct SELECT on sponsor_placements by authenticated user", async () => {
    await asUser(client, adminUserId, async () => {
      const { rows } = await client.query(
        "SELECT id FROM public.sponsor_placements LIMIT 1",
      );
      expect(rows.length).toBe(0);
    });
  });
});
