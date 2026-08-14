/**
 * Tests for `blog/actions.ts` — createBlogPost, updateBlogPost,
 * toggleBlogPostPublished, deleteBlogPost.
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

type BlogActionResult = { error?: string; success?: boolean } | undefined;

let createBlogPost: (
  _prev: { error?: string } | undefined,
  formData: FormData,
) => Promise<BlogActionResult>;
let updateBlogPost: (
  _prev: { error?: string } | undefined,
  formData: FormData,
) => Promise<BlogActionResult>;
let toggleBlogPostPublished: (
  postId: string,
  isPublished: boolean,
) => Promise<BlogActionResult>;
let deleteBlogPost: (postId: string) => Promise<BlogActionResult>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/blog/actions");
  createBlogPost = mod.createBlogPost;
  updateBlogPost = mod.updateBlogPost;
  toggleBlogPostPublished = mod.toggleBlogPostPublished;
  deleteBlogPost = mod.deleteBlogPost;
});

// ─── Supabase chain builders ────────────────────────────────────────

function makePostsTable(opts: {
  postId?: string;
  insertError?: { message: string; code?: string } | null;
  existing?: {
    title: string;
    slug: string;
    is_published: boolean;
  } | null;
  fetchError?: { message: string } | null;
  updateError?: { message: string } | null;
  deleteError?: { message: string } | null;
}) {
  const {
    postId = "post-1",
    insertError = null,
    existing = { title: "Old title", slug: "old-title", is_published: false },
    fetchError = null,
    updateError = null,
    deleteError = null,
  } = opts;

  return {
    insert: mock.fn(() => ({
      select: mock.fn(() => ({
        single: mock.fn(() =>
          resolved({ id: postId, slug: "hello" }, insertError),
        ),
      })),
    })),
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(existing, fetchError)),
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

function makeSupabase(table: ReturnType<typeof makePostsTable>) {
  return {
    from: mock.fn((name: string) => (name === "blog_posts" ? table : {})),
  };
}

// ─── createBlogPost ─────────────────────────────────────────────────

test("createBlogPost creates a published post", async () => {
  const table = makePostsTable({});
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const fd = formData({
    title: "Шинэ нийтлэл",
    content: "Агуулга",
    excerpt: "Товч",
    cover_image_url: "https://example.com/img.jpg",
    is_published: "true",
  });

  const result = await createBlogPost(undefined, fd);

  assert.equal(result?.error, undefined);
  assert.equal(result?.success, true);
  const insert = table.insert.mock.calls[0]?.arguments[0] as Record<
    string,
    unknown
  >;
  assert.equal(insert.title, "Шинэ нийтлэл");
  assert.ok(insert.slug);
  assert.equal(insert.is_published, true);
  assert.ok(insert.published_at);
});

test("createBlogPost validates title", async () => {
  const table = makePostsTable({});
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const fd = formData({ title: "", content: "Агуулга" });
  const result = await createBlogPost(undefined, fd);

  assert.match(result?.error ?? "", /Гарчиг шаардлагатай/);
  assert.equal(table.insert.mock.calls.length, 0);
});

test("createBlogPost validates content", async () => {
  const table = makePostsTable({});
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const fd = formData({ title: "Гарчиг", content: "" });
  const result = await createBlogPost(undefined, fd);

  assert.match(result?.error ?? "", /Агуулга шаардлагатай/);
});

test("createBlogPost returns insert error", async () => {
  const table = makePostsTable({ insertError: { message: "db down" } });
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const fd = formData({ title: "Гарчиг", content: "Агуулга" });
  const result = await createBlogPost(undefined, fd);

  assert.match(result?.error ?? "", /алдаа гарлаа/);
});

// ─── updateBlogPost ─────────────────────────────────────────────────

test("updateBlogPost updates an existing post", async () => {
  const table = makePostsTable({});
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const fd = formData({
    id: "post-1",
    title: "Шинэ гарчиг",
    content: "Шинэ агуулга",
    excerpt: "",
    cover_image_url: "",
    is_published: "false",
  });

  const result = await updateBlogPost(undefined, fd);

  assert.equal(result?.error, undefined);
  const update = table.update.mock.calls[0]?.arguments[0] as Record<
    string,
    unknown
  >;
  assert.equal(update.title, "Шинэ гарчиг");
  assert.equal(update.is_published, false);
  // Title changed → slug regenerated
  assert.ok(update.slug);
  assert.notEqual(update.slug, "old-title");
});

test("updateBlogPost returns error when post not found", async () => {
  const table = makePostsTable({
    existing: null,
    fetchError: { message: "not found" },
  });
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const fd = formData({ id: "missing", title: "Гарчиг", content: "Агуулга" });
  const result = await updateBlogPost(undefined, fd);

  assert.match(result?.error ?? "", /Нийтлэл олдсонгүй/);
});

test("updateBlogPost returns update error", async () => {
  const table = makePostsTable({ updateError: { message: "db down" } });
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const fd = formData({ id: "post-1", title: "Гарчиг", content: "Агуулга" });
  const result = await updateBlogPost(undefined, fd);

  assert.match(result?.error ?? "", /алдаа гарлаа/);
});

// ─── toggleBlogPostPublished ────────────────────────────────────────

test("toggleBlogPostPublished publishes a draft", async () => {
  const table = makePostsTable({
    existing: { title: "Draft", slug: "draft", is_published: false },
  });
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const result = await toggleBlogPostPublished("post-1", true);

  assert.equal(result?.error, undefined);
  const update = table.update.mock.calls[0]?.arguments[0] as Record<
    string,
    unknown
  >;
  assert.equal(update.is_published, true);
  assert.ok(update.published_at);
});

test("toggleBlogPostPublished unpublishes a post", async () => {
  const table = makePostsTable({
    existing: { title: "Live", slug: "live", is_published: true },
  });
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const result = await toggleBlogPostPublished("post-1", false);

  assert.equal(result?.error, undefined);
  const update = table.update.mock.calls[0]?.arguments[0] as Record<
    string,
    unknown
  >;
  assert.equal(update.is_published, false);
  assert.equal(update.published_at, null);
});

// ─── deleteBlogPost ─────────────────────────────────────────────────

test("deleteBlogPost deletes a post", async () => {
  const table = makePostsTable({});
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const result = await deleteBlogPost("post-1");

  assert.equal(result?.error, undefined);
  assert.ok(table.delete.mock.calls.length > 0);
});

test("deleteBlogPost returns error when post not found", async () => {
  const table = makePostsTable({
    existing: null,
    fetchError: { message: "not found" },
  });
  mockCtx = mockActionCtx({ supabase: makeSupabase(table) });

  const result = await deleteBlogPost("missing");

  assert.match(result?.error ?? "", /Нийтлэл олдсонгүй/);
});
