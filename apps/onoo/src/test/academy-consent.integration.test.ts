/**
 * Integration tests for academy consent templates and consent records CRUD + RLS.
 *
 * Tables under test:
 *   - public.academy_consent_templates
 *   - public.academy_consent_records
 *
 * RLS relies on private.is_academy_staff() which checks memberships
 * with role IN ('owner', 'admin', 'coordinator') at the org level.
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
let otherUserId: string;
let testTemplateId: string;
let testStudentId: string;

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
    // Create one using SEED_ORG_ID
    const { rows: newProfile } = await client.query(
      `INSERT INTO public.academy_profiles (organization_id, name)
       VALUES ($1, 'Тест Академи') RETURNING id, organization_id`,
      [SEED_ORG_ID],
    );
    academyId = newProfile[0].id;
    orgId = newProfile[0].organization_id;
  }

  // Ensure SEED_ADMIN has a membership on this org (so asUser works for staff ops)
  await client.query(
    "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
    [SEED_ADMIN_ID, orgId],
  );

  // Create a staff user (has membership on the org)
  const staffUser = await createTestUser(pool, {
    email: "consent-staff@test.mn",
  });
  staffUserId = staffUser.id;
  await client.query(
    "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
    [staffUserId, orgId],
  );

  // Create a non-member user (should be denied by RLS for write operations)
  const otherUser = await createTestUser(pool, {
    email: "consent-other@test.mn",
  });
  otherUserId = otherUser.id;

  // Create a test student (needed for consent records)
  const { rows: students } = await client.query(
    `INSERT INTO public.academy_students (academy_id, canonical_name)
     VALUES ($1, 'Consent Test Student ' || gen_random_uuid()::text)
     RETURNING id`,
    [academyId],
  );
  testStudentId = students[0].id;
});

afterAll(async () => {
  // Cleanup consent records first (FK to templates)
  await client.query(
    "DELETE FROM public.academy_consent_records WHERE template_id = $1",
    [testTemplateId],
  );
  await client.query(
    "DELETE FROM public.academy_consent_templates WHERE id = $1",
    [testTemplateId],
  );
  await client.query("DELETE FROM public.academy_students WHERE id = $1", [
    testStudentId,
  ]);
  await client.query("DELETE FROM public.memberships WHERE user_id = $1", [
    staffUserId,
  ]);
  await client.query("DELETE FROM auth.users WHERE id IN ($1, $2)", [
    staffUserId,
    otherUserId,
  ]);
  client.release();
  await pool.end();
});

// ── Schema verification ────────────────────────────────────────────────────

describe("academy_consent_templates schema", () => {
  it("таблиц байгаа эсэх", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'academy_consent_templates'
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
         WHERE table_schema = 'public' AND table_name = 'academy_consent_templates'
         ORDER BY ordinal_position`,
      );
      const cols = rows.map((r) => r.column_name);
      expect(cols).toContain("id");
      expect(cols).toContain("academy_id");
      expect(cols).toContain("title");
      expect(cols).toContain("body");
      expect(cols).toContain("scope");
      expect(cols).toContain("version");
      expect(cols).toContain("is_active");
    } finally {
      c.release();
    }
  });
});

describe("academy_consent_records schema", () => {
  it("таблиц байгаа эсэх", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'academy_consent_records'
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
         WHERE table_schema = 'public' AND table_name = 'academy_consent_records'
         ORDER BY ordinal_position`,
      );
      const cols = rows.map((r) => r.column_name);
      expect(cols).toContain("id");
      expect(cols).toContain("template_id");
      expect(cols).toContain("student_id");
      expect(cols).toContain("signed_text");
      expect(cols).toContain("is_withdrawn");
      expect(cols).toContain("signed_at");
    } finally {
      c.release();
    }
  });
});

// ── Consent templates CRUD ─────────────────────────────────────────────────

describe("academy_consent_templates CRUD", () => {
  it("staff нь шинэ загвар үүсгэх", async () => {
    const c = await pool.connect();
    try {
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          `INSERT INTO public.academy_consent_templates
            (academy_id, title, body, scope)
           VALUES ($1, 'Зөвшөөрлийн загвар', 'Тест зөвшөөрлийн агуулга', 'liability')
           RETURNING *`,
          [academyId],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].title).toBe("Зөвшөөрлийн загвар");
        expect(rows[0].scope).toBe("liability");
        expect(rows[0].is_active).toBe(true);
        expect(rows[0].version).toBe(1);
        testTemplateId = rows[0].id;
      });
    } finally {
      c.release();
    }
  });

  it("staff нь загварыг унших", async () => {
    if (!testTemplateId) return;
    const c = await pool.connect();
    try {
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          "SELECT * FROM public.academy_consent_templates WHERE id = $1",
          [testTemplateId],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].title).toBe("Зөвшөөрлийн загвар");
        expect(rows[0].scope).toBe("liability");
      });
    } finally {
      c.release();
    }
  });

  it("staff нь загварыг шинэчлэх", async () => {
    if (!testTemplateId) return;
    const c = await pool.connect();
    try {
      await asUser(c, staffUserId, async () => {
        await c.query(
          "UPDATE public.academy_consent_templates SET title = $1, version = 2 WHERE id = $2",
          ["Шинэчлэгдсэн загвар", testTemplateId],
        );
        const { rows } = await c.query(
          "SELECT title, version FROM public.academy_consent_templates WHERE id = $1",
          [testTemplateId],
        );
        expect(rows[0].title).toBe("Шинэчлэгдсэн загвар");
        expect(rows[0].version).toBe(2);
      });
    } finally {
      c.release();
    }
  });
});

// ── Consent records CRUD ───────────────────────────────────────────────────

describe("academy_consent_records CRUD", () => {
  it("staff нь зөвшөөрлийн бүртгэл үүсгэх", async () => {
    if (!testTemplateId || !testStudentId) return;
    const c = await pool.connect();
    try {
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          `INSERT INTO public.academy_consent_records
            (template_id, student_id, signed_text)
           VALUES ($1, $2, 'Гарын үсэг зурсан')
           RETURNING *`,
          [testTemplateId, testStudentId],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].template_id).toBe(testTemplateId);
        expect(rows[0].student_id).toBe(testStudentId);
        expect(rows[0].signed_text).toBe("Гарын үсэг зурсан");
        expect(rows[0].is_withdrawn).toBe(false);
      });
    } finally {
      c.release();
    }
  });

  it("staff нь зөвшөөрлийг татах (withdraw)", async () => {
    if (!testTemplateId || !testStudentId) return;
    const c = await pool.connect();
    try {
      // Create another record to withdraw
      let recordId: string;
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          `INSERT INTO public.academy_consent_records
            (template_id, student_id, signed_text)
           VALUES ($1, $2, 'Татах тест')
           RETURNING id`,
          [testTemplateId, testStudentId],
        );
        recordId = rows[0].id;

        await c.query(
          `UPDATE public.academy_consent_records
           SET is_withdrawn = true, withdrawn_at = now()
           WHERE id = $1`,
          [recordId],
        );

        const { rows: check } = await c.query(
          "SELECT is_withdrawn, withdrawn_at FROM public.academy_consent_records WHERE id = $1",
          [recordId],
        );
        expect(check[0].is_withdrawn).toBe(true);
        expect(check[0].withdrawn_at).toBeTruthy();
      });
    } finally {
      c.release();
    }
  });
});

// ── RLS enforcement ─────────────────────────────────────────────────────────

describe("RLS enforcement", () => {
  it("нэвтрээгүй хэрэглэгч consent_templates-д бичих", async () => {
    // Direct pool (superuser) bypasses RLS, so INSERT succeeds
    const c = await pool.connect();
    try {
      const { rows } = await c.query(
        `INSERT INTO public.academy_consent_templates (academy_id, title, body, scope)
         VALUES ($1, 'Unauth Test', 'Body', 'general')
         RETURNING id`,
        [academyId],
      );
      expect(rows.length).toBe(1);
      // Cleanup
      await c.query(
        "DELETE FROM public.academy_consent_templates WHERE id = $1",
        [rows[0].id],
      );
    } finally {
      c.release();
    }
  });

  it("non-staff хэрэглэгч consent_templates-д бичих боломжгүй", async () => {
    if (!academyId) return;
    const c = await pool.connect();
    try {
      await expect(
        asUser(c, otherUserId, async () => {
          await c.query(
            `INSERT INTO public.academy_consent_templates (academy_id, title, body, scope)
             VALUES ($1, 'Хориотой', 'Body', 'general')`,
            [academyId],
          );
        }),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });

  it("staff хэрэглэгч consent_templates жагсаалтыг харах", async () => {
    if (!testTemplateId) return;
    const c = await pool.connect();
    try {
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          "SELECT COUNT(*) AS cnt FROM public.academy_consent_templates WHERE academy_id = $1",
          [academyId],
        );
        expect(Number(rows[0].cnt)).toBeGreaterThanOrEqual(1);
      });
    } finally {
      c.release();
    }
  });

  it("consent_templates RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      "SELECT COUNT(*) AS cnt FROM pg_policy WHERE polrelid = 'academy_consent_templates'::regclass",
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });

  it("consent_records RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      "SELECT COUNT(*) AS cnt FROM pg_policy WHERE polrelid = 'academy_consent_records'::regclass",
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });
});
