import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEED_ADMIN_ID, SEED_ORG_ID } from "./seed-constants";
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
    "DELETE FROM public.memberships WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@org-test.mn')",
  );
  await pool.query(
    "DELETE FROM auth.users WHERE email LIKE '%@org-test.mn' AND id != $1",
    [SEED_ADMIN_ID],
  );
  if (client) await client.release();
  await closePool();
});

describe("org identity RLS", () => {
  it("orgs are readable by anon users", async () => {
    const { rows } = await client.query(
      "SELECT id, name FROM public.organizations WHERE id = $1",
      [SEED_ORG_ID],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBeTruthy();
  });

  it("orgs have slug after migration", async () => {
    const { rows } = await client.query(
      "SELECT id, slug FROM public.organizations WHERE id = $1",
      [SEED_ORG_ID],
    );
    expect(rows[0].slug).toBeTruthy();
  });

  it("org columns were extended correctly", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations'",
    );
    const columns = rows.map((r: { column_name: string }) => r.column_name);
    expect(columns).toContain("slug");
    expect(columns).toContain("logo_url");
    expect(columns).toContain("contact_phone");
    expect(columns).toContain("contact_email");
    expect(columns).toContain("website");
    expect(columns).toContain("settings");
  });
});

describe("cmd_update_organization authorization", () => {
  it("org owner can update org profile", async () => {
    const newName = `Шинэ нэр ${Date.now()}`;
    const { rows } = await asUser(client, SEED_ADMIN_ID, async () => {
      return client.query(
        "SELECT public.cmd_update_organization($1, p_name => $2) AS id",
        [SEED_ORG_ID, newName],
      );
    });
    expect(rows.length).toBe(1);

    // Verify the name changed
    const { rows: orgRows } = await client.query(
      "SELECT name FROM public.organizations WHERE id = $1",
      [SEED_ORG_ID],
    );
    expect(orgRows[0].name).toBe(newName);

    // Restore
    await client.query(
      "UPDATE public.organizations SET name = 'Монголын Сагсан Бөмбөгийн Холбоо' WHERE id = $1",
      [SEED_ORG_ID],
    );
  });

  it("org owner can update multiple fields", async () => {
    const testSlug = `test-org-${Date.now()}`;
    await asUser(client, SEED_ADMIN_ID, async () => {
      await client.query(
        "SELECT public.cmd_update_organization($1, p_slug => $2, p_contact_phone => $3, p_contact_email => $4)",
        [SEED_ORG_ID, testSlug, "+976-99111111", "test@test.mn"],
      );
    });

    const { rows } = await client.query(
      "SELECT slug, contact_phone, contact_email FROM public.organizations WHERE id = $1",
      [SEED_ORG_ID],
    );
    expect(rows[0].slug).toBe(testSlug);
    expect(rows[0].contact_phone).toBe("+976-99111111");
    expect(rows[0].contact_email).toBe("test@test.mn");
  });

  it("non-member cannot update org", async () => {
    const user = await createTestUser(pool);

    await expect(
      asUser(client, user.id, async () => {
        await client.query(
          "SELECT public.cmd_update_organization($1, p_name => 'hacker')",
          [SEED_ORG_ID],
        );
      }),
    ).rejects.toThrow(/not authorized/);
  });

  it("org member with scorekeeper role cannot update org", async () => {
    const user = await createTestUser(pool);
    // Grant scorekeeper role — not enough for org updates
    await client.query(
      `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
       VALUES ($1, 'org', $2, 'scorekeeper')
       ON CONFLICT (user_id, scope_type, scope_id, role) DO NOTHING`,
      [user.id, SEED_ORG_ID],
    );

    await expect(
      asUser(client, user.id, async () => {
        await client.query(
          "SELECT public.cmd_update_organization($1, p_name => 'hacker')",
          [SEED_ORG_ID],
        );
      }),
    ).rejects.toThrow(/not authorized/);
  });
});
