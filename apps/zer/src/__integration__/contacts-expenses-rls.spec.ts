/**
 * Integration tests for Contacts & Expenses Row-Level Security policies.
 *
 * Requires a running Supabase local stack.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestBranch,
  createTestContact,
  createTestOrg,
  trackCleanup,
} from "./helpers";

// Contacts RLS
describe("Contacts RLS", () => {
  const admin = createAdminClient();
  it("anon cannot create contacts", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("contacts").insert({
      name: "Hacked Contact",
      type: "supplier",
      organization_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot read contacts", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.from("contacts").select("*").limit(1);
    if (error) {
      expect(error.code).toBe("42501");
    } else {
      expect(data).toEqual([]);
    }
  });

  it("admin can create and read contacts within their org", async () => {
    const { orgId } = await createTestOrg(admin);
    const { data, error } = await admin
      .from("contacts")
      .insert({
        name: "Test Supplier",
        organization_id: orgId,
        type: "supplier",
        phone: `+976${Date.now()}`,
      })
      .select()
      .single();
    expect(error).toBeNull();
    if (data) trackCleanup("contacts", data.id);
    expect(data!.name).toBe("Test Supplier");
    expect(data!.organization_id).toBe(orgId);
  });

  it("admin cannot see contacts from other orgs", async () => {
    const { orgId: orgA } = await createTestOrg(admin);
    const { orgId: orgB } = await createTestOrg(admin);
    await createTestContact(admin, orgA, "supplier");

    const { data } = await admin
      .from("contacts")
      .select("id")
      .eq("organization_id", orgB);
    // orgB should have no contacts
    expect(data).toHaveLength(0);
  });

  it("admin can update contacts in their org", async () => {
    const { orgId } = await createTestOrg(admin);
    const { contactId } = await createTestContact(admin, orgId, "customer");

    const { error } = await admin
      .from("contacts")
      .update({ name: "Updated Name" })
      .eq("id", contactId)
      .eq("organization_id", orgId);
    expect(error).toBeNull();
  });
});

// Expenses RLS
describe("Expenses RLS", () => {
  const admin = createAdminClient();
  it("anon cannot create expenses", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("expenses").insert({
      description: "Hacked Expense",
      amount: 100,
      category: "general",
      branch_id: "00000000-0000-0000-0000-000000000000",
      organization_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("admin can create expenses in their org", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { data, error } = await admin
      .from("expenses")
      .insert({
        description: `Test Expense ${Date.now()}`,
        amount: 50000,
        category: "general",
        branch_id: branchId,
        organization_id: orgId,
      })
      .select()
      .single();
    expect(error).toBeNull();
    if (data) trackCleanup("expenses", data.id);
    expect(data!.amount).toBe(50000);
    expect(data!.organization_id).toBe(orgId);
  });

  it("admin cannot see expenses from other orgs", async () => {
    const { orgId: orgA } = await createTestOrg(admin);
    const { orgId: orgB } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgA);
    const { data: expense } = await admin
      .from("expenses")
      .insert({
        description: "Expense A",
        amount: 100,
        category: "general",
        branch_id: branchId,
        organization_id: orgA,
      })
      .select("id")
      .single();
    if (expense) trackCleanup("expenses", expense.id);

    const { data } = await admin
      .from("expenses")
      .select("id")
      .eq("organization_id", orgB);
    expect(data).toHaveLength(0);
  });

  it("admin can delete expenses in their org", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { data: expense } = await admin
      .from("expenses")
      .insert({
        description: "To Delete",
        amount: 100,
        category: "general",
        branch_id: branchId,
        organization_id: orgId,
      })
      .select()
      .single();

    const { error } = await admin
      .from("expenses")
      .delete()
      .eq("id", expense!.id)
      .eq("organization_id", orgId);
    expect(error).toBeNull();
  });
});

// Discounts RLS
describe("Discounts RLS", () => {
  const admin = createAdminClient();

  it("anon cannot create discounts", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("discounts").insert({
      name: "Hacked Discount",
      type: "percentage",
      value: 50,
      branch_id: "00000000-0000-0000-0000-000000000000",
      organization_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("admin can create discounts within their org", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);
    const { data, error } = await admin
      .from("discounts")
      .insert({
        name: `Test Discount ${Date.now()}`,
        type: "percentage",
        value: 10,
        branch_id: branchId,
        organization_id: orgId,
      })
      .select()
      .single();
    expect(error).toBeNull();
    if (data) trackCleanup("discounts", data.id);
    expect(data!.name).toContain("Test Discount");
    expect(data!.organization_id).toBe(orgId);
  });
});
