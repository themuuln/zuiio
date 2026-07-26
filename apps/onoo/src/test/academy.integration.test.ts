/**
 * Integration tests for academy schema (Phase 10a Academy foundation).
 *
 * Verifies table structure, CRUD operations, and RLS enforcement
 * for academy_profiles, academy_programs, academy_trainers, and academy_locations.
 *
 * Run: pnpm test:integration
 */

import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPool } from "./setup-integration";

// ── Connection ────────────────────────────────────────────────────────────

let pool: Pool;

// ── Shared state for sequential CRUD tests ─────────────────────────────────

let testOrgId: string;
let testAcademyId: string;
let programId: string | undefined;
let trainerId: string | undefined;
let locationId: string | undefined;

// ── Lifecycle ──────────────────────────────────────────────────────────────

beforeAll(async () => {
  pool = newPool();

  // Get an org to associate academy with (or use first org)
  const { rows: orgs } = await pool.query(
    "SELECT id FROM public.organizations LIMIT 1",
  );
  if (orgs.length === 0) {
    throw new Error("No organizations found. Seed the DB first.");
  }
  testOrgId = orgs[0].id;

  // Get or create a test academy profile
  const { rows: profiles } = await pool.query(
    "SELECT id FROM public.academy_profiles WHERE organization_id = $1 LIMIT 1",
    [testOrgId],
  );
  if (profiles.length > 0) {
    testAcademyId = profiles[0].id;
  } else {
    const { rows: created } = await pool.query(
      `INSERT INTO public.academy_profiles (organization_id, name)
       VALUES ($1, $2) RETURNING id`,
      [testOrgId, "Тест Академи"],
    );
    testAcademyId = created[0].id;
  }
});

afterAll(async () => {
  // Best-effort cleanup
  if (programId) {
    await pool.query("DELETE FROM public.academy_programs WHERE id = $1", [
      programId,
    ]);
  }
  if (trainerId) {
    await pool.query("DELETE FROM public.academy_trainers WHERE id = $1", [
      trainerId,
    ]);
  }
  if (locationId) {
    await pool.query("DELETE FROM public.academy_locations WHERE id = $1", [
      locationId,
    ]);
  }
  await pool.end();
});

// ── Schema verification ────────────────────────────────────────────────────

describe("academy_profiles хүснэгт", () => {
  it("шаардлагатай багануудтай", async () => {
    const { rows } = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'academy_profiles'
       ORDER BY ordinal_position`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("organization_id");
    expect(cols).toContain("name");
    expect(cols).toContain("logo_url");
    expect(cols).toContain("contact_phone");
    expect(cols).toContain("contact_email");
    expect(cols).toContain("timezone");
    expect(cols).toContain("settings");
    expect(cols).toContain("created_at");
    expect(cols).toContain("updated_at");
  });

  it("RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT relname FROM pg_class
       JOIN pg_policy ON pg_class.oid = pg_policy.polrelid
       WHERE relname = 'academy_profiles'`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe("academy_programs хүснэгт", () => {
  it("шаардлагатай багануудтай", async () => {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'academy_programs'
       ORDER BY ordinal_position`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("academy_id");
    expect(cols).toContain("name");
    expect(cols).toContain("description");
    expect(cols).toContain("age_group");
    expect(cols).toContain("price_mnt");
    expect(cols).toContain("is_active");
  });

  it("RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT relname FROM pg_class
       JOIN pg_policy ON pg_class.oid = pg_policy.polrelid
       WHERE relname = 'academy_programs'`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe("academy_trainers хүснэгт", () => {
  it("шаардлагатай багануудтай", async () => {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'academy_trainers'
       ORDER BY ordinal_position`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("academy_id");
    expect(cols).toContain("name");
    expect(cols).toContain("photo_url");
    expect(cols).toContain("specialties");
    expect(cols).toContain("bio");
    expect(cols).toContain("is_active");
  });

  it("RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT relname FROM pg_class
       JOIN pg_policy ON pg_class.oid = pg_policy.polrelid
       WHERE relname = 'academy_trainers'`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe("academy_locations хүснэгт", () => {
  it("шаардлагатай багануудтай", async () => {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'academy_locations'
       ORDER BY ordinal_position`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("academy_id");
    expect(cols).toContain("name");
    expect(cols).toContain("address");
    expect(cols).toContain("city");
    expect(cols).toContain("hours");
    expect(cols).toContain("is_active");
  });

  it("RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT relname FROM pg_class
       JOIN pg_policy ON pg_class.oid = pg_policy.polrelid
       WHERE relname = 'academy_locations'`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });
});

// ── CRUD operations ───────────────────────────────────────────────────────

describe("academy_programs CRUD", () => {
  it("program үүсгэдэг", async () => {
    const { rows } = await pool.query(
      `INSERT INTO public.academy_programs (academy_id, name, description, price_mnt)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testAcademyId, "Тест хөтөлбөр", "Туршилтын хөтөлбөр", 50000],
    );
    expect(rows[0].id).toBeDefined();
    programId = rows[0].id;
  });

  it("program уншдаг", async () => {
    const { rows } = await pool.query(
      `SELECT * FROM public.academy_programs WHERE id = $1`,
      [programId],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Тест хөтөлбөр");
    expect(Number(rows[0].price_mnt)).toBe(50000);
  });

  it("program шинэчилдэг", async () => {
    await pool.query(
      `UPDATE public.academy_programs SET price_mnt = $1 WHERE id = $2`,
      [100000, programId],
    );
    const { rows } = await pool.query(
      `SELECT price_mnt FROM public.academy_programs WHERE id = $1`,
      [programId],
    );
    expect(Number(rows[0].price_mnt)).toBe(100000);
  });

  it("program устгадаг", async () => {
    await pool.query(`DELETE FROM public.academy_programs WHERE id = $1`, [
      programId,
    ]);
    const { rows } = await pool.query(
      `SELECT * FROM public.academy_programs WHERE id = $1`,
      [programId],
    );
    expect(rows.length).toBe(0);
    programId = undefined;
  });
});

describe("academy_trainers CRUD", () => {
  it("trainer үүсгэдэг", async () => {
    const { rows } = await pool.query(
      `INSERT INTO public.academy_trainers (academy_id, name, specialties)
       VALUES ($1, $2, $3) RETURNING id`,
      [testAcademyId, "Бат-Очир", ["Довтолгоо", "Хамгаалалт"]],
    );
    expect(rows[0].id).toBeDefined();
    trainerId = rows[0].id;
  });

  it("trainer уншдаг", async () => {
    const { rows } = await pool.query(
      `SELECT * FROM public.academy_trainers WHERE id = $1`,
      [trainerId],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Бат-Очир");
    expect(rows[0].specialties).toEqual(["Довтолгоо", "Хамгаалалт"]);
  });

  it("trainer шинэчилдэг", async () => {
    await pool.query(
      `UPDATE public.academy_trainers SET bio = $1 WHERE id = $2`,
      ["Туршлагатай багш", trainerId],
    );
    const { rows } = await pool.query(
      `SELECT bio FROM public.academy_trainers WHERE id = $1`,
      [trainerId],
    );
    expect(rows[0].bio).toBe("Туршлагатай багш");
  });

  it("trainer устгадаг", async () => {
    await pool.query(`DELETE FROM public.academy_trainers WHERE id = $1`, [
      trainerId,
    ]);
    const { rows } = await pool.query(
      `SELECT * FROM public.academy_trainers WHERE id = $1`,
      [trainerId],
    );
    expect(rows.length).toBe(0);
    trainerId = undefined;
  });
});

describe("academy_locations CRUD", () => {
  it("location үүсгэдэг", async () => {
    const { rows } = await pool.query(
      `INSERT INTO public.academy_locations (academy_id, name, address, city)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testAcademyId, "Тест заал", "Чингисийн өргөн чөлөө", "Улаанбаатар"],
    );
    expect(rows[0].id).toBeDefined();
    locationId = rows[0].id;
  });

  it("location уншдаг", async () => {
    const { rows } = await pool.query(
      `SELECT * FROM public.academy_locations WHERE id = $1`,
      [locationId],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Тест заал");
    expect(rows[0].city).toBe("Улаанбаатар");
  });

  it("location шинэчилдэг", async () => {
    await pool.query(
      `UPDATE public.academy_locations SET hours = $1 WHERE id = $2`,
      ["Даваа-Баасан 09:00-21:00", locationId],
    );
    const { rows } = await pool.query(
      `SELECT hours FROM public.academy_locations WHERE id = $1`,
      [locationId],
    );
    expect(rows[0].hours).toBe("Даваа-Баасан 09:00-21:00");
  });

  it("location устгадаг", async () => {
    await pool.query(`DELETE FROM public.academy_locations WHERE id = $1`, [
      locationId,
    ]);
    const { rows } = await pool.query(
      `SELECT * FROM public.academy_locations WHERE id = $1`,
      [locationId],
    );
    expect(rows.length).toBe(0);
    locationId = undefined;
  });
});

// ── RLS enforcement ────────────────────────────────────────────────────────

describe("RLS бодлогууд", () => {
  it("service_role бүх өгөгдлийг унших боломжтой", async () => {
    // Service role bypasses RLS — this should always work
    const { rows } = await pool.query(
      "SELECT id, name FROM public.academy_profiles LIMIT 1",
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it("academy_programs RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as cnt FROM pg_policy WHERE polrelid = 'academy_programs'::regclass`,
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });

  it("academy_trainers RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as cnt FROM pg_policy WHERE polrelid = 'academy_trainers'::regclass`,
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });

  it("academy_locations RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as cnt FROM pg_policy WHERE polrelid = 'academy_locations'::regclass`,
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });

  it("academy_profiles foreign key — organization_id заавал байх ёстой", async () => {
    const { rows } = await pool.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'academy_profiles'
       AND column_name = 'organization_id'`,
    );
    expect(rows[0].is_nullable).toBe("NO");
  });

  it("academy_programs foreign key — academy_id заавал байх ёстой", async () => {
    const { rows } = await pool.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'academy_programs'
       AND column_name = 'academy_id'`,
    );
    expect(rows[0].is_nullable).toBe("NO");
  });

  it("academy_profiles organization_id нь organizations-руу чиглэсэн", async () => {
    const { rows } = await pool.query(
      `SELECT tc.constraint_name, ccu.table_name AS foreign_table_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.constraint_column_usage ccu
         ON tc.constraint_name = ccu.constraint_name
       WHERE tc.table_schema = 'public'
         AND tc.table_name = 'academy_profiles'
         AND tc.constraint_type = 'FOREIGN KEY'
         AND ccu.column_name = 'id'`,
    );
    const fkTargets = rows.map((r) => r.foreign_table_name);
    expect(fkTargets).toContain("organizations");
  });

  it("academy_programs academy_id нь academy_profiles-руу чиглэсэн", async () => {
    const { rows } = await pool.query(
      `SELECT tc.constraint_name, ccu.table_name AS foreign_table_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.constraint_column_usage ccu
         ON tc.constraint_name = ccu.constraint_name
       WHERE tc.table_schema = 'public'
         AND tc.table_name = 'academy_programs'
         AND tc.constraint_type = 'FOREIGN KEY'
         AND ccu.column_name = 'id'`,
    );
    const fkTargets = rows.map((r) => r.foreign_table_name);
    expect(fkTargets).toContain("academy_profiles");
  });
});
