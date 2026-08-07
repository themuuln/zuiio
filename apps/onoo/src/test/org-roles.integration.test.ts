import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEED_ADMIN_ID, SEED_ORG_ID } from "./seed-constants";
import { asUser, createTestUser, newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();
  // Ensure admin has org owner membership for tests
  await client.query(
    `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
     VALUES ($1, 'org', $2, 'owner')
     ON CONFLICT (user_id, scope_type, scope_id, role) DO NOTHING`,
    [SEED_ADMIN_ID, SEED_ORG_ID],
  );
});

afterAll(async () => {
  // Clean up test memberships
  await pool.query(
    "DELETE FROM public.memberships WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@role-test.mn')",
  );
  await pool.query(
    "DELETE FROM auth.users WHERE email LIKE '%@role-test.mn' AND id != $1",
    [SEED_ADMIN_ID],
  );
  client.release();
  await pool.end();
});

describe("role enum extensions", () => {
  it("has all expected role values", async () => {
    const { rows } = await client.query(
      "SELECT unnest(enum_range(NULL::public.membership_role)) AS role",
    );
    const roles = rows.map((r: { role: string }) => r.role);
    expect(roles).toContain("owner");
    expect(roles).toContain("admin");
    expect(roles).toContain("coordinator");
    expect(roles).toContain("finance");
    expect(roles).toContain("manager");
    expect(roles).toContain("trainer");
    expect(roles).toContain("scorekeeper");
    expect(roles).toContain("viewer");
  });
});

describe("cmd_assign_role authorization", () => {
  it("admin can assign manager role", async () => {
    const user = await createTestUser(pool);

    await asUser(client, SEED_ADMIN_ID, async () => {
      const { rows } = await client.query(
        "SELECT (public.cmd_assign_role($1, 'org', $2, 'manager')).id AS id",
        [user.id, SEED_ORG_ID],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBeTruthy();
    });

    const { rows } = await client.query(
      "SELECT role FROM public.memberships WHERE user_id = $1 AND scope_type = 'org' AND scope_id = $2",
      [user.id, SEED_ORG_ID],
    );
    expect(rows[0].role).toBe("manager");
  });

  it("assigning same role again raises error", async () => {
    await expect(
      asUser(client, SEED_ADMIN_ID, async () => {
        await client.query(
          "SELECT public.cmd_assign_role($1, 'org', $2, 'manager')",
          [SEED_ADMIN_ID, SEED_ORG_ID],
        );
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("non-admin cannot assign roles", async () => {
    const user = await createTestUser(pool);

    await expect(
      asUser(client, user.id, async () => {
        await client.query(
          "SELECT public.cmd_assign_role($1, 'org', $2, 'viewer')",
          [SEED_ADMIN_ID, SEED_ORG_ID],
        );
      }),
    ).rejects.toThrow(/not authorized/);
  });

  it("only owner can create another owner", async () => {
    const adminUser = await createTestUser(pool);
    await asUser(client, SEED_ADMIN_ID, async () => {
      await client.query(
        "SELECT public.cmd_assign_role($1, 'org', $2, 'admin')",
        [adminUser.id, SEED_ORG_ID],
      );
    });

    const targetUser = await createTestUser(pool);

    await expect(
      asUser(client, adminUser.id, async () => {
        await client.query(
          "SELECT public.cmd_assign_role($1, 'org', $2, 'owner')",
          [targetUser.id, SEED_ORG_ID],
        );
      }),
    ).rejects.toThrow(/only owner/);
  });
});

describe("cmd_list_members", () => {
  it("lists members for an org scope", async () => {
    const { rows } = await asUser(client, SEED_ADMIN_ID, async () => {
      return client.query("SELECT * FROM public.cmd_list_members('org', $1)", [
        SEED_ORG_ID,
      ]);
    });

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].membership_id).toBeTruthy();
    expect(rows[0].user_id).toBeTruthy();
    expect(rows[0].role).toBeTruthy();
  });

  it("viewer can list members", async () => {
    const user = await createTestUser(pool);

    await asUser(client, SEED_ADMIN_ID, async () => {
      await client.query(
        "SELECT public.cmd_assign_role($1, 'org', $2, 'viewer')",
        [user.id, SEED_ORG_ID],
      );
    });

    const { rows } = await asUser(client, user.id, async () => {
      return client.query("SELECT * FROM public.cmd_list_members('org', $1)", [
        SEED_ORG_ID,
      ]);
    });
    expect(rows.length).toBeGreaterThan(0);
  });

  it("non-member cannot list members", async () => {
    const user = await createTestUser(pool);

    await expect(
      asUser(client, user.id, async () => {
        await client.query("SELECT * FROM public.cmd_list_members('org', $1)", [
          SEED_ORG_ID,
        ]);
      }),
    ).rejects.toThrow(/not authorized/);
  });
});

describe("cmd_remove_role", () => {
  it("admin can remove a role", async () => {
    const user = await createTestUser(pool);

    let membershipId: string;
    await asUser(client, SEED_ADMIN_ID, async () => {
      const { rows } = await client.query(
        "SELECT (public.cmd_assign_role($1, 'org', $2, 'viewer')).id AS id",
        [user.id, SEED_ORG_ID],
      );
      membershipId = rows[0].id;

      await client.query("SELECT public.cmd_remove_role($1)", [membershipId]);
    });

    const { rows } = await client.query(
      "SELECT id FROM public.memberships WHERE id = $1",
      [membershipId!],
    );
    expect(rows.length).toBe(0);
  });

  it("non-admin cannot remove roles", async () => {
    const targetUser = await createTestUser(pool);
    const attacker = await createTestUser(pool);

    await asUser(client, SEED_ADMIN_ID, async () => {
      await client.query(
        "SELECT public.cmd_assign_role($1, 'org', $2, 'viewer')",
        [targetUser.id, SEED_ORG_ID],
      );
      await client.query(
        "SELECT public.cmd_assign_role($1, 'org', $2, 'viewer')",
        [attacker.id, SEED_ORG_ID],
      );
    });

    const { rows: memRows } = await client.query(
      "SELECT id FROM public.memberships WHERE user_id = $1 AND scope_type = 'org' AND scope_id = $2 AND role = 'viewer'",
      [targetUser.id, SEED_ORG_ID],
    );

    await expect(
      asUser(client, attacker.id, async () => {
        await client.query("SELECT public.cmd_remove_role($1)", [
          memRows[0].id,
        ]);
      }),
    ).rejects.toThrow(/not authorized/);
  });
});
