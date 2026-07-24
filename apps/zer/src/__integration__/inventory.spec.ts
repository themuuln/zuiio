/**
 * Integration tests for Inventory domain.
 *
 * Covers: stock_movements (in/out/adjustment), warehouses, warehouse_products,
 * process_restock_stock_movements, process_batch_adjustment,
 * process_sale_stock_decrement, decrement_product_stock_safe RPCs.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestBranch,
  createTestWarehouse,
  createTestProduct,
  createTestUserWithPermissions,
  trackCleanup,
} from "./helpers";

// ── Warehouse CRUD ───────────────────────────────────────────

describe("Warehouse CRUD", () => {
  const admin = createAdminClient();

  it("admin can create and read warehouses", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { warehouse, warehouseId } = await createTestWarehouse(admin, orgId, branchId);
    expect(warehouseId).toBeDefined();
    expect(warehouse.name).toMatch(/^Warehouse-/);
  });

  it("warehouse_products tracks product stock per warehouse", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { warehouseId } = await createTestWarehouse(admin, orgId, branchId);
    const { productId } = await createTestProduct(admin, orgId, { currentStock: 100 });

    const { data, error } = await admin
      .from("warehouse_products")
      .insert({
        warehouse_id: warehouseId,
        product_id: productId,
        current_stock: 50,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.current_stock).toBe(50);

    const { data: readback } = await admin
      .from("warehouse_products")
      .select("*")
      .eq("warehouse_id", warehouseId)
      .eq("product_id", productId)
      .single();
    expect(readback).not.toBeNull();
    expect(readback!.current_stock).toBe(50);
  });
});

// ── Stock Movements CRUD ─────────────────────────────────────

describe("Stock Movements CRUD", () => {
  const admin = createAdminClient();

  it("admin can create inbound (type=in) movement", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, { currentStock: 10 });

    const { data, error } = await admin
      .from("stock_movements")
      .insert({
        organization_id: orgId,
        branch_id: branchId,
        product_id: productId,
        type: "in",
        quantity: 20,
        unit_cost: 3000,
        notes: "Restock",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.type).toBe("in");
    expect(data!.quantity).toBe(20);
  });

  it("admin can create adjustment movement", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, { currentStock: 10 });

    const { data, error } = await admin
      .from("stock_movements")
      .insert({
        organization_id: orgId,
        branch_id: branchId,
        product_id: productId,
        type: "adjustment",
        quantity: -5,
        notes: "Damaged stock write-off",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.type).toBe("adjustment");
  });
});

// ── process_restock_stock_movements RPC ──────────────────────

describe("process_restock_stock_movements RPC", () => {
  const admin = createAdminClient();

  it("creates inbound movements and updates stock", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, { currentStock: 0 });

    const { data: supplier } = await admin
      .from("contacts")
      .insert({ organization_id: orgId, name: "Supplier", type: "supplier" })
      .select()
      .single();
    trackCleanup("contacts", supplier!.id);

    const { data: poNum } = await admin.rpc("generate_purchase_order_number", { p_org_id: orgId });
    const { data: po } = await admin
      .from("purchase_orders")
      .insert({
        organization_id: orgId,
        supplier_id: supplier!.id,
        order_number: poNum as string,
        status: "draft",
        total_amount: 0,
        branch_id: branchId,
      } as any)
      .select()
      .single();
    trackCleanup("purchase_orders", po!.id);

    await admin
      .from("purchase_order_items")
      .insert({
        purchase_order_id: po!.id,
        product_id: productId,
        quantity: 10,
        unit_cost: 3000,
      });

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "purchases.create",
    ]);

    const { data, error } = await user.client.rpc("process_restock_stock_movements", {
      p_org_id: orgId,
      p_branch_id: branchId,
      p_user_id: user.userId,
      p_po_id: po!.id,
      p_items: [{ product_id: productId, quantity: 10, unit_cost: 3000, variant_id: null }],
      p_mark_received: true,
    });

    expect(error).toBeNull();
    const result = data as any;
    expect(result.success).toBe(true);
    expect(result.movements_created).toBeGreaterThanOrEqual(1);

    const { data: product } = await admin.from("products").select("current_stock").eq("id", productId).single();
    expect(product!.current_stock).toBe(10);

    const { data: poCheck } = await admin.from("purchase_orders").select("status").eq("id", po!.id).single();
    expect(poCheck!.status).toBe("received");
  });
});

// ── process_batch_adjustment RPC ─────────────────────────────

describe("process_batch_adjustment RPC", () => {
  const admin = createAdminClient();

  it("creates adjustment movements and updates stock", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, { currentStock: 100 });

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "stock_movements.create",
    ]);

    const { data, error } = await user.client.rpc("process_batch_adjustment", {
      p_org_id: orgId,
      p_branch_id: branchId,
      p_user_id: user.userId,
      p_items: [{ product_id: productId, quantity: -10, variant_id: null, unit_cost: null }],
      p_reference: `adj-test-${Date.now()}`,
      p_notes: "Batch adjustment test",
    });

    expect(error).toBeNull();
    const result = data as any;
    expect(result.success).toBe(true);
    expect(result.movements_created).toBe(1);

    const { data: product } = await admin.from("products").select("current_stock").eq("id", productId).single();
    expect(product!.current_stock).toBe(90);
  });

  it("zero-quantity items are skipped", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, { currentStock: 50 });

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "stock_movements.create",
    ]);

    const { data } = await user.client.rpc("process_batch_adjustment", {
      p_org_id: orgId,
      p_branch_id: branchId,
      p_user_id: user.userId,
      p_items: [{ product_id: productId, quantity: 0, variant_id: null, unit_cost: null }],
      p_reference: "adj-zero-test",
      p_notes: "Should not create movement",
    });

    const result = data as any;
    expect(result.success).toBe(true);
    expect(result.movements_created).toBe(0);
  });
});

// ── process_sale_stock_decrement RPC ─────────────────────────

describe("process_sale_stock_decrement RPC", () => {
  const admin = createAdminClient();

  it("decrements stock with FOR UPDATE locking", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId, { currentStock: 20 });

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "sales.create",
    ]);

    const { data, error } = await user.client.rpc("process_sale_stock_decrement", {
      p_org_id: orgId,
      p_items: [{ product_id: productId, quantity: 5, variant_id: null }],
    });

    expect(error).toBeNull();
    const result = data as any;
    expect(result.success).toBe(true);

    const { data: product } = await admin.from("products").select("current_stock").eq("id", productId).single();
    expect(product!.current_stock).toBe(15);
  });

  it("rejects batch with insufficient stock", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId, { currentStock: 2 });

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "sales.create",
    ]);

    const { data } = await user.client.rpc("process_sale_stock_decrement", {
      p_org_id: orgId,
      p_items: [{ product_id: productId, quantity: 10, variant_id: null }],
    });

    const result = data as any;
    expect(result.error).toBeDefined();
  });
});

// ── decrement_product_stock_safe RPC ─────────────────────────

describe("decrement_product_stock_safe RPC", () => {
  it("safely decrements a single product", async () => {
    const admin = createAdminClient();
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId, { currentStock: 30 });

    const { data, error } = await admin.rpc("decrement_product_stock_safe", {
      p_product_id: productId,
      p_org_id: orgId,
      p_quantity: 3,
    });

    expect(error).toBeNull();
    const result = data as any;
    expect(result.success).toBe(true);
    expect(result.current_stock).toBe(27);
  });
});

// ── RLS ──────────────────────────────────────────────────────

describe("Inventory RLS", () => {
  it("anon cannot create stock movements", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("stock_movements").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      branch_id: "00000000-0000-0000-0000-000000000000",
      product_id: "00000000-0000-0000-0000-000000000000",
      type: "in",
      quantity: 1,
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot create warehouses", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("warehouses").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      branch_id: "00000000-0000-0000-0000-000000000000",
      name: "Hacked Warehouse",
    });
    expect(error).not.toBeNull();
  });
});
