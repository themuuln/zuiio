/**
 * Integration tests for Invoicing / AR domain.
 *
 * Covers: invoices, invoice_items, generate_invoice_number RPC,
 * get_public_invoice RPC.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestBranch,
  createTestContact,
  createTestOrg,
  createTestProduct,
  trackCleanup,
} from "./helpers";

// ── Invoice CRUD ─────────────────────────────────────────────

describe("Invoice CRUD", () => {
  const admin = createAdminClient();

  it("admin can create an invoice with items", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { contactId } = await createTestContact(admin, orgId, "customer");
    const { productId } = await createTestProduct(admin, orgId);

    const { data: invNumber } = await admin.rpc("generate_invoice_number", {
      p_org_id: orgId,
    });
    expect(invNumber).toBeTruthy();

    const { data: invoice } = await admin
      .from("invoices")
      .insert({
        organization_id: orgId,
        invoice_number: invNumber as string,
        contact_id: contactId!,
        sale_id: null,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: null,
        total_amount: 50000,
        paid_amount: 25000,
        status: "pending",
        notes: "Test invoice",
        branch_id: branchId!,
      })
      .select()
      .single();

    expect(invoice!.invoice_number).toBe(invNumber);
    expect(invoice!.total_amount).toBe(50000);
    expect(invoice!.status).toBe("pending");
    trackCleanup("invoices", invoice!.id);

    const { data: item } = await admin
      .from("invoice_items")
      .insert({
        invoice_id: invoice!.id,
        product_id: productId,
        description: "Widget",
        quantity: 10,
        unit_price: 5000,
        total_price: 50000,
      })
      .select()
      .single();
    expect(item!.quantity).toBe(10);
    expect(item!.total_price).toBe(50000);
  });

  it("can update invoice payment status", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { data: invNum } = await admin.rpc("generate_invoice_number", {
      p_org_id: orgId,
    });

    const { data: invoice } = await admin
      .from("invoices")
      .insert({
        organization_id: orgId,
        invoice_number: invNum as string,
        total_amount: 30000,
        paid_amount: 30000,
        status: "pending",
        branch_id: branchId!,
      })
      .select()
      .single();
    trackCleanup("invoices", invoice!.id);

    await admin
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", invoice!.id);
    const { data: check } = await admin
      .from("invoices")
      .select("status")
      .eq("id", invoice!.id)
      .single();
    expect(check!.status).toBe("paid");

    await admin
      .from("invoices")
      .update({ status: "cancelled" })
      .eq("id", invoice!.id);
    const { data: check2 } = await admin
      .from("invoices")
      .select("status")
      .eq("id", invoice!.id)
      .single();
    expect(check2!.status).toBe("cancelled");
  });

  it("can create invoice with branch_id", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { data: invNum } = await admin.rpc("generate_invoice_number", {
      p_org_id: orgId,
    });

    const { data: invoice } = await admin
      .from("invoices")
      .insert({
        organization_id: orgId,
        invoice_number: invNum as string,
        branch_id: branchId!,
        total_amount: 10000,
        status: "pending",
      })
      .select()
      .single();
    expect(invoice!.branch_id).toBe(branchId);
    trackCleanup("invoices", invoice!.id);
  });
});

// ── Invoice RPCs ─────────────────────────────────────────────

describe("Invoice RPC functions", () => {
  const admin = createAdminClient();

  it("generate_invoice_number returns formatted number", async () => {
    const { orgId } = await createTestOrg(admin);
    const { data: number } = await admin.rpc("generate_invoice_number", {
      p_org_id: orgId,
    });
    expect(number).toBeTruthy();
    expect(number as string).toMatch(/^INV-/);
  });

  it("get_public_invoice returns null for invalid token", async () => {
    const { data, error } = await admin.rpc("get_public_invoice", {
      p_token: "nonexistent-token",
    });
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("get_public_receipt returns null for invalid token", async () => {
    const { data, error } = await admin.rpc("get_public_receipt", {
      p_token: "nonexistent-token",
    });
    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});
describe("Invoice RLS", () => {
  it("anon cannot create invoices", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("invoices").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      invoice_number: "INVALID",
      total_amount: 1000,
      branch_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot create invoice items", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("invoice_items").insert({
      invoice_id: "00000000-0000-0000-0000-000000000000",
      product_id: "00000000-0000-0000-0000-000000000000",
      quantity: 1,
      unit_price: 100,
      total_price: 100,
    });
    expect(error).not.toBeNull();
  });
});
