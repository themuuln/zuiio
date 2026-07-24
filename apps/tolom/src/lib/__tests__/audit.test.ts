import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn((cb) => cb()) }));

// The global setup mocks @/lib/audit — unmock so we test the real implementation
vi.unmock("@/lib/audit");

import { after } from "next/server";
import { createAuditLog, logAuditAfter } from "@/lib/audit";

const mockAfter = vi.mocked(after);

let db: MockSupabaseClient;

beforeEach(() => {
  vi.resetAllMocks();
  // Re-apply the mock implementation so after() immediately invokes its callback
  mockAfter.mockImplementation((cb: (...args: Array<unknown>) => unknown) =>
    cb(),
  );
  db = createMockSupabaseClient();
});

describe("createAuditLog", () => {
  const params = {
    supabase: undefined as unknown as MockSupabaseClient,
    action: "create",
    table_name: "vehicles",
    record_id: "veh-1",
    user_id: "user-1",
    organization_id: "org-1",
  };

  it("inserts an audit log entry and returns the created id", async () => {
    db.__qb.resolveOnce({ data: { id: "audit-1" }, error: null });
    const result = await createAuditLog({ ...params, supabase: db });

    expect(result).toEqual({ success: true, id: "audit-1", error: null });
    expect(db.from).toHaveBeenCalledWith("audit_logs");
  });

  it("returns error message when the db insert fails", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("DB constraint violation"),
    });
    const result = await createAuditLog({ ...params, supabase: db });

    expect(result).toEqual({
      success: false,
      id: null,
      error: "DB constraint violation",
    });
  });

  it("resolves user_id from auth.getUser when not provided", async () => {
    db.__qb.resolveOnce({ data: { id: "audit-2" }, error: null });
    const result = await createAuditLog({
      ...params,
      supabase: db,
      user_id: undefined,
    });

    expect(result).toEqual({ success: true, id: "audit-2", error: null });
    expect(db.auth.getUser).toHaveBeenCalled();
  });

  it("returns error when auth.getUser returns no authenticated user", async () => {
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await createAuditLog({
      ...params,
      supabase: db,
      user_id: undefined,
    });

    expect(result).toEqual({
      success: false,
      id: null,
      error:
        "Unable to determine user_id: no authenticated user and no user_id param provided",
    });
  });

  it("resolves organization_id via RPC when not provided", async () => {
    db.rpc.mockResolvedValue({ data: "org-from-rpc", error: null });
    db.__qb.resolveOnce({ data: { id: "audit-3" }, error: null });
    const result = await createAuditLog({
      ...params,
      supabase: db,
      organization_id: undefined,
    });

    expect(result).toEqual({ success: true, id: "audit-3", error: null });
    expect(db.rpc).toHaveBeenCalledWith("get_user_organization_id");
  });

  it("returns error when RPC yields no organization data", async () => {
    // Default mock: rpc resolves with { data: null, error: null }
    const result = await createAuditLog({
      ...params,
      supabase: db,
      organization_id: undefined,
    });

    expect(result).toEqual({
      success: false,
      id: null,
      error:
        "Unable to determine organization_id: user has no organization membership",
    });
    expect(db.rpc).toHaveBeenCalledWith("get_user_organization_id");
  });

  it("includes branch_id in the inserted entry when provided", async () => {
    db.__qb.resolveOnce({ data: { id: "audit-4" }, error: null });
    await createAuditLog({ ...params, supabase: db, branch_id: "branch-42" });

    const insertCallArg = extractInsertArg(db);
    expect(insertCallArg).toMatchObject({ branch_id: "branch-42" });
  });

  it("passes old_data and new_data to the insert", async () => {
    db.__qb.resolveOnce({ data: { id: "audit-5" }, error: null });
    const oldData = { status: "open" };
    const newData = { status: "in_progress" };
    await createAuditLog({
      ...params,
      supabase: db,
      old_data: oldData,
      new_data: newData,
    });

    const insertCallArg = extractInsertArg(db);
    expect(insertCallArg).toMatchObject({
      old_data: oldData,
      new_data: newData,
    });
  });

  it("builds the entry with all core fields", async () => {
    db.__qb.resolveOnce({ data: { id: "audit-6" }, error: null });
    await createAuditLog({ ...params, supabase: db });

    const insertCallArg = extractInsertArg(db);
    expect(insertCallArg).toMatchObject({
      organization_id: "org-1",
      user_id: "user-1",
      action: "create",
      table_name: "vehicles",
      record_id: "veh-1",
    });
  });
});

describe("logAuditAfter", () => {
  it("delegates to createAuditLog via after()", () => {
    db.__qb.resolveOnce({ data: { id: "audit-after-1" }, error: null });
    logAuditAfter({
      supabase: db,
      action: "delete",
      table_name: "work_orders",
      record_id: "wo-1",
      user_id: "user-1",
      organization_id: "org-1",
    });

    expect(mockAfter).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledWith("audit_logs");
  });

  it("passes the full params object through to createAuditLog", () => {
    db.__qb.resolveOnce({ data: { id: "audit-after-2" }, error: null });
    logAuditAfter({
      supabase: db,
      action: "update",
      table_name: "estimates",
      record_id: "est-1",
      user_id: "user-1",
      organization_id: "org-1",
      old_data: { total: 100 },
      new_data: { total: 150 },
    });

    const insertCallArg = extractInsertArg(db);
    expect(insertCallArg).toMatchObject({
      action: "update",
      table_name: "estimates",
      record_id: "est-1",
    });
  });
});

// ── Helpers ──

/** Extract the first argument passed to the qb's insert mock. */
function extractInsertArg(db: MockSupabaseClient): unknown {
  const qb = vi.mocked(db.from).mock.results[0]?.value;
  if (!qb) throw new Error("db.from was never called");
  return vi.mocked(qb.insert).mock.calls[0]?.[0];
}
