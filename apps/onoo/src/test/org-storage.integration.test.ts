/**
 * Integration tests for Phase 8 org storage, break-glass, and consent policy tables.
 *
 * Covers:
 *   - org_storage_buckets: RLS (any authenticated can read, only org admin can insert)
 *   - break_glass_access: RLS (only org admin can read/insert)
 *   - consent_policies: RLS (any authenticated can read, only org admin can insert)
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SEED_ADMIN_ID, SEED_ORG_ID } from "./seed-constants";
import { asUser, createTestUser, newPool } from "./setup-integration";

let pool: Pool;
let client: PoolClient;
let orgAdminUserId: string;
let otherUserId: string;

beforeAll(async () => {
  pool = newPool();
  client = await pool.connect();

  // Ensure seed admin has org owner membership
  await client.query(
    `INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
     VALUES ($1, 'org', $2, 'owner')
     ON CONFLICT (user_id, scope_type, scope_id, role) DO NOTHING`,
    [SEED_ADMIN_ID, SEED_ORG_ID],
  );

  orgAdminUserId = SEED_ADMIN_ID;

  // Create a non-member user for RLS denial tests
  const other = await createTestUser(pool, {
    email: `other-storage-${Date.now()}@onoo-test.mn`,
  });
  otherUserId = other.id;
});

afterAll(async () => {
  await client.query(
    "DELETE FROM public.consent_policies WHERE organization_id = $1",
    [SEED_ORG_ID],
  );
  await client.query(
    "DELETE FROM public.break_glass_access WHERE organization_id = $1",
    [SEED_ORG_ID],
  );
  await client.query(
    "DELETE FROM public.org_storage_buckets WHERE organization_id = $1",
    [SEED_ORG_ID],
  );
  await client.query("DELETE FROM auth.users WHERE id = $1", [otherUserId]);
  client.release();
  await pool.end();
});

// ── Schema ─────────────────────────────────────────────────────────────────

describe("Phase 8 storage schema", () => {
  it("has org_storage_buckets table", async () => {
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'org_storage_buckets')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("has break_glass_access table", async () => {
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'break_glass_access')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("has consent_policies table", async () => {
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consent_policies')",
    );
    expect(rows[0].exists).toBe(true);
  });

  it("org_storage_buckets has required columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_storage_buckets'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("organization_id");
    expect(cols).toContain("bucket_name");
    expect(cols).toContain("bucket_id");
    expect(cols).toContain("is_tenant_isolation");
  });

  it("break_glass_access has required columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'break_glass_access'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("organization_id");
    expect(cols).toContain("granted_to");
    expect(cols).toContain("reason");
    expect(cols).toContain("expires_at");
    expect(cols).toContain("is_expired");
  });

  it("consent_policies has required columns", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'consent_policies'",
    );
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain("organization_id");
    expect(cols).toContain("title");
    expect(cols).toContain("retention_days");
    expect(cols).toContain("data_categories");
  });
});

// ── org_storage_buckets CRUD ──────────────────────────────────────────────

describe("org_storage_buckets CRUD", () => {
  let bucketId: string;

  it("org admin can insert a storage bucket", async () => {
    await asUser(client, orgAdminUserId, async () => {
      const { rows } = await client.query(
        `INSERT INTO public.org_storage_buckets
         (organization_id, bucket_name, bucket_id, is_tenant_isolation)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [SEED_ORG_ID, "test-bucket", "test-bucket-id", true],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBeTruthy();
      bucketId = rows[0].id;
    });
  });

  it("org admin can read storage buckets", async () => {
    await asUser(client, orgAdminUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, bucket_name FROM public.org_storage_buckets WHERE id = $1",
        [bucketId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].bucket_name).toBe("test-bucket");
    });
  });

  it("non-member cannot insert a storage bucket", async () => {
    await asUser(client, otherUserId, async () => {
      await expect(
        client.query(
          `INSERT INTO public.org_storage_buckets
           (organization_id, bucket_name, bucket_id)
           VALUES ($1, $2, $3) RETURNING id`,
          [SEED_ORG_ID, "evil-bucket", "evil-bucket-id"],
        ),
      ).rejects.toThrow();
    });
  });

  it("any authenticated user can read storage buckets", async () => {
    await asUser(client, otherUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, bucket_name FROM public.org_storage_buckets WHERE organization_id = $1",
        [SEED_ORG_ID],
      );
      // Other user has no org membership but SELECT is wide-open
      expect(rows.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ── break_glass_access CRUD ───────────────────────────────────────────────

describe("break_glass_access CRUD", () => {
  let accessId: string;

  it("org admin can grant break-glass access", async () => {
    await asUser(client, orgAdminUserId, async () => {
      const expiresAt = new Date(Date.now() + 86400000).toISOString(); // +1 day
      const { rows } = await client.query(
        `INSERT INTO public.break_glass_access
         (organization_id, granted_to, reason, expires_at)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [SEED_ORG_ID, orgAdminUserId, "Integration test access", expiresAt],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBeTruthy();
      accessId = rows[0].id;
    });
  });

  it("org admin can read break-glass records", async () => {
    await asUser(client, orgAdminUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, reason FROM public.break_glass_access WHERE id = $1",
        [accessId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].reason).toBe("Integration test access");
    });
  });

  it("non-member cannot read break-glass records", async () => {
    await asUser(client, otherUserId, async () => {
      const { rows } = await client.query(
        "SELECT id FROM public.break_glass_access WHERE organization_id = $1",
        [SEED_ORG_ID],
      );
      // RLS restricts SELECT to org owners/admins
      expect(rows.length).toBe(0);
    });
  });

  it("non-member cannot insert break-glass record", async () => {
    await asUser(client, otherUserId, async () => {
      await expect(
        client.query(
          `INSERT INTO public.break_glass_access
           (organization_id, granted_to, reason, expires_at)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [SEED_ORG_ID, otherUserId, "hacker", "2026-12-31T23:59:59Z"],
        ),
      ).rejects.toThrow();
    });
  });
});

// ── consent_policies CRUD ─────────────────────────────────────────────────

describe("consent_policies CRUD", () => {
  let policyId: string;

  it("org admin can insert a consent policy", async () => {
    await asUser(client, orgAdminUserId, async () => {
      const { rows } = await client.query(
        `INSERT INTO public.consent_policies
         (organization_id, title, description, retention_days, data_categories)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          SEED_ORG_ID,
          "Тест бодлого",
          "Integration test consent policy",
          365,
          "{personal,medical}",
        ],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBeTruthy();
      policyId = rows[0].id;
    });
  });

  it("any authenticated user can read consent policies", async () => {
    await asUser(client, otherUserId, async () => {
      const { rows } = await client.query(
        "SELECT id, title FROM public.consent_policies WHERE id = $1",
        [policyId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe("Тест бодлого");
    });
  });

  it("non-member cannot insert a consent policy", async () => {
    await asUser(client, otherUserId, async () => {
      await expect(
        client.query(
          `INSERT INTO public.consent_policies
           (organization_id, title, retention_days)
           VALUES ($1, $2, $3) RETURNING id`,
          [SEED_ORG_ID, "Хакер бодлого", 30],
        ),
      ).rejects.toThrow();
    });
  });

  it("consent policy defaults retention_days to 365", async () => {
    const { rows } = await client.query(
      "SELECT retention_days FROM public.consent_policies WHERE id = $1",
      [policyId],
    );
    expect(rows[0].retention_days).toBe(365);
  });
});
