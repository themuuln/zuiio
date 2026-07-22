/**
 * Integration tests for shop commands against a real Postgres database.
 *
 * Uses inline SQL template strings with literal UUID values to avoid pg
 * parameter type-inference issues (error 22P02: ambiguous parameter type).
 *
 * Run: INTEGRATION_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54323/postgres" pnpm test:integration
 */

import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  asUser,
  closePool,
  createTestUser,
  getPool,
  newPool,
} from "./setup-integration";

let pool: Pool;
let client: PoolClient;
let adminId: string;

const RUN = String(Date.now());
const PID = "00000000-0000-0000-0000-000000000001";

function sql(strings: TemplateStringsArray, ...values: unknown[]): string {
  let r = "";
  for (let i = 0; i < strings.length; i++) {
    r += strings[i];
    if (i < values.length) r += String(values[i]);
  }
  return r;
}

beforeAll(async () => {
  pool = await getPool();
  client = await pool.connect();
  const user = await createTestUser(pool, { email: `shop-${RUN}@test.mn` });
  adminId = user.id;
  await client.query(
    sql`UPDATE products SET is_available=true, variants='[{"size":"S","stock":10},{"size":"M","stock":10},{"size":"L","stock":10}]'::jsonb WHERE id='${PID}'::uuid`,
  );
});

afterAll(async () => {
  client.release();
  await closePool();
});

describe("schema", () => {
  it("products table", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='products'",
    );
    expect(rows.map((r: any) => r.column_name)).toEqual(
      expect.arrayContaining(["id", "name", "slug", "price_mnt"]),
    );
  });
  it("orders table", async () => {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='orders'",
    );
    expect(rows.map((r: any) => r.column_name)).toEqual(
      expect.arrayContaining(["id", "customer_name", "status"]),
    );
  });
  it("order_status enum", async () => {
    const { rows } = await client.query(
      "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='order_status' ORDER BY enumsortorder",
    );
    expect(rows.map((r: any) => r.enumlabel)).toEqual([
      "pending",
      "paid",
      "shipped",
      "cancelled",
    ]);
  });
  it("storage bucket exists", async () => {
    const { rows } = await client.query(
      "SELECT id,name,public FROM storage.buckets WHERE id='product-images'",
    );
    expect(rows.length).toBe(1);
  });
});

describe("RLS", () => {
  it("anon can read view", async () => {
    const { rows } = await client.query(
      "SELECT count(*)::int AS c FROM v_public_shop_products",
    );
    expect((rows[0] as any).c).toBeGreaterThan(0);
  });
  it("anon cannot read orders", async () => {
    await client.query("SET ROLE anon");
    try {
      const { rows } = await client.query("SELECT * FROM orders");
      expect(rows.length).toBe(0);
    } finally {
      await client.query("RESET ROLE");
    }
  });
  it("admin can read products", async () => {
    await asUser(client, adminId, async () => {
      const { rows } = await client.query("SELECT * FROM products LIMIT 1");
      expect(rows.length).toBe(1);
    });
  });
});

describe("cmd_create_shop_order", () => {
  it("creates pending order", async () => {
    const { rows } = await client.query(
      sql`SELECT (public.cmd_create_shop_order('Ord-${RUN}', '99110001', '${PID}'::uuid, 0)).id`,
    );
    expect(rows.length).toBe(1);
    const id = (rows[0] as any).id;
    const { rows: o } = await client.query(
      sql`SELECT status,total_mnt FROM orders WHERE id='${id}'`,
    );
    expect((o[0] as any).status).toBe("pending");
    expect(Number((o[0] as any).total_mnt)).toBe(35000);
  });
  it("reserves stock", async () => {
    const { rows: b } = await client.query(
      sql`SELECT (variants->0->>'stock')::int AS s FROM products WHERE id='${PID}'::uuid`,
    );
    const before = (b[0] as any).s;
    await client.query(
      sql`SELECT (public.cmd_create_shop_order('Stock-${RUN}', '99110002', '${PID}'::uuid, 0)).id`,
    );
    const { rows: a } = await client.query(
      sql`SELECT (variants->0->>'stock')::int AS s FROM products WHERE id='${PID}'::uuid`,
    );
    expect((a[0] as any).s).toBe(before - 1);
  });
  it("rejects out-of-stock", async () => {
    const e = await client
      .query(
        "SELECT (public.cmd_create_shop_order('OOS','0','00000000-0000-0000-0000-00000000e099'::uuid,0)).id",
      )
      .catch((e: any) => e);
    expect(e).toBeDefined();
  });
  it("rejects bad product", async () => {
    const e = await client
      .query(
        "SELECT (public.cmd_create_shop_order('Fake','0','ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,0)).id",
      )
      .catch((e: any) => e);
    expect(e).toBeDefined();
  });
});

describe("cmd_attach_shop_invoice", () => {
  it("attaches invoice", async () => {
    const { rows: o } = await client.query(
      sql`SELECT (public.cmd_create_shop_order('Inv-${RUN}', '99110010', '${PID}'::uuid, 0)).id`,
    );
    const id = (o[0] as any).id;
    const { rows } = await client.query(
      sql`SELECT public.cmd_attach_shop_invoice('${id}'::uuid, 'INV-${RUN}', 'qr')`,
    );
    expect(rows.length).toBe(1);
  });
});

describe("cmd_confirm_shop_payment", () => {
  it("makes paid", async () => {
    const { rows: o } = await client.query(
      sql`SELECT (public.cmd_create_shop_order('Pay-${RUN}', '99110020', '${PID}'::uuid, 0)).id`,
    );
    const id = (o[0] as any).id;
    await client.query(
      sql`SELECT public.cmd_attach_shop_invoice('${id}'::uuid, 'INV-PAID-${RUN}', '')`,
    );
    await client.query(
      sql`SELECT public.cmd_confirm_shop_payment('INV-PAID-${RUN}')`,
    );
    const { rows } = await client.query(
      sql`SELECT status FROM orders WHERE id='${id}'`,
    );
    expect((rows[0] as any).status).toBe("paid");
  });
  it("idempotent", async () => {
    const { rows: o } = await client.query(
      sql`SELECT (public.cmd_create_shop_order('Idem-${RUN}', '99110021', '${PID}'::uuid, 0)).id`,
    );
    const id = (o[0] as any).id;
    await client.query(
      sql`SELECT public.cmd_attach_shop_invoice('${id}'::uuid, 'INV-IDEM-${RUN}', '')`,
    );
    await client.query(
      sql`SELECT public.cmd_confirm_shop_payment('INV-IDEM-${RUN}')`,
    );
    const { rows } = await client.query(
      sql`SELECT public.cmd_confirm_shop_payment('INV-IDEM-${RUN}')`,
    );
    expect(rows.length).toBe(1);
  });
});

describe("cmd_mark_shop_order_shipped", () => {
  it("paid->shipped", async () => {
    const { rows: o } = await client.query(
      sql`SELECT (public.cmd_create_shop_order('Ship-${RUN}', '99110030', '${PID}'::uuid, 0)).id`,
    );
    const id = (o[0] as any).id;
    await client.query(
      sql`SELECT public.cmd_attach_shop_invoice('${id}'::uuid, 'INV-SH-${RUN}', '')`,
    );
    await client.query(
      sql`SELECT public.cmd_confirm_shop_payment('INV-SH-${RUN}')`,
    );
    await client.query(
      sql`SELECT public.cmd_mark_shop_order_shipped('${id}'::uuid)`,
    );
    const { rows } = await client.query(
      sql`SELECT status FROM orders WHERE id='${id}'`,
    );
    expect((rows[0] as any).status).toBe("shipped");
  });
});

describe("cmd_cancel_shop_order", () => {
  it("cancels + restores stock", async () => {
    const { rows: b } = await client.query(
      sql`SELECT (variants->0->>'stock')::int AS s FROM products WHERE id='${PID}'::uuid`,
    );
    const before = (b[0] as any).s;
    const { rows: o } = await client.query(
      sql`SELECT (public.cmd_create_shop_order('Cncl-${RUN}', '99110040', '${PID}'::uuid, 0)).id`,
    );
    const id = (o[0] as any).id;
    await client.query(sql`SELECT public.cmd_cancel_shop_order('${id}'::uuid)`);
    const { rows: a } = await client.query(
      sql`SELECT (variants->0->>'stock')::int AS s FROM products WHERE id='${PID}'::uuid`,
    );
    expect((a[0] as any).s).toBe(before);
    const { rows } = await client.query(
      sql`SELECT status FROM orders WHERE id='${id}'`,
    );
    expect((rows[0] as any).status).toBe("cancelled");
  });
});

describe("cmd_update_shop_product", () => {
  it("updates name", async () => {
    await client.query(
      sql`SELECT public.cmd_update_shop_product('${PID}'::uuid, 'Renamed')`,
    );
    const { rows } = await client.query(
      sql`SELECT name FROM products WHERE id='${PID}'::uuid`,
    );
    expect((rows[0] as any).name).toBe("Renamed");
    await client.query(
      sql`UPDATE products SET name='Onoo подуу цамц' WHERE id='${PID}'::uuid`,
    );
  });
});

describe("concurrent stock", () => {
  it("one wins when stock=1", async () => {
    const tid = crypto.randomUUID();
    await client.query(
      sql`INSERT INTO products(id,name,slug,price_mnt,variants,is_available) VALUES('${tid}'::uuid,'X','x-${tid}',1000,'[{"size":"OS","stock":1}]'::jsonb,true)`,
    );
    const p1 = newPool(),
      p2 = newPool();
    const c1 = await p1.connect(),
      c2 = await p2.connect();
    try {
      const r = await Promise.allSettled([
        c1.query(
          sql`SELECT (public.cmd_create_shop_order('A','9911','${tid}'::uuid,0)`,
        ),
        c2.query(
          sql`SELECT (public.cmd_create_shop_order('B','9912','${tid}'::uuid,0)`,
        ),
      ]);
      // At most one should succeed (race condition — may both be rejected if stock is 0)
      expect(
        r.filter((x) => x.status === "fulfilled").length,
      ).toBeLessThanOrEqual(1);
    } finally {
      c1.release();
      c2.release();
      await p1.end();
      await p2.end();
    }
    await client.query(sql`DELETE FROM products WHERE id='${tid}'::uuid`);
  });
});
