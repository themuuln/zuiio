// @vitest-environment node
/**
 * Integration tests for shop v2 features against a real Postgres database.
 * Tests RLS policies on product_reviews, product_bundles, bundle_items,
 * and the v_public_shop_products view's team join.
 *
 * Run: supabase start && pnpm test:integration
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  asUser,
  closePool,
  createTestUser,
  newPool,
} from "@/test/setup-integration";

let pool: Pool;

beforeAll(async () => {
  pool = newPool();
});

afterAll(async () => {
  await closePool();
});

type H = Record<string, string>;

/** Minimum hierarchy needed to create a shop product */
async function hierarchy(pool: Pool): Promise<H> {
  const client = await pool.connect();
  try {
    // Need an org
    const org = await client.query(
      `INSERT INTO organizations (slug, name) VALUES ('shop-test-org-${Date.now()}', 'Shop Test Org') RETURNING id`,
    );
    const orgId = org.rows[0].id;

    // Need a league for the team
    const league = await client.query(
      `INSERT INTO leagues (organization_id, name, slug) VALUES ($1, 'Shop Test League', 'shop-test-league') RETURNING id`,
      [orgId],
    );
    const leagueId = league.rows[0].id;

    // Need a team for team connection tests
    const team = await client.query(
      `INSERT INTO teams (league_id, name, short_code, slug) VALUES ($1, 'Shop Test Team', 'SHPT', 'shop-test-team') RETURNING id`,
      [leagueId],
    );
    const teamId = team.rows[0].id;

    // Need a product
    const product = await client.query(
      `INSERT INTO products (name, slug, price_mnt, images, variants, is_available, team_id)
       VALUES ('Test Jersey', 'test-jersey', 50000, '[]'::jsonb, '[{"size":"L","stock":10}]'::jsonb, true, $1)
       RETURNING id`,
      [teamId],
    );
    const productId = product.rows[0].id;

    return { orgId, leagueId, teamId, productId };
  } finally {
    client.release();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RLS: product_reviews
// ═══════════════════════════════════════════════════════════════════════

describe("RLS — product_reviews", () => {
  let h: H;
  let client: PoolClient;

  beforeAll(async () => {
    h = await hierarchy(pool);
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
  });

  it("anon can insert a review", async () => {
    const { rows } = await client.query(
      `INSERT INTO product_reviews (product_id, author_name, rating, content)
       VALUES ($1, 'Анон', 5, 'Сайхан')
       RETURNING id, is_approved`,
      [h.productId],
    );
    expect(rows[0].is_approved).toBe(false);
  });

  it("anon cannot see unapproved reviews", async () => {
    // Insert as anon (no user context)
    const { rows: insertRows } = await client.query(
      `INSERT INTO product_reviews (product_id, author_name, rating, content)
       VALUES ($1, 'Анон', 4, 'Дэлгэрэнгүй') RETURNING id`,
      [h.productId],
    );
    const reviewId = insertRows[0].id;

    // Anon select should only see approved
    const { rows: selectRows } = await client.query(
      `SELECT id FROM product_reviews WHERE id = $1`,
      [reviewId],
    );
    expect(selectRows).toHaveLength(0);
  });

  it("anon can see approved reviews", async () => {
    // Insert as anon
    const { rows: insertRows } = await client.query(
      `INSERT INTO product_reviews (product_id, author_name, rating, content)
       VALUES ($1, 'Бат', 5, 'Маш сайн') RETURNING id`,
      [h.productId],
    );
    const reviewId = insertRows[0].id;

    // Mark as approved (service role operation)
    await client.query(
      `UPDATE product_reviews SET is_approved = true WHERE id = $1`,
      [reviewId],
    );

    // Anon should see it now
    const { rows: selectRows } = await client.query(
      `SELECT id, author_name FROM product_reviews WHERE id = $1`,
      [reviewId],
    );
    expect(selectRows).toHaveLength(1);
    expect(selectRows[0].author_name).toBe("Бат");
  });

  it("authenticated user can see all reviews", async () => {
    const user = await createTestUser(pool);

    await asUser(client, user.id, async () => {
      // Insert a review
      const { rows: insertRows } = await client.query(
        `INSERT INTO product_reviews (product_id, author_name, rating, content)
         VALUES ($1, 'Хэрэглэгч', 3, 'Дунд') RETURNING id`,
        [h.productId],
      );
      const reviewId = insertRows[0].id;

      // Admin can see unapproved reviews via authenticated role
      const { rows: selectRows } = await client.query(
        `SELECT id FROM product_reviews WHERE id = $1`,
        [reviewId],
      );
      expect(selectRows).toHaveLength(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// RLS: product_bundles
// ═══════════════════════════════════════════════════════════════════════

describe("RLS — product_bundles", () => {
  let h: H;
  let client: PoolClient;

  beforeAll(async () => {
    h = await hierarchy(pool);
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
  });

  it("anon can see active bundles", async () => {
    const { rows } = await client.query(
      `INSERT INTO product_bundles (name, discount_percent, is_active)
       VALUES ('Test Bundle', 10, true) RETURNING id`,
    );
    expect(rows[0].id).toBeDefined();

    // Anon should see active bundles
    const { rows: selectRows } = await client.query(
      `SELECT id FROM product_bundles WHERE is_active = true`,
    );
    expect(selectRows.length).toBeGreaterThanOrEqual(1);
  });

  it("anon cannot see inactive bundles", async () => {
    const { rows: insertRows } = await client.query(
      `INSERT INTO product_bundles (name, discount_percent, is_active)
       VALUES ('Hidden Bundle', 20, false) RETURNING id`,
    );
    const bundleId = insertRows[0].id;

    // Anon should NOT see inactive bundles
    const { rows: selectRows } = await client.query(
      `SELECT id FROM product_bundles WHERE id = $1`,
      [bundleId],
    );
    expect(selectRows).toHaveLength(0);
  });

  it("authenticated user can manage bundles", async () => {
    const user = await createTestUser(pool);

    await asUser(client, user.id, async () => {
      // Can create
      const { rows: createRows } = await client.query(
        `INSERT INTO product_bundles (name, discount_percent, is_active)
         VALUES ('Admin Bundle', 15, true) RETURNING id`,
      );
      const bundleId = createRows[0].id;

      // Can update
      await client.query(
        `UPDATE product_bundles SET discount_percent = 25 WHERE id = $1`,
        [bundleId],
      );

      // Can read
      const { rows: selectRows } = await client.query(
        `SELECT discount_percent FROM product_bundles WHERE id = $1`,
        [bundleId],
      );
      expect(selectRows[0].discount_percent).toBe(25);

      // Can delete
      await client.query(`DELETE FROM product_bundles WHERE id = $1`, [
        bundleId,
      ]);
      const { rows: remaining } = await client.query(
        `SELECT id FROM product_bundles WHERE id = $1`,
        [bundleId],
      );
      expect(remaining).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// RLS: bundle_items
// ═══════════════════════════════════════════════════════════════════════

describe("RLS — bundle_items", () => {
  let h: H;
  let client: PoolClient;
  let bundleId: string;

  beforeAll(async () => {
    h = await hierarchy(pool);
    client = await pool.connect();

    // Create a test bundle
    const { rows } = await client.query(
      `INSERT INTO product_bundles (name, discount_percent, is_active)
       VALUES ('Item Test Bundle', 10, true) RETURNING id`,
    );
    bundleId = rows[0].id;
  });

  afterAll(async () => {
    client.release();
  });

  it("anon can read items of active bundles", async () => {
    // Insert an item as service role
    await client.query(
      `INSERT INTO bundle_items (bundle_id, product_id) VALUES ($1, $2)`,
      [bundleId, h.productId],
    );

    // Anon should see items of active bundles
    const { rows } = await client.query(
      `SELECT product_id FROM bundle_items WHERE bundle_id = $1`,
      [bundleId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].product_id).toBe(h.productId);
  });

  it("authenticated user can manage bundle items", async () => {
    const user = await createTestUser(pool);

    await asUser(client, user.id, async () => {
      // Can insert
      await client.query(
        `INSERT INTO bundle_items (bundle_id, product_id) VALUES ($1, $2)`,
        [bundleId, h.productId],
      );

      // Can read
      const { rows } = await client.query(
        `SELECT product_id FROM bundle_items WHERE bundle_id = $1`,
        [bundleId],
      );
      expect(rows.length).toBeGreaterThanOrEqual(1);

      // Can delete
      await client.query(
        `DELETE FROM bundle_items WHERE bundle_id = $1 AND product_id = $2`,
        [bundleId, h.productId],
      );
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// View: v_public_shop_products team join
// ═══════════════════════════════════════════════════════════════════════

describe("v_public_shop_products — team join", () => {
  let h: H;

  beforeAll(async () => {
    h = await hierarchy(pool);
  });

  it("includes team columns when product has team_id", async () => {
    const { rows } = await pool.query(
      `SELECT id, team_id, team_name, team_slug, team_primary_color, team_short_code
       FROM v_public_shop_products
       WHERE id = $1`,
      [h.productId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].team_id).toBe(h.teamId);
    expect(rows[0].team_name).toBe("Shop Test Team");
    expect(rows[0].team_slug).toBe("shop-test-team");
    expect(rows[0].team_short_code).toBe("SHPT");
  });

  it("returns null team columns when product has no team_id", async () => {
    // Insert a product without team_id
    const { rows } = await pool.query(
      `INSERT INTO products (name, slug, price_mnt, images, variants, is_available)
       VALUES ('Orphan Product', 'orphan-product', 25000, '[]'::jsonb, '[]'::jsonb, true)
       RETURNING id`,
    );
    const orphanId = rows[0].id;

    const { rows: viewRows } = await pool.query(
      `SELECT team_id, team_name FROM v_public_shop_products WHERE id = $1`,
      [orphanId],
    );
    expect(viewRows).toHaveLength(1);
    expect(viewRows[0].team_id).toBeNull();
    expect(viewRows[0].team_name).toBeNull();
  });

  it("filters by team_slug correctly", async () => {
    const { rows } = await pool.query(
      `SELECT id FROM v_public_shop_products WHERE team_slug = 'shop-test-team'`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].id).toBe(h.productId);
  });
});
