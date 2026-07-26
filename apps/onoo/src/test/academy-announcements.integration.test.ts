/**
 * Integration tests for academy announcements CRUD + RLS isolation.
 *
 * Table under test: public.academy_announcements
 *
 * RLS rules:
 *   - SELECT: staff (memberships.role IN ('owner','admin','coordinator'))
 *             OR guardians (verified guardian of a student in the academy)
 *   - INSERT: staff only
 *   - DELETE: staff only
 *
 * Note: cmd_create_announcement is tested in payments-waitlists.integration.test.ts.
 * This file focuses on direct table operations and RLS isolation between academies.
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEED_ADMIN_ID, SEED_ORG_ID } from "./seed-constants";
import { asUser, createTestUser, newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;
let academyId: string;
let academyId2: string;
let orgId: string;
let staffUserId: string;
let otherUserId: string;
let testAnnouncementId: string;

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  // Get or create first academy profile
  const { rows: profiles } = await client.query(
    "SELECT id, organization_id FROM public.academy_profiles LIMIT 1",
  );
  if (profiles[0]?.id) {
    academyId = profiles[0].id;
    orgId = profiles[0].organization_id;
  } else {
    const { rows: newProfile } = await client.query(
      `INSERT INTO public.academy_profiles (organization_id, name)
       VALUES ($1, 'Академи Анн') RETURNING id, organization_id`,
      [SEED_ORG_ID],
    );
    academyId = newProfile[0].id;
    orgId = newProfile[0].organization_id;
  }

  // Create a second academy for isolation testing
  const { rows: profile2 } = await client.query(
    `INSERT INTO public.academy_profiles (organization_id, name)
     VALUES ($1, 'Академи Тусгаарлалт') RETURNING id`,
    [orgId],
  );
  academyId2 = profile2[0].id;

  // Ensure SEED_ADMIN has a membership
  await client.query(
    "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
    [SEED_ADMIN_ID, orgId],
  );

  // Create a staff user (admin on the org => can access all academies under the org)
  const staffUser = await createTestUser(pool, {
    email: "ann-staff@test.mn",
  });
  staffUserId = staffUser.id;
  await client.query(
    "INSERT INTO public.memberships (user_id, scope_type, scope_id, role) VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING",
    [staffUserId, orgId],
  );

  // Create a non-member user (no org membership)
  const otherUser = await createTestUser(pool, {
    email: "ann-other@test.mn",
  });
  otherUserId = otherUser.id;
});

afterAll(async () => {
  await client.query("DELETE FROM public.academy_announcements WHERE id = $1", [
    testAnnouncementId,
  ]);
  await client.query(
    "DELETE FROM public.academy_announcements WHERE academy_id IN ($1, $2) AND title LIKE 'Тест-%'",
    [academyId, academyId2],
  );
  await client.query("DELETE FROM public.academy_profiles WHERE id = $1", [
    academyId2,
  ]);
  await client.query("DELETE FROM public.memberships WHERE user_id = $1", [
    staffUserId,
  ]);
  await client.query("DELETE FROM auth.users WHERE id IN ($1, $2)", [
    staffUserId,
    otherUserId,
  ]);
  await client.end();
  await pool.end();
});

// ── Schema verification ────────────────────────────────────────────────────

describe("academy_announcements schema", () => {
  it("таблиц байгаа эсэх", async () => {
    const c = await pool.connect();
    try {
      const { rows } = await c.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'academy_announcements'
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
         WHERE table_schema = 'public' AND table_name = 'academy_announcements'
         ORDER BY ordinal_position`,
      );
      const cols = rows.map((r) => r.column_name);
      expect(cols).toContain("id");
      expect(cols).toContain("academy_id");
      expect(cols).toContain("title");
      expect(cols).toContain("body");
      expect(cols).toContain("created_by");
      expect(cols).toContain("created_at");
    } finally {
      c.release();
    }
  });
});

// ── CRUD via direct table operations ───────────────────────────────────────

describe("academy_announcements CRUD", () => {
  it("staff нь зарлал үүсгэх (шууд INSERT)", async () => {
    const c = await pool.connect();
    try {
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          `INSERT INTO public.academy_announcements
            (academy_id, title, body, created_by)
           VALUES ($1, 'Тест зарлал', 'Энэ бол тест зарлалын агуулга юм.', $2)
           RETURNING id, title, body`,
          [academyId, staffUserId],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].title).toBe("Тест зарлал");
        expect(rows[0].body).toBe("Энэ бол тест зарлалын агуулга юм.");
        testAnnouncementId = rows[0].id;
      });
    } finally {
      c.release();
    }
  });

  it("staff нь зарлалыг унших (шууд SELECT)", async () => {
    if (!testAnnouncementId) return;
    const c = await pool.connect();
    try {
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          "SELECT * FROM public.academy_announcements WHERE id = $1",
          [testAnnouncementId],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].title).toBe("Тест зарлал");
        expect(rows[0].created_by).toBe(staffUserId);
      });
    } finally {
      c.release();
    }
  });

  it("staff нь зарлалыг шинэчлэх (UPDATE)", async () => {
    if (!testAnnouncementId) return;
    const c = await pool.connect();
    try {
      await asUser(c, staffUserId, async () => {
        await c.query(
          "UPDATE public.academy_announcements SET title = $1 WHERE id = $2",
          ["Шинэчлэгдсэн зарлал", testAnnouncementId],
        );
        const { rows } = await c.query(
          "SELECT title FROM public.academy_announcements WHERE id = $1",
          [testAnnouncementId],
        );
        expect(rows[0].title).toBe("Шинэчлэгдсэн зарлал");
      });
    } finally {
      c.release();
    }
  });

  it("staff нь зарлалыг устгах (DELETE)", async () => {
    if (!testAnnouncementId) return;
    const c = await pool.connect();
    try {
      let deletedId: string;
      // Create a temp announcement to delete
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          `INSERT INTO public.academy_announcements
            (academy_id, title, body, created_by)
           VALUES ($1, 'Устгах зарлал', 'Тест', $2)
           RETURNING id`,
          [academyId, staffUserId],
        );
        deletedId = rows[0].id;
      });

      await asUser(c, staffUserId, async () => {
        await c.query(
          "DELETE FROM public.academy_announcements WHERE id = $1",
          [deletedId],
        );
        const { rows } = await c.query(
          "SELECT id FROM public.academy_announcements WHERE id = $1",
          [deletedId],
        );
        expect(rows.length).toBe(0);
      });
    } finally {
      c.release();
    }
  });
});

// ── RLS isolation ──────────────────────────────────────────────────────────

describe("RLS isolation", () => {
  it("academy_announcements RLS идэвхтэй", async () => {
    const { rows } = await pool.query(
      "SELECT COUNT(*) AS cnt FROM pg_policy WHERE polrelid = 'academy_announcements'::regclass",
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });

  it("non-staff хэрэглэгч зарлал үүсгэх боломжгүй", async () => {
    if (!academyId) return;
    const c = await pool.connect();
    try {
      await expect(
        asUser(c, otherUserId, async () => {
          await c.query(
            `INSERT INTO public.academy_announcements (academy_id, title, body, created_by)
             VALUES ($1, 'Хориотой', 'Body', $2)`,
            [academyId, otherUserId],
          );
        }),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });

  it("non-staff хэрэглэгч зарлал устгах боломжгүй", async () => {
    if (!testAnnouncementId) return;
    const c = await pool.connect();
    try {
      await expect(
        asUser(c, otherUserId, async () => {
          await c.query(
            "DELETE FROM public.academy_announcements WHERE id = $1",
            [testAnnouncementId],
          );
        }),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });

  it("staff нь өөр академийн зарлалыг харах (ижил org дотор)", async () => {
    // Staff has org-level admin membership, so they can see all academies under the org
    const c = await pool.connect();
    try {
      let otherAnnouncementId: string;
      // Create an announcement in the second academy
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          `INSERT INTO public.academy_announcements
            (academy_id, title, body, created_by)
           VALUES ($1, 'Тест-Тусгаарлалт', 'Second academy body', $2)
           RETURNING id`,
          [academyId2, staffUserId],
        );
        otherAnnouncementId = rows[0].id;
      });

      // Staff should be able to read announcements in academyId2
      await asUser(c, staffUserId, async () => {
        const { rows } = await c.query(
          "SELECT id FROM public.academy_announcements WHERE academy_id = $1",
          [academyId2],
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
      });

      // Cleanup
      await c.query("DELETE FROM public.academy_announcements WHERE id = $1", [
        otherAnnouncementId,
      ]);
    } finally {
      c.release();
    }
  });

  it("нэвтрээгүй хэрэглэгч cmd_create_announcement дуудах боломжгүй", async () => {
    const c = await pool.connect();
    try {
      await expect(
        c.query("SELECT public.cmd_create_announcement($1, 'Тест', 'Тест')", [
          academyId,
        ]),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });
});
