/**
 * Tests for `(dashboard)/webhooks/actions.ts` — createWebhook,
 * updateWebhook, toggleWebhookActive, deleteWebhook.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod } from "./actions-helpers";

function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Module mocks (registered before dynamic import) ────────────────

const captureMock = mock.fn(() => {});
const withDbCaptureMock = mock.fn(
  (_label: string, query: Promise<unknown>) => query,
);
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn(() => {}),
  revalidateEntity: mock.fn(() => {}),
  revalidateEntityTag: mock.fn(() => {}),
});
mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
  requireAppContext: mock.fn(async () => mockCtx),
});

type WebhookActionResult = { error?: string; success?: boolean } | undefined;

let createWebhook: (
  _prev: { error?: string } | undefined,
  formData: FormData,
) => Promise<WebhookActionResult>;
let updateWebhook: (
  _prev: { error?: string } | undefined,
  formData: FormData,
) => Promise<WebhookActionResult>;
let toggleWebhookActive: (
  webhookId: string,
  isActive: boolean,
) => Promise<WebhookActionResult>;
let deleteWebhook: (webhookId: string) => Promise<WebhookActionResult>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/webhooks/actions");
  createWebhook = mod.createWebhook;
  updateWebhook = mod.updateWebhook;
  toggleWebhookActive = mod.toggleWebhookActive;
  deleteWebhook = mod.deleteWebhook;
});

// ─── Supabase chain builders ────────────────────────────────────────

function makeSubscriptionsTable(opts: {
  insertError?: { message: string; code?: string } | null;
  existing?: { name: string } | null;
  fetchError?: { message: string } | null;
  updateError?: { message: string } | null;
  deleteError?: { message: string } | null;
}) {
  const {
    insertError = null,
    existing = { name: "Test webhook" },
    fetchError = null,
    updateError = null,
    deleteError = null,
  } = opts;
  return {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(existing, fetchError)),
        })),
      })),
    })),
    insert: mock.fn((_payload: Record<string, unknown>) => ({
      select: mock.fn(() => ({
        single: mock.fn(() => resolved({ id: "webhook-1" }, insertError)),
      })),
    })),
    update: mock.fn((_payload: Record<string, unknown>) => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) =>
          resolved(null, updateError),
        ),
      })),
    })),
    delete: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) =>
          resolved(null, deleteError),
        ),
      })),
    })),
  };
}

function makeSupabaseWithWebhooks(
  opts: Parameters<typeof makeSubscriptionsTable>[0] = {},
) {
  const table = makeSubscriptionsTable(opts);
  return {
    from: mock.fn((name: string) =>
      name === "webhook_subscriptions" ? table : {},
    ),
    table,
  };
}

// ─── createWebhook ──────────────────────────────────────────────────

test("createWebhook rejects missing name", async () => {
  mockCtx = mockActionCtx({ supabase: makeSupabaseWithWebhooks() });
  const result = await createWebhook(
    undefined,
    formData({ url: "https://example.com/hook" }),
  );

  assert.equal(result?.error, "Нэр шаардлагатай.");
});

test("createWebhook rejects missing url", async () => {
  mockCtx = mockActionCtx({ supabase: makeSupabaseWithWebhooks() });
  const result = await createWebhook(undefined, formData({ name: "Hook" }));

  assert.equal(result?.error, "URL шаардлагатай.");
});

test("createWebhook rejects invalid url", async () => {
  mockCtx = mockActionCtx({ supabase: makeSupabaseWithWebhooks() });
  const result = await createWebhook(
    undefined,
    formData({ name: "Hook", url: "not-a-url", event_types: "sale.created" }),
  );

  assert.ok(result?.error);
});

test("createWebhook rejects empty event types", async () => {
  mockCtx = mockActionCtx({ supabase: makeSupabaseWithWebhooks() });
  const result = await createWebhook(
    undefined,
    formData({ name: "Hook", url: "https://example.com/hook" }),
  );

  assert.equal(result?.error, "Дор хаяж нэг үйл явдал сонгоно уу.");
});

test("createWebhook inserts with valid payload", async () => {
  const sb = makeSupabaseWithWebhooks();
  mockCtx = mockActionCtx({ supabase: sb });

  const result = await createWebhook(
    undefined,
    formData({
      name: "Худалдаа",
      url: "https://example.com/hook",
      secret: "s3cret",
      event_types: "sale.created,stock.low",
      is_active: "true",
    }),
  );

  assert.equal(result?.success, true);
  const [payload] = sb.table.insert.mock.calls[0].arguments as [
    Record<string, unknown>,
  ];
  assert.deepEqual(payload, {
    organization_id: "test-org-id",
    name: "Худалдаа",
    url: "https://example.com/hook",
    secret: "s3cret",
    event_types: ["sale.created", "stock.low"],
    is_active: true,
  });
});

test("createWebhook returns error on insert failure", async () => {
  mockCtx = mockActionCtx({
    supabase: makeSupabaseWithWebhooks({
      insertError: { message: "db down" },
    }),
  });

  const result = await createWebhook(
    undefined,
    formData({
      name: "Hook",
      url: "https://example.com/hook",
      event_types: "sale.created",
    }),
  );

  assert.ok(result?.error?.includes("db down"));
  assert.ok(
    captureMock.mock.calls.some((c) =>
      JSON.stringify(c.arguments[1]).includes("createWebhook"),
    ),
  );
});

// ─── updateWebhook ──────────────────────────────────────────────────

test("updateWebhook rejects missing id", async () => {
  mockCtx = mockActionCtx({ supabase: makeSupabaseWithWebhooks() });
  const result = await updateWebhook(
    undefined,
    formData({ name: "Hook", url: "https://example.com/hook" }),
  );

  assert.equal(result?.error, "Вебхукийн ID олдсонгүй.");
});

test("updateWebhook returns error when webhook not found", async () => {
  mockCtx = mockActionCtx({
    supabase: makeSupabaseWithWebhooks({
      existing: null,
      fetchError: { message: "not found" },
    }),
  });

  const result = await updateWebhook(
    undefined,
    formData({
      id: "webhook-1",
      name: "Hook",
      url: "https://example.com/hook",
      event_types: "sale.created",
    }),
  );

  assert.equal(result?.error, "Вебхук олдсонгүй.");
});

test("updateWebhook updates existing webhook", async () => {
  const sb = makeSupabaseWithWebhooks();
  mockCtx = mockActionCtx({ supabase: sb });

  const result = await updateWebhook(
    undefined,
    formData({
      id: "webhook-1",
      name: "Шинэ нэр",
      url: "https://example.com/new-hook",
      secret: "",
      event_types: "invoice.paid",
      is_active: "false",
    }),
  );

  assert.equal(result?.success, true);
  const [payload] = sb.table.update.mock.calls[0].arguments as [
    Record<string, unknown>,
  ];
  assert.equal(payload.name, "Шинэ нэр");
  assert.equal(payload.url, "https://example.com/new-hook");
  assert.equal(payload.secret, null);
  assert.deepEqual(payload.event_types, ["invoice.paid"]);
  assert.equal(payload.is_active, false);
});

test("updateWebhook returns error on update failure", async () => {
  mockCtx = mockActionCtx({
    supabase: makeSupabaseWithWebhooks({
      updateError: { message: "update failed" },
    }),
  });

  const result = await updateWebhook(
    undefined,
    formData({
      id: "webhook-1",
      name: "Hook",
      url: "https://example.com/hook",
      event_types: "sale.created",
    }),
  );

  assert.ok(result?.error?.includes("update failed"));
});

// ─── toggleWebhookActive ────────────────────────────────────────────

test("toggleWebhookActive returns error when webhook not found", async () => {
  mockCtx = mockActionCtx({
    supabase: makeSupabaseWithWebhooks({ existing: null }),
  });

  const result = await toggleWebhookActive("webhook-1", false);

  assert.equal(result?.error, "Вебхук олдсонгүй.");
});

test("toggleWebhookActive toggles is_active", async () => {
  const sb = makeSupabaseWithWebhooks();
  mockCtx = mockActionCtx({ supabase: sb });

  const result = await toggleWebhookActive("webhook-1", false);

  assert.equal(result?.success, true);
  const [payload] = sb.table.update.mock.calls[0].arguments as [
    Record<string, unknown>,
  ];
  assert.equal(payload.is_active, false);
});

test("toggleWebhookActive returns error on update failure", async () => {
  mockCtx = mockActionCtx({
    supabase: makeSupabaseWithWebhooks({
      updateError: { message: "toggle failed" },
    }),
  });

  const result = await toggleWebhookActive("webhook-1", true);

  assert.ok(result?.error?.includes("toggle failed"));
  assert.ok(
    captureMock.mock.calls.some((c) =>
      JSON.stringify(c.arguments[1]).includes("toggleWebhookActive"),
    ),
  );
});

// ─── deleteWebhook ──────────────────────────────────────────────────

test("deleteWebhook returns error when webhook not found", async () => {
  mockCtx = mockActionCtx({
    supabase: makeSupabaseWithWebhooks({ existing: null }),
  });

  const result = await deleteWebhook("webhook-1");

  assert.equal(result?.error, "Вебхук олдсонгүй.");
});

test("deleteWebhook deletes existing webhook", async () => {
  const sb = makeSupabaseWithWebhooks();
  mockCtx = mockActionCtx({ supabase: sb });

  const result = await deleteWebhook("webhook-1");

  assert.equal(result?.success, true);
  assert.ok(sb.table.delete.mock.calls.length > 0);
});

test("deleteWebhook returns error on delete failure", async () => {
  mockCtx = mockActionCtx({
    supabase: makeSupabaseWithWebhooks({
      deleteError: { message: "delete failed" },
    }),
  });

  const result = await deleteWebhook("webhook-1");

  assert.ok(result?.error?.includes("delete failed"));
});
