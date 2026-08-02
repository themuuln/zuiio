/**
 * Tests for `reviews/actions.ts` — moderateReview, deleteReview.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockActionCtx, mockMod } from "./actions-helpers";

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

type ModerateReviewFn = (
  reviewId: string,
  status: "pending" | "approved" | "rejected",
) => Promise<{ error?: string; success?: boolean } | undefined>;
type DeleteReviewFn = (
  reviewId: string,
) => Promise<{ error?: string; success?: boolean } | undefined>;

let moderateReview: ModerateReviewFn;
let deleteReview: DeleteReviewFn;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/reviews/actions");
  moderateReview = mod.moderateReview;
  deleteReview = mod.deleteReview;
});

// ─── Supabase chain builders ────────────────────────────────────────

function makeReviewsTable(opts: {
  review?: Record<string, unknown> | null;
  fetchError?: { message: string } | null;
  updateError?: { message: string } | null;
  deleteError?: { message: string } | null;
}) {
  const {
    review = {
      id: "review-1",
      status: "pending",
      product_id: "p1",
      customer_name: "Бат",
    },
    fetchError = null,
    updateError = null,
    deleteError = null,
  } = opts;

  return {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(review, fetchError)),
        })),
      })),
    })),
    update: mock.fn((_patch: Record<string, unknown>) => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) =>
          Promise.resolve({ data: null, error: updateError }),
        ),
      })),
    })),
    delete: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) =>
          Promise.resolve({ data: null, error: deleteError }),
        ),
      })),
    })),
  };
}

function makeSupabase(table: ReturnType<typeof makeReviewsTable>) {
  return {
    from: mock.fn((name: string) => (name === "reviews" ? table : {})),
  };
}

// ─── moderateReview ─────────────────────────────────────────────────

test("moderateReview approves a pending review", async () => {
  const table = makeReviewsTable({});
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const result = await moderateReview("review-1", "approved");

  assert.equal(result?.error, undefined);
  assert.equal(result?.success, true);
  const updateCall = table.update.mock.calls[0]?.arguments[0] as Record<
    string,
    unknown
  >;
  assert.equal(updateCall.status, "approved");
  assert.ok(updateCall.moderated_by);
  assert.ok(updateCall.moderated_at);
});

test("moderateReview rejects with invalid status", async () => {
  const table = makeReviewsTable({});
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  // @ts-expect-error — testing invalid status at runtime
  const result = await moderateReview("review-1", "bogus");

  assert.match(result?.error ?? "", /Буруу төлөв/);
  assert.equal(table.update.mock.calls.length, 0);
});

test("moderateReview returns error when review not found", async () => {
  const table = makeReviewsTable({
    review: null,
    fetchError: { message: "not found" },
  });
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const result = await moderateReview("missing", "approved");

  assert.match(result?.error ?? "", /Сэтгэгдэл олдсонгүй/);
});

test("moderateReview returns update error", async () => {
  const table = makeReviewsTable({ updateError: { message: "db down" } });
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const result = await moderateReview("review-1", "rejected");

  assert.match(result?.error ?? "", /алдаа гарлаа/);
});

// ─── deleteReview ───────────────────────────────────────────────────

test("deleteReview deletes a review", async () => {
  const table = makeReviewsTable({});
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const result = await deleteReview("review-1");

  assert.equal(result?.error, undefined);
  assert.equal(result?.success, true);
  assert.ok(table.delete.mock.calls.length > 0);
});

test("deleteReview returns error when review not found", async () => {
  const table = makeReviewsTable({
    review: null,
    fetchError: { message: "not found" },
  });
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const result = await deleteReview("missing");

  assert.match(result?.error ?? "", /Сэтгэгдэл олдсонгүй/);
});
