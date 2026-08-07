/**
 * Integration tests for the public news feature: schema, cmd_* RPC CRUD,
 * RLS isolation, and the public v_public_news view.
 *
 * Table under test: public.news
 *
 * RLS rules:
 *   - SELECT: anon/authenticated see published rows only
 *             org owner/admin (memberships.scope_type='org', role owner|admin)
 *             see everything (drafts included)
 *   - INSERT/UPDATE/DELETE: no direct policies — writes go through
 *     cmd_create_news / cmd_update_news / cmd_delete_news (SECURITY DEFINER,
 *     org admin check inside the function).
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEED_ADMIN_ID, SEED_ORG_ID } from "./seed-constants";
import { asUser, createTestUser, newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;
let adminId: string;
let outsiderId: string;
let publishedId: string;
let draftId: string;

/** Run a callback with no authenticated user context (anon role). */
async function asAnon<T>(c: PoolClient, fn: () => Promise<T>): Promise<T> {
  const original = (await c.query("SELECT current_role AS r")).rows[0]
    .r as string;
  try {
    await c.query("SET ROLE anon");
    await c.query("SELECT set_config('request.jwt.claim.sub', '', false)");
    return await fn();
  } finally {
    await c.query(`SET ROLE ${original}`);
  }
}

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  // Ensure the seed org has an owner/admin membership for the seed admin.
  await client.query(
    `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
     VALUES ($1, 'org', $2, 'admin') ON CONFLICT DO NOTHING`,
    [SEED_ADMIN_ID, SEED_ORG_ID],
  );
  adminId = SEED_ADMIN_ID;

  // A user with no org membership.
  const outsider = await createTestUser(pool, {
    email: "news-outsider@test.mn",
  });
  outsiderId = outsider.id;

  // Clean any leftovers from previous runs.
  await client.query("DELETE FROM public.news WHERE title LIKE 'Тест-%'");
});

afterAll(async () => {
  await client.query("DELETE FROM public.news WHERE id IN ($1, $2)", [
    publishedId,
    draftId,
  ]);
  await client.query("DELETE FROM public.memberships WHERE user_id = $1", [
    outsiderId,
  ]);
  await client.query("DELETE FROM auth.users WHERE id = $1", [outsiderId]);
  client.release();
  await pool.end();
});

// ── Schema verification ────────────────────────────────────────────────────

describe("news schema", () => {
  it("news таблиц байгаа эсэх", async () => {
    const { rows } = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'news'
      ) AS exists`,
    );
    expect(rows[0].exists).toBe(true);
  });

  it("news тохирох багануудтай", async () => {
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'news'
       ORDER BY ordinal_position`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain("id");
    expect(cols).toContain("title");
    expect(cols).toContain("excerpt");
    expect(cols).toContain("body");
    expect(cols).toContain("cover_image_url");
    expect(cols).toContain("published");
    expect(cols).toContain("published_at");
    expect(cols).toContain("created_by");
    expect(cols).toContain("created_at");
    expect(cols).toContain("updated_at");
  });

  it("news RLS идэвхтэй", async () => {
    const { rows } = await client.query(
      `SELECT COUNT(*) AS cnt FROM pg_policy
       WHERE polrelid = 'news'::regclass`,
    );
    expect(Number(rows[0].cnt)).toBeGreaterThan(0);
  });

  it("v_public_news view байгаа эсэх", async () => {
    const { rows } = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'v_public_news'
      ) AS exists`,
    );
    expect(rows[0].exists).toBe(true);
  });
});

// ── Admin CRUD via cmd_* RPCs ─────────────────────────────────────────────

describe("news admin CRUD (cmd RPCs)", () => {
  it("org admin нийтэлсэн мэдээ үүсгэх", async () => {
    const c = await pool.connect();
    try {
      let createdId: string | undefined;
      await asUser(c, adminId, async () => {
        const { rows } = await c.query(
          `SELECT * FROM public.cmd_create_news('Тест-Нийтэлсэн', 'Товч агуулга', 'Бүрэн агуулга', '', true)`,
        );
        const row = rows[0];
        createdId = row.id;
        publishedId = row.id;
        expect(row.published).toBe(true);
        expect(row.published_at).not.toBeNull();
        expect(row.created_by).toBe(adminId);
      });
      expect(createdId).toBeTruthy();
    } finally {
      c.release();
    }
  });

  it("org admin ноорог мэдээ үүсгэх (published_at хоосон)", async () => {
    const c = await pool.connect();
    try {
      await asUser(c, adminId, async () => {
        const { rows } = await c.query(
          `SELECT * FROM public.cmd_create_news('Тест-Ноорог', '', 'Агуулга', '', false)`,
        );
        const row = rows[0];
        draftId = row.id;
        expect(row.published).toBe(false);
        expect(row.published_at).toBeNull();
      });
    } finally {
      c.release();
    }
  });

  it("org admin мэдээ засах (гарчиг, нийтлэх төлөв)", async () => {
    const c = await pool.connect();
    try {
      // Publish the draft — published_at gets stamped.
      await asUser(c, adminId, async () => {
        const { rows } = await c.query(
          `SELECT * FROM public.cmd_update_news($1, 'Тест-Ноорог-Шинэ', '', 'Агуулга', '', true)`,
          [draftId],
        );
        const row = rows[0];
        expect(row.title).toBe("Тест-Ноорог-Шинэ");
        expect(row.published).toBe(true);
        expect(row.published_at).not.toBeNull();
      });

      // Unpublish — published_at clears so a re-publish gets a fresh stamp.
      await asUser(c, adminId, async () => {
        const { rows } = await c.query(
          `SELECT * FROM public.cmd_update_news($1, 'Тест-Ноорог-Шинэ', '', 'Агуулга', '', false)`,
          [draftId],
        );
        const row = rows[0];
        expect(row.published).toBe(false);
        expect(row.published_at).toBeNull();
      });
    } finally {
      c.release();
    }
  });

  it("org admin мэдээ устгах", async () => {
    const c = await pool.connect();
    try {
      let createdId: string | undefined;
      await asUser(c, adminId, async () => {
        const { rows } = await c.query(
          `SELECT * FROM public.cmd_create_news('Тест-Устгах', '', 'Агуулга', '', false)`,
        );
        createdId = rows[0].id;
        const { rows: del } = await c.query(
          "SELECT public.cmd_delete_news($1) AS ok",
          [createdId],
        );
        expect(del[0].ok).toBe(true);
      });
      const { rows: check } = await client.query(
        "SELECT id FROM public.news WHERE id = $1",
        [createdId],
      );
      expect(check.length).toBe(0);
    } finally {
      c.release();
    }
  });

  it("org гишүүн биш хэрэглэгч мэдээ үүсгэх боломжгүй", async () => {
    const c = await pool.connect();
    try {
      await expect(
        asUser(c, outsiderId, async () => {
          await c.query(
            `SELECT public.cmd_create_news('Тест-Хориотой', '', 'Агуулга', '', false)`,
          );
        }),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });

  it("нэвтрээгүй хэрэглэгч cmd_create_news дуудах боломжгүй", async () => {
    const c = await pool.connect();
    try {
      await expect(
        c.query(
          `SELECT public.cmd_create_news('Тест-Анон', '', 'Агуулга', '', false)`,
        ),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });
});

// ── RLS isolation ──────────────────────────────────────────────────────────

describe("news RLS isolation", () => {
  it("org гишүүн биш хэрэглэгч шууд бичих боломжгүй", async () => {
    const c = await pool.connect();
    try {
      await expect(
        asUser(c, outsiderId, async () => {
          await c.query(
            `INSERT INTO public.news (title, body) VALUES ('Тест-Хориотой', 'Агуулга')`,
          );
        }),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });

  it("анон хэрэглэгч нийтэлсэн мэдээг харна, ноорогыг хардаггүй", async () => {
    const c = await pool.connect();
    try {
      await asAnon(c, async () => {
        const { rows } = await c.query(
          "SELECT id FROM public.news WHERE title IN ($1, $2)",
          ["Тест-Нийтэлсэн", "Тест-Ноорог"],
        );
        const ids = rows.map((r) => r.id);
        expect(ids).toContain(publishedId);
        expect(ids).not.toContain(draftId);
      });
    } finally {
      c.release();
    }
  });

  it("org admin ноорог мэдээг харна", async () => {
    const c = await pool.connect();
    try {
      await asUser(c, adminId, async () => {
        const { rows } = await c.query(
          "SELECT id FROM public.news WHERE id = $1",
          [draftId],
        );
        expect(rows.length).toBe(1);
      });
    } finally {
      c.release();
    }
  });

  it("v_public_news зөвхөн нийтэлсэн мэдээг буцаана", async () => {
    const c = await pool.connect();
    try {
      await asAnon(c, async () => {
        const { rows } = await c.query(
          "SELECT id, title FROM public.v_public_news WHERE title LIKE 'Тест-%'",
        );
        const ids = rows.map((r) => r.id);
        expect(ids).toContain(publishedId);
        expect(ids).not.toContain(draftId);
      });
    } finally {
      c.release();
    }
  });
});
