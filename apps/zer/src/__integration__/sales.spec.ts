/**
 * Integration tests for Sales domain.
 *
 * Covers: sales, sale_items, stock_movements (out), returns, return_items,
 * process_shop_sale RPC, generate_return_number RPC.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestBranch,
  createTestOrg,
  createTestProduct,
  createTestUserWithPermissions,
  trackCleanup,
} from "./helpers";

interface SalesRpcResult {
  success?: boolean;
  error?: string;
  sale_id?: string;
}

// ── Direct CRUD (via service role) ───────────────────────────

describe("Sales CRUD", () => {
  const admin = createAdminClient();

  it("admin can create a sale with items", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 50,
    });

    const { data: sale, error } = await admin
      .from("sales")
      .insert({
        organization_id: orgId,
        branch_id: branchId,
        total_amount: 10000,
        paid_amount: 10000,
        payment_method: "cash",
        status: "completed",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(sale!.total_amount).toBe(10000);
    trackCleanup("sales", sale!.id);

    const { data: item } = await admin
      .from("sale_items")
      .insert({
        sale_id: sale!.id,
        product_id: productId,
        quantity: 2,
        unit_price: 5000,
        total_price: 10000,
      })
      .select()
      .single();
    expect(item!.quantity).toBe(2);
  });

  it("admin can create sale with all optional fields", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);

    const { data: sale } = await admin
      .from("sales")
      .insert({
        organization_id: orgId,
        branch_id: branchId,
        total_amount: 25000,
        paid_amount: 15000,
        payment_method: "card",
        payment_splits: { cash: 10000, card: 15000 },
        notes: "Test sale",
        status: "completed",
      })
      .select()
      .single();
    expect(sale!.payment_splits).toEqual({ cash: 10000, card: 15000 });
    expect(sale!.notes).toBe("Test sale");
    trackCleanup("sales", sale!.id);
  });
});

// ── Returns CRUD ─────────────────────────────────────────────

describe("Returns CRUD", () => {
  const admin = createAdminClient();

  it("can create a sales return with generated number", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 50,
    });

    const { data: sale } = await admin
      .from("sales")
      .insert({
        organization_id: orgId,
        branch_id: branchId,
        total_amount: 15000,
        paid_amount: 15000,
        payment_method: "cash",
        status: "completed",
      })
      .select()
      .single();
    trackCleanup("sales", sale!.id);
    await admin.from("sale_items").insert({
      sale_id: sale!.id,
      product_id: productId,
      quantity: 3,
      unit_price: 5000,
      total_price: 15000,
    });

    const { data: rn } = await admin.rpc("generate_return_number", {
      p_org_id: orgId,
    });
    expect(rn).toBeTruthy();

    const { data: ret } = await admin
      .from("returns")
      .insert({
        organization_id: orgId,
        return_number: rn as string,
        type: "sales_return",
        reference_type: "sale",
        reference_id: sale!.id,
        branch_id: branchId,
        status: "completed",
      })
      .select()
      .single();
    expect(ret!.return_number).toBe(rn);
    trackCleanup("returns", ret!.id);

    const { data: ri } = await admin
      .from("return_items")
      .insert({
        return_id: ret!.id,
        product_id: productId,
        quantity: 1,
        unit_price: 5000,
      })
      .select()
      .single();
    expect(ri!.total_price).toBe(5000);
  });

  it("can create purchase return in draft status", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { data: rn } = await admin.rpc("generate_return_number", {
      p_org_id: orgId,
    });

    const { data: ret } = await admin
      .from("returns")
      .insert({
        organization_id: orgId,
        return_number: rn as string,
        type: "purchase_return",
        branch_id: branchId,
        status: "draft",
      })
      .select()
      .single();
    expect(ret!.status).toBe("draft");
    trackCleanup("returns", ret!.id);
  });
});

// ── process_shop_sale RPC ────────────────────────────────────

describe("process_shop_sale RPC", () => {
  const admin = createAdminClient();

  it("creates sale + items + stock movements atomically", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 50,
    });

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "sales.create",
    ]);

    const { data, error } = await user.client.rpc("process_shop_sale", {
      p_org_id: orgId,
      p_branch_id: branchId,
      p_user_id: user.userId,
      p_contact_id: null,
      p_total_amount: 10000,
      p_paid_amount: 10000,
      p_payment_method: "cash",
      p_salesperson_id: null,
      p_items: [
        {
          product_id: productId,
          quantity: 2,
          unit_price: 5000,
          total_price: 10000,
          commission_amount: 0,
          variant_id: null,
        },
      ],
      p_movements: [
        {
          product_id: productId,
          quantity: 2,
          unit_cost: 3000,
          variant_id: null,
        },
      ],
      p_currency_code: "MNT",
      p_currency_symbol: "₮",
      p_exchange_rate: 1.0,
    });

    expect(error).toBeNull();
    const result = data as SalesRpcResult;
    expect(result.success).toBe(true);
    const saleId = result.sale_id;
    if (!saleId) throw new Error("process_shop_sale returned no sale id");
    trackCleanup("sales", saleId);

    const { data: sale } = await admin
      .from("sales")
      .select("*")
      .eq("id", saleId)
      .single();
    expect(sale!.total_amount).toBe(10000);

    const { data: product } = await admin
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .single();
    expect(product!.current_stock).toBe(48);

    const { data: movements } = await admin
      .from("stock_movements")
      .select("*")
      .eq("reference", `sale:${saleId}`);
    expect(movements!.length).toBe(1);
    expect(movements![0].type).toBe("out");
    expect(movements![0].quantity).toBe(2);
  });

  it("rejects insufficient stock", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 1,
    });

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "sales.create",
    ]);

    const { data } = await user.client.rpc("process_shop_sale", {
      p_org_id: orgId,
      p_branch_id: branchId,
      p_user_id: user.userId,
      p_contact_id: null,
      p_total_amount: 20000,
      p_paid_amount: 20000,
      p_payment_method: "cash",
      p_salesperson_id: null,
      p_items: [
        {
          product_id: productId,
          quantity: 5,
          unit_price: 4000,
          total_price: 20000,
          commission_amount: 0,
          variant_id: null,
        },
      ],
      p_movements: [
        {
          product_id: productId,
          quantity: 5,
          unit_cost: 2000,
          variant_id: null,
        },
      ],
      p_currency_code: "MNT",
      p_currency_symbol: "₮",
      p_exchange_rate: 1.0,
    });
    const result = data as SalesRpcResult;
    expect(result.error).toBeDefined();
    expect(result.error).toContain("хүрэлцэхгүй");
  });

  it("rejects unauthorized user without sales.create permission", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 50,
    });

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "products.read",
    ]);

    const { data } = await user.client.rpc("process_shop_sale", {
      p_org_id: orgId,
      p_branch_id: branchId,
      p_user_id: user.userId,
      p_contact_id: null,
      p_total_amount: 5000,
      p_paid_amount: 5000,
      p_payment_method: "cash",
      p_salesperson_id: null,
      p_items: [
        {
          product_id: productId,
          quantity: 1,
          unit_price: 5000,
          total_price: 5000,
          commission_amount: 0,
          variant_id: null,
        },
      ],
      p_movements: [
        {
          product_id: productId,
          quantity: 1,
          unit_cost: 3000,
          variant_id: null,
        },
      ],
      p_currency_code: "MNT",
      p_currency_symbol: "₮",
      p_exchange_rate: 1.0,
    });
    const result = data as SalesRpcResult;
    expect(result.error).toBeDefined();
    expect(result.error).toBe("Permission denied");
  });
});

// ── RLS ──────────────────────────────────────────────────────

describe("Sales RLS", () => {
  it("anon cannot create sales", async () => {
    const admin2 = createAdminClient();
    const anon = createAnonClient();
    const { orgId } = await createTestOrg(admin2);
    const { error } = await anon.from("sales").insert({
      organization_id: orgId,
      branch_id: "00000000-0000-0000-0000-000000000000",
      total_amount: 1000,
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot create returns", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("returns").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      return_number: "INVALID",
      type: "sales_return",
      branch_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });
});
