/**
 * Integration tests for academy CSV import/export operations.
 *
 * Tables under test:
 *   - public.csv_import_log
 *   - public.academy_students (export source / import target)
 *
 * Functions under test:
 *   - public.cmd_create_student (used by CSV import endpoint)
 *
 * The CSV endpoints live at /admin/api/academy/students/csv.
 * Export: GET returns CSV of all academy_students.
 * Import: POST parses CSV and creates students via cmd_create_student.
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEED_ADMIN_ID, SEED_ORG_ID } from "./seed-constants";
import { asUser, createTestUser, newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;
let academyId: string;
let orgId: string;
let staffUserId: string;

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  // Get or create an academy profile
  const { rows: profiles } = await client.query(
    "SELECT id, organization_id FROM public.academy_profiles LIMIT 1",
  );
  if (profiles[0]?.id) {
    academyId = profiles[0].id;
    orgId = profiles[0].organization_id;
  } else {
    const { rows: newProfile } = await client.query(
      `INSERT INTO public.academy_profiles (organization_id, name)
       VALUES ($1, 'CSV Test Academy') RETURNING id, organization_id`,
      [SEED_ORG_ID],
    );
    academyId = newProfile[0].id;
    orgId = newProfile[0].organization_id;
  }

  // Ensure SEED_ADMIN has a membership
  await client.query(
    "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
    [SEED_ADMIN_ID, orgId],
  );

  // Create a staff user with membership
  const staffUser = await createTestUser(pool, {
    email: "csv-staff@test.mn",
  });
  staffUserId = staffUser.id;
  await client.query(
    "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
    [staffUserId, orgId],
  );
});

afterAll(async () => {
  // Cleanup imported test students (by name pattern)
  await client.query(
    "DELETE FROM public.academy_students WHERE academy_id = $1 AND canonical_name LIKE 'CSV-Import-%'",
    [academyId],
  );
  await client.query(
    "DELETE FROM public.csv_import_log WHERE imported_by = $1",
    [staffUserId],
  );
  await client.query("DELETE FROM public.memberships WHERE user_id = $1", [
    staffUserId,
  ]);
  await client.query("DELETE FROM auth.users WHERE id = $1", [staffUserId]);
  client.release();
  await pool.end();
});

// ── csv_import_log table ───────────────────────────────────────────────────

describe("csv_import_log schema", () => {
  it("таблиц байгаа эсэх", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'csv_import_log'
        ) AS exists
      `);
      expect(rows[0]?.exists).toBe(true);
    } finally {
      c.release();
    }
  });

  it("тохирох багануудтай", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'csv_import_log'
         ORDER BY ordinal_position`,
      );
      const cols = rows.map((r) => r.column_name);
      expect(cols).toContain("id");
      expect(cols).toContain("entity_type");
      expect(cols).toContain("filename");
      expect(cols).toContain("rows_imported");
      expect(cols).toContain("rows_failed");
      expect(cols).toContain("errors");
      expect(cols).toContain("imported_by");
      expect(cols).toContain("created_at");
    } finally {
      c.release();
    }
  });

  it("бичлэг хийх", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(
        `INSERT INTO public.csv_import_log (entity_type, filename, rows_imported, rows_failed)
         VALUES ('academy_students', 'test-students.csv', 5, 0)
         RETURNING id, entity_type, rows_imported`,
      );
      expect(rows.length).toBe(1);
      expect(rows[0].entity_type).toBe("academy_students");
      expect(rows[0].rows_imported).toBe(5);
      // Cleanup
      await c.query("DELETE FROM public.csv_import_log WHERE id = $1", [
        rows[0].id,
      ]);
    } finally {
      c.release();
    }
  });

  it("алдаатай бичлэг хийх", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(
        "INSERT INTO public.csv_import_log (entity_type, filename, rows_imported, rows_failed, errors) VALUES ($1, $2, 3, 2, $3::jsonb) RETURNING id",
        [
          "academy_students",
          "errors.csv",
          JSON.stringify([{ row: 2, message: "canonical_name хоосон" }]),
        ],
      );
      expect(rows.length).toBe(1);
      await c.query("DELETE FROM public.csv_import_log WHERE id = $1", [
        rows[0].id,
      ]);
    } finally {
      c.release();
    }
  });
});

// ── Data export (GET /admin/api/academy/students/csv) ──────────────────────

describe("CSV export data", () => {
  it("academy_students өгөгдөл гаргаж авах", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(
        "SELECT id, canonical_name, academy_id FROM public.academy_students WHERE academy_id = $1 LIMIT 1",
        [academyId],
      );
      // At least one student exists in the academy
      // (tests should be run after seed data is applied)
      if (rows.length > 0) {
        expect(rows[0].canonical_name).toBeDefined();
        expect(rows[0].academy_id).toBe(academyId);
      }
    } finally {
      c.release();
    }
  });

  it("academy_students тохирох багануудтай (CSV гаргалтад ашиглагддаг)", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'academy_students'
         ORDER BY ordinal_position`,
      );
      const cols = rows.map((r) => r.column_name);
      // These columns are the ones exported by the CSV endpoint
      expect(cols).toContain("canonical_name");
      expect(cols).toContain("name_latin");
      expect(cols).toContain("date_of_birth");
      expect(cols).toContain("school_name");
      expect(cols).toContain("grade_level");
      expect(cols).toContain("medical_notes");
      expect(cols).toContain("allergies");
      expect(cols).toContain("emergency_contact_name");
      expect(cols).toContain("emergency_contact_phone");
      expect(cols).toContain("status");
    } finally {
      c.release();
    }
  });
});

// ── cmd_create_student (CSV import endpoint uses this) ─────────────────────

describe("cmd_create_student (CSV import backend)", () => {
  const importedNames: string[] = [];

  afterAll(async () => {
    if (importedNames.length > 0) {
      await pool.query(
        "DELETE FROM public.academy_students WHERE academy_id = $1 AND canonical_name = ANY($2)",
        [academyId, importedNames],
      );
    }
  });

  it("staff нь cmd_create_student дуудах", async () => {
    const c = await pool.connect();
    try {
      const name = `CSV-Import-Student-${crypto.randomUUID().slice(0, 8)}`;
      importedNames.push(name);

      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          `SELECT * FROM public.cmd_create_student(
            p_academy_id => $1,
            p_canonical_name => $2,
            p_school_name => $3,
            p_grade_level => $4
          )`,
          [academyId, name, "Тест Сургууль", "5"],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].canonical_name).toBe(name);
        expect(rows[0].school_name).toBe("Тест Сургууль");
        expect(rows[0].grade_level).toBe("5");
        expect(rows[0].status).toBe("active");
      });
    } finally {
      c.release();
    }
  });

  it("import хийгдсэн сурагч DB-д байх", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(
        "SELECT canonical_name, status FROM public.academy_students WHERE academy_id = $1 AND canonical_name LIKE 'CSV-Import-%' LIMIT 1",
        [academyId],
      );
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows[0].status).toBe("active");
    } finally {
      c.release();
    }
  });

  it("нэвтрээгүй хэрэглэгч cmd_create_student дуудах боломжгүй", async () => {
    const c = await pool.connect();
    try {
      await expect(
        c.query(
          `SELECT public.cmd_create_student(
            p_academy_id => $1,
            p_canonical_name => 'Hacker Student'
          )`,
          [academyId],
        ),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });

  it("csv_import_log RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      "SELECT COUNT(*) AS cnt FROM pg_policy WHERE polrelid = 'csv_import_log'::regclass",
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });
});
