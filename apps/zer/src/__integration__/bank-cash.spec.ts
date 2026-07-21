/**
 * Integration tests for Bank & Cash domain.
 *
 * Covers: bank_accounts, cash_registers, cash_sessions,
 * seed_default_bank_accounts RPC, RLS enforcement.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestBranch,
  trackCleanup,
} from "./helpers";

// ── Bank Accounts CRUD ──────────────────────────

describe("Bank Accounts CRUD", () => {
  const admin = createAdminClient();

  it("admin can create a bank account with all fields", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: ba, error } = await admin
      .from("bank_accounts")
      .insert({
        organization_id: orgId,
        name: "Хаан банк",
        bank_name: "Хаан банк",
        account_number: "5000123456",
        account_type: "bank",
        is_default: false,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(ba!.name).toBe("Хаан банк");
    expect(ba!.account_type).toBe("bank");
    expect(ba!.is_default).toBe(false);
    trackCleanup("bank_accounts", ba!.id);
  });

  it("admin can create a cash account type", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: ba, error } = await admin
      .from("bank_accounts")
      .insert({
        organization_id: orgId,
        name: "Бэлэн мөнгө",
        account_type: "cash",
        is_default: true,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(ba!.account_type).toBe("cash");
    expect(ba!.is_default).toBe(true);
    trackCleanup("bank_accounts", ba!.id);
  });

  it("admin can create a mobile account type", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: ba } = await admin
      .from("bank_accounts")
      .insert({
        organization_id: orgId,
        name: "Сошиал банк",
        account_type: "mobile",
      })
      .select()
      .single();
    expect(ba!.account_type).toBe("mobile");
    trackCleanup("bank_accounts", ba!.id);
  });

  it("admin can update a bank account", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: ba } = await admin
      .from("bank_accounts")
      .insert({
        organization_id: orgId,
        name: "Old Name",
        account_type: "bank",
      })
      .select()
      .single();
    trackCleanup("bank_accounts", ba!.id);

    const { error } = await admin
      .from("bank_accounts")
      .update({ name: "Updated Name", is_default: true })
      .eq("id", ba!.id);
    expect(error).toBeNull();
  });

  it("admin can delete a bank account", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: ba } = await admin
      .from("bank_accounts")
      .insert({
        organization_id: orgId,
        name: "To Delete",
        account_type: "bank",
      })
      .select()
      .single();

    const { error } = await admin.from("bank_accounts").delete().eq("id", ba!.id);
    expect(error).toBeNull();
  });
});

// ── seed_default_bank_accounts RPC ──────────────

describe("seed_default_bank_accounts RPC", () => {
  const admin = createAdminClient();

  it("creates 3 default accounts", async () => {
    const { orgId } = await createTestOrg(admin);

    const { error } = await admin.rpc("seed_default_bank_accounts", {
      p_organization_id: orgId,
    });
    expect(error).toBeNull();

    const { data: accounts, error: queryErr } = await admin
      .from("bank_accounts")
      .select("name, account_type, is_default")
      .eq("organization_id", orgId);
    expect(queryErr).toBeNull();
    expect(accounts!.length).toBe(3);

    const names = accounts!.map((a: any) => a.name);
    expect(names).toContain("Бэлэн мөнгө");
    expect(names).toContain("Хаан банк");
    expect(names).toContain("Хас банк");
  });

  it("is idempotent when called twice", async () => {
    const { orgId } = await createTestOrg(admin);

    await admin.rpc("seed_default_bank_accounts", { p_organization_id: orgId });
    await admin.rpc("seed_default_bank_accounts", { p_organization_id: orgId });

    const { data: accounts } = await admin
      .from("bank_accounts")
      .select("id")
      .eq("organization_id", orgId);
    expect(accounts!.length).toBe(3);
  });
});

// ── Cash Registers CRUD ─────────────────────────

describe("Cash Registers CRUD", () => {
  const admin = createAdminClient();

  it("admin can create a cash register", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);

    const { data: reg, error } = await admin
      .from("cash_registers")
      .insert({
        organization_id: orgId,
        name: "Main Register",
        branch_id: branchId,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(reg!.name).toBe("Main Register");
    trackCleanup("cash_registers", reg!.id);
  });

  it("admin can update a cash register", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);

    const { data: reg } = await admin
      .from("cash_registers")
      .insert({
        organization_id: orgId,
        name: "Old Register",
        branch_id: branchId,
      })
      .select()
      .single();
    trackCleanup("cash_registers", reg!.id);

    const { error } = await admin
      .from("cash_registers")
      .update({ name: "Renamed Register", is_active: false })
      .eq("id", reg!.id);
    expect(error).toBeNull();
  });

  it("admin can delete a cash register", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);

    const { data: reg } = await admin
      .from("cash_registers")
      .insert({
        organization_id: orgId,
        name: "Temp Register",
        branch_id: branchId,
      })
      .select()
      .single();

    const { error } = await admin
      .from("cash_registers")
      .delete()
      .eq("id", reg!.id);
    expect(error).toBeNull();
  });
});

// ── Cash Sessions Flow ──────────────────────────

describe("Cash Sessions", () => {
  const admin = createAdminClient();

  it("admin can open a cash session", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);

    const { data: reg } = await admin
      .from("cash_registers")
      .insert({
        organization_id: orgId,
        name: "Session Register",
        branch_id: branchId,
      })
      .select()
      .single();
    trackCleanup("cash_registers", reg!.id);

    const { data: session, error } = await admin
      .from("cash_sessions")
      .insert({
        organization_id: orgId,
        register_id: reg!.id,
        branch_id: branchId,
        opening_balance: 100000,
        status: "open",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(session!.status).toBe("open");
    expect(Number(session!.opening_balance)).toBe(100000);
    trackCleanup("cash_sessions", session!.id);
  });

  it("admin can close a cash session", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);

    const { data: reg } = await admin
      .from("cash_registers")
      .insert({
        organization_id: orgId,
        name: "Close Register",
        branch_id: branchId,
      })
      .select()
      .single();
    trackCleanup("cash_registers", reg!.id);

    const { data: session } = await admin
      .from("cash_sessions")
      .insert({
        organization_id: orgId,
        register_id: reg!.id,
        branch_id: branchId,
        opening_balance: 50000,
        status: "open",
      })
      .select()
      .single();
    trackCleanup("cash_sessions", session!.id);

    const { error } = await admin
      .from("cash_sessions")
      .update({
        status: "closed",
        closing_balance: 75000,
        expected_amount: 75000,
        actual_amount: 74800,
        difference: -200,
        notes: "End of day",
      })
      .eq("id", session!.id);
    expect(error).toBeNull();

    const { data: closed } = await admin
      .from("cash_sessions")
      .select("status, difference")
      .eq("id", session!.id)
      .single();
    expect(closed!.status).toBe("closed");
    expect(Number(closed!.difference)).toBe(-200);
  });

  it("admin can read sessions for a register", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);

    const { data: reg } = await admin
      .from("cash_registers")
      .insert({
        organization_id: orgId,
        name: "Query Register",
        branch_id: branchId,
      })
      .select()
      .single();
    trackCleanup("cash_registers", reg!.id);

    await admin.from("cash_sessions").insert([
      {
        organization_id: orgId,
        register_id: reg!.id,
        branch_id: branchId,
        opening_balance: 0,
        status: "closed",
      },
      {
        organization_id: orgId,
        register_id: reg!.id,
        branch_id: branchId,
        opening_balance: 1000,
        status: "open",
      },
    ]);

    const { data: sessions, error } = await admin
      .from("cash_sessions")
      .select("id, status")
      .eq("register_id", reg!.id);
    expect(error).toBeNull();
    expect(sessions!.length).toBe(2);
  });
});

// ── RLS ──────────────────────────────────────────

describe("Row Level Security", () => {
  it("anon cannot create bank accounts", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("bank_accounts").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      name: "Hacker Account",
      account_type: "bank",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot create cash registers", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("cash_registers").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      name: "Hacker Register",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot read cash sessions", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon
      .from("cash_sessions")
      .select("*")
      .limit(1);
    if (error) {
      expect(error.code).toBe("42501");
    } else {
      expect(data).toEqual([]);
    }
  });
});
