import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

// ─── Capture mocks ──────────────────────────────────────────────────

const captureMock = mock.fn(() => {});
let capturedInsertData: Record<string, unknown> | null = null;

const withDbCaptureMock = mock.fn(
  async (_label: string, query: Promise<unknown>) => {
    return await query;
  },
);

mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

mockMod("next/navigation", {
  redirect: mock.fn(() => {}),
  notFound: mock.fn(() => {}),
});

mockMod("@/lib/supabase/server", {
  createClient: mock.fn(async () => ({})),
});

mockMod("server-only", {});

// ─── Mutable supabase for logAuditEvent (requireAppContext) ──────────

let erpInsertMock = mock.fn(async (data: Record<string, unknown>) => {
  capturedInsertData = data;
  return { data: null, error: null };
});

const erpSupabase = {
  from: mock.fn((_table: string) => ({
    insert: erpInsertMock,
  })),
};

mockMod("@/lib/erp", {
  requireAppContext: mock.fn(async () => ({
    supabase: erpSupabase,
    organizationId: "ctx-org-1",
    userId: "ctx-user-1",
  })),
});

// ─── Import module under test ────────────────────────────────────────

let logAuditEventWithClient: (
  supabase: Record<string, unknown>,
  organizationId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  fieldChanges?: Record<string, { old: unknown; new: unknown }>,
  summary?: string,
) => Promise<void>;

let logAuditEvent: (
  action: string,
  entityType: string,
  entityId: string,
  fieldChanges?: Record<string, { old: unknown; new: unknown }>,
  summary?: string,
) => Promise<void>;

test.before(async () => {
  const mod = await import("@/lib/audit");
  logAuditEventWithClient = mod.logAuditEventWithClient;
  logAuditEvent = mod.logAuditEvent;
});

// ─── Shared mock helpers ─────────────────────────────────────────────

function makeInsertMock() {
  capturedInsertData = null;
  return mock.fn(async (data: Record<string, unknown>) => {
    capturedInsertData = data;
    return { data: null, error: null };
  });
}

function makeMockSupabase(insertMock: ReturnType<typeof makeInsertMock>) {
  return {
    from: mock.fn((_table: string) => ({
      insert: insertMock,
    })),
  };
}

// ─── logAuditEventWithClient tests ───────────────────────────────────

test.beforeEach(() => {
  captureMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
  capturedInsertData = null;
});

test("logAuditEventWithClient inserts audit log with correct fields", async () => {
  const insertMock = makeInsertMock();
  const supabase = makeMockSupabase(insertMock);

  await logAuditEventWithClient(
    supabase as never,
    "org-1",
    "actor-1",
    "created",
    "product",
    "ent-1",
  );

  assert.equal(insertMock.mock.callCount(), 1, "insert should be called once");
  assert.ok(capturedInsertData, "insert data should be captured");
  assert.equal(capturedInsertData.action, "created");
  assert.equal(capturedInsertData.entity_type, "product");
  assert.equal(capturedInsertData.entity_id, "ent-1");
});

test("logAuditEventWithClient sets action, entity_type, entity_id", async () => {
  const insertMock = makeInsertMock();
  const supabase = makeMockSupabase(insertMock);

  await logAuditEventWithClient(
    supabase as never,
    "org-1",
    "actor-1",
    "status_changed",
    "invoice",
    "inv-42",
  );

  assert.equal(capturedInsertData!.action, "status_changed");
  assert.equal(capturedInsertData!.entity_type, "invoice");
  assert.equal(capturedInsertData!.entity_id, "inv-42");
});

test("logAuditEventWithClient stores field_changes when provided", async () => {
  const insertMock = makeInsertMock();
  const supabase = makeMockSupabase(insertMock);

  const fieldChanges = {
    price: { old: 100, new: 150 },
    status: { old: "draft", new: "published" },
  };

  await logAuditEventWithClient(
    supabase as never,
    "org-1",
    "actor-1",
    "updated",
    "product",
    "ent-1",
    fieldChanges,
  );

  assert.deepEqual(capturedInsertData!.field_changes, fieldChanges);
});

test("logAuditEventWithClient stores summary when provided", async () => {
  const insertMock = makeInsertMock();
  const supabase = makeMockSupabase(insertMock);

  await logAuditEventWithClient(
    supabase as never,
    "org-1",
    "actor-1",
    "created",
    "product",
    "ent-1",
    undefined,
    "Custom audit summary",
  );

  assert.equal(capturedInsertData!.summary, "Custom audit summary");
});

test("logAuditEventWithClient defaults summary to action + entityType", async () => {
  const insertMock = makeInsertMock();
  const supabase = makeMockSupabase(insertMock);

  await logAuditEventWithClient(
    supabase as never,
    "org-1",
    "actor-1",
    "deleted",
    "contact",
    "ent-2",
  );

  assert.equal(capturedInsertData!.summary, "deleted contact");
});

test("logAuditEventWithClient sets organization_id and actor_id", async () => {
  const insertMock = makeInsertMock();
  const supabase = makeMockSupabase(insertMock);

  await logAuditEventWithClient(
    supabase as never,
    "org-99",
    "user-42",
    "payment_received",
    "invoice",
    "inv-7",
  );

  assert.equal(capturedInsertData!.organization_id, "org-99");
  assert.equal(capturedInsertData!.actor_id, "user-42");
});

test("logAuditEventWithClient captures error on insert failure", async () => {
  const failingInsert = mock.fn(async () => {
    throw new Error("db connection lost");
  });
  const supabase = makeMockSupabase(failingInsert);

  await logAuditEventWithClient(
    supabase as never,
    "org-1",
    "actor-1",
    "created",
    "product",
    "ent-1",
  );

  assert.equal(
    captureMock.mock.callCount(),
    1,
    "capture should be called once on error",
  );
  const captureArg = captureMock.mock.calls[0].arguments[0];
  assert.equal(captureArg.action, "created");
  assert.equal(captureArg.entityType, "product");
  assert.equal(captureArg.entityId, "ent-1");
});

test("logAuditEventWithClient sets field_changes to null when omitted", async () => {
  const insertMock = makeInsertMock();
  const supabase = makeMockSupabase(insertMock);

  await logAuditEventWithClient(
    supabase as never,
    "org-1",
    "actor-1",
    "activated",
    "loyalty_setting",
    "ls-1",
  );

  assert.equal(capturedInsertData!.field_changes, null);
});

// ─── logAuditEvent tests (requireAppContext) ─────────────────────────

test("logAuditEvent uses requireAppContext for org and actor ids", async () => {
  capturedInsertData = null;
  // Reset the erp insert mock and supabase
  erpInsertMock.mock.resetCalls();
  erpSupabase.from.mock.resetCalls();
  // Reassign the insert mock to capture data
  erpInsertMock = mock.fn(async (data: Record<string, unknown>) => {
    capturedInsertData = data;
    return { data: null, error: null };
  });
  erpSupabase.from = mock.fn((_table: string) => ({
    insert: erpInsertMock,
  }));

  await logAuditEvent("updated", "sale", "sale-5");

  assert.ok(capturedInsertData, "insert should have been called");
  assert.equal(capturedInsertData!.organization_id, "ctx-org-1");
  assert.equal(capturedInsertData!.actor_id, "ctx-user-1");
});

test("logAuditEvent captures error when insert throws", async () => {
  capturedInsertData = null;
  const failingInsert = mock.fn(async () => {
    throw new Error("timeout");
  });
  erpSupabase.from = mock.fn(() => ({ insert: failingInsert }));

  await logAuditEvent("deleted", "expense", "exp-1");

  assert.equal(captureMock.mock.callCount(), 1, "capture called on error");
  const ctx = captureMock.mock.calls[0].arguments[1];
  assert.equal(ctx.context, "audit: log event");
});
