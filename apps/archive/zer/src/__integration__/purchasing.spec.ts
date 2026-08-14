/**
 * Integration tests for Purchasing domain.
 *
 * Covers: purchase_orders, purchase_order_items, supplier contacts,
 * generate_purchase_order_number, process_receive_purchase_items RPCs.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestBranch,
  createTestContact,
  createTestOrg,
  createTestProduct,
  createTestUserWithPermissions,
  trackCleanup,
} from "./helpers";

interface PurchasingRpcResult {
  success?: boolean;
  error?: string;
  movements_created?: number;
  new_status?: string;
}

// ── Purchase Orders CRUD ─────────────────────────────────────

describe("Purchase Orders CRUD", () => {
  const admin = createAdminClient();

  it("admin can create purchase order with items", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { contactId } = await createTestContact(admin, orgId, "supplier");
    const { productId } = await createTestProduct(admin, orgId);

    const { data: poNumber } = await admin.rpc(
      "generate_purchase_order_number",
      {
        p_org_id: orgId,
      },
    );
    expect(poNumber).toBeTruthy();

    const { data: po } = await admin
      .from("purchase_orders")
      .insert({
        organization_id: orgId,
        supplier_id: contactId!,
        branch_id: branchId!,
        order_number: poNumber as string,
        status: "draft",
        total_amount: 30000,
        notes: "Test purchase order",
      })
      .select()
      .single();
    expect(po?.order_number).toBe(poNumber);
    expect(po?.status).toBe("draft");
    trackCleanup("purchase_orders", po?.id);

    const { data: item } = await admin
      .from("purchase_order_items")
      .insert({
        purchase_order_id: po?.id,
        product_id: productId,
        quantity: 10,
        unit_cost: 3000,
      })
      .select()
      .single();
    expect(item?.total_cost).toBe(30000);
    expect(item?.received_quantity).toBe(0);
  });

  it("can advance PO through statuses", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { contactId } = await createTestContact(admin, orgId, "supplier");

    const { data: poNumber } = await admin.rpc(
      "generate_purchase_order_number",
      { p_org_id: orgId },
    );
    const { data: po } = await admin
      .from("purchase_orders")
      .insert({
        organization_id: orgId,
        supplier_id: contactId!,
        branch_id: branchId!,
        order_number: poNumber as string,
        status: "draft",
      })
      .select()
      .single();
    trackCleanup("purchase_orders", po?.id);

    for (const status of ["sent", "cancelled"] as const) {
      await admin.from("purchase_orders").update({ status }).eq("id", po?.id);
      const { data: check } = await admin
        .from("purchase_orders")
        .select("status")
        .eq("id", po?.id)
        .single();
      expect(check?.status).toBe(status);
    }
  });
});

// ── process_receive_purchase_items RPC ───────────────────────

describe("process_receive_purchase_items RPC", () => {
  const admin = createAdminClient();

  it("receives items and updates stock atomically", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 0,
    });
    const { contactId } = await createTestContact(admin, orgId, "supplier");

    const { data: poNum } = await admin.rpc("generate_purchase_order_number", {
      p_org_id: orgId,
    });
    const { data: po } = await admin
      .from("purchase_orders")
      .insert({
        organization_id: orgId,
        supplier_id: contactId!,
        branch_id: branchId!,
        order_number: poNum as string,
        status: "sent",
      })
      .select()
      .single();
    trackCleanup("purchase_orders", po?.id);

    const { data: poItem } = await admin
      .from("purchase_order_items")
      .insert({
        purchase_order_id: po?.id,
        product_id: productId,
        quantity: 10,
        unit_cost: 3000,
      })
      .select()
      .single();

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "purchases.update",
    ]);

    const { data, error } = await user.client.rpc(
      "process_receive_purchase_items",
      {
        p_org_id: orgId,
        p_branch_id: branchId,
        p_user_id: user.userId,
        p_order_id: po?.id,
        p_items: [{ item_id: poItem?.id, received_quantity: 10 }],
      },
    );
    expect(error).toBeNull();
    const result = data as PurchasingRpcResult;
    expect(result.success).toBe(true);
    expect(result.movements_created).toBe(1);
    expect(result.new_status).toBe("received");

    const { data: product } = await admin
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .single();
    expect(product?.current_stock).toBe(10);

    const { data: poCheck } = await admin
      .from("purchase_orders")
      .select("status")
      .eq("id", po?.id)
      .single();
    expect(poCheck?.status).toBe("received");
  });

  it("handles partial receive correctly", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 0,
    });
    const { contactId } = await createTestContact(admin, orgId, "supplier");

    const { data: poNum } = await admin.rpc("generate_purchase_order_number", {
      p_org_id: orgId,
    });
    const { data: po } = await admin
      .from("purchase_orders")
      .insert({
        organization_id: orgId,
        supplier_id: contactId!,
        branch_id: branchId!,
        order_number: poNum as string,
        status: "sent",
      })
      .select()
      .single();
    trackCleanup("purchase_orders", po?.id);

    const { data: poItem } = await admin
      .from("purchase_order_items")
      .insert({
        purchase_order_id: po?.id,
        product_id: productId,
        quantity: 10,
        unit_cost: 3000,
      })
      .select()
      .single();

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "purchases.update",
    ]);

    const { data } = await user.client.rpc("process_receive_purchase_items", {
      p_org_id: orgId,
      p_branch_id: branchId,
      p_user_id: user.userId,
      p_order_id: po?.id,
      p_items: [{ item_id: poItem?.id, received_quantity: 5 }],
    });
    const result = data as PurchasingRpcResult;
    expect(result.success).toBe(true);
    expect(result.new_status).toBe("partially_received");
    expect(result.movements_created).toBe(1);

    const { data: itemCheck } = await admin
      .from("purchase_order_items")
      .select("received_quantity")
      .eq("id", poItem?.id)
      .single();
    expect(itemCheck?.received_quantity).toBe(5);

    const { data: product } = await admin
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .single();
    expect(product?.current_stock).toBe(5);
  });

  it("rejects receiving more than ordered quantity", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { productId } = await createTestProduct(admin, orgId, {
      currentStock: 0,
    });
    const { contactId } = await createTestContact(admin, orgId, "supplier");

    const { data: poNum } = await admin.rpc("generate_purchase_order_number", {
      p_org_id: orgId,
    });
    const { data: po } = await admin
      .from("purchase_orders")
      .insert({
        organization_id: orgId,
        supplier_id: contactId!,
        branch_id: branchId!,
        order_number: poNum as string,
        status: "sent",
      })
      .select()
      .single();
    trackCleanup("purchase_orders", po?.id);

    const { data: poItem } = await admin
      .from("purchase_order_items")
      .insert({
        purchase_order_id: po?.id,
        product_id: productId,
        quantity: 5,
        unit_cost: 3000,
      })
      .select()
      .single();

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "purchases.update",
    ]);

    const { data } = await user.client.rpc("process_receive_purchase_items", {
      p_org_id: orgId,
      p_branch_id: branchId,
      p_user_id: user.userId,
      p_order_id: po?.id,
      p_items: [{ item_id: poItem?.id, received_quantity: 10 }],
    });
    const result = data as PurchasingRpcResult;
    expect(result.error).toBeDefined();
    expect(result.error).toContain("хэтэрсэн");
  });
});

// ── Supplier contacts ────────────────────────────────────────

describe("Supplier contacts", () => {
  const admin = createAdminClient();

  it("can create and query supplier contacts", async () => {
    const { orgId } = await createTestOrg(admin);
    const { contact } = await createTestContact(admin, orgId, "supplier");
    expect(contact.type).toBe("supplier");

    const { data } = await admin
      .from("contacts")
      .select("*")
      .eq("type", "supplier")
      .eq("organization_id", orgId);
    expect(data?.length).toBeGreaterThanOrEqual(1);
  });

  it("can create customer contacts too", async () => {
    const { orgId } = await createTestOrg(admin);
    const { contact } = await createTestContact(admin, orgId, "customer");
    expect(contact.type).toBe("customer");
  });
});

// ── RLS ──────────────────────────────────────────────────────

describe("Purchasing RLS", () => {
  it("anon cannot create purchase orders", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("purchase_orders").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      order_number: "INVALID",
      status: "draft",
      branch_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot create purchase order items", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("purchase_order_items").insert({
      purchase_order_id: "00000000-0000-0000-0000-000000000000",
      product_id: "00000000-0000-0000-0000-000000000000",
      quantity: 1,
      unit_cost: 100,
    });
    expect(error).not.toBeNull();
  });
});
