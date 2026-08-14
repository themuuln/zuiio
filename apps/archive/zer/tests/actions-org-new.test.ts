/**
 * Tests for `(onboarding)/organization/new/actions.ts` — createOrganization.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockMod } from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock });

const revalidatePathMock = mock.fn(() => {});
mockMod("next/cache", {
  revalidatePath: revalidatePathMock,
  revalidateTag: mock.fn(() => {}),
});

mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("server-only", {});

const redirectMock = mock.fn(() => {
  throw new Error("REDIRECT");
});
mockMod("next/navigation", { redirect: redirectMock });

const getUserMock = mock.fn(async () => ({
  data: { user: { id: "u1" } },
  error: null,
}));

const rpcMock = mock.fn(
  async (_name: string, _args: Record<string, unknown>) => ({
    data: { id: "org-1" },
    error: null,
  }),
);

const createClientMock = mock.fn(async () => ({
  auth: { getUser: getUserMock },
  rpc: rpcMock,
}));
mockMod("@/lib/supabase/server", { createClient: createClientMock });

mockMod("@/lib/format", {
  slugify: mock.fn((name: string) => name.toLowerCase().replace(/\s+/g, "-")),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────
let createOrganization: (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(onboarding)/organization/new/actions");
  createOrganization = mod.createOrganization;
});

function resetMocks() {
  captureMock.mock.resetCalls();
  revalidatePathMock.mock.resetCalls();
  redirectMock.mock.resetCalls();
  getUserMock.mock.resetCalls();
  rpcMock.mock.resetCalls();
  createClientMock.mock.resetCalls();

  // Default happy-path stubs
  getUserMock.mock.mockImplementation(async () => ({
    data: { user: { id: "u1" } },
    error: null,
  }));
  rpcMock.mock.mockImplementation(async () => ({
    data: { id: "org-1" },
    error: null,
  }));
}

// ─── Tests ───────────────────────────────────────────────────────────

test("createOrganization — rejects when no user", async () => {
  resetMocks();
  getUserMock.mock.mockImplementation(async () => ({
    data: { user: null },
    error: null,
  }));

  const result = await createOrganization(
    undefined,
    formData({ name: "Acme" }),
  );
  assert.deepEqual(result, { error: "Нэвтрэх шаардлагатай." });
  assert.equal(rpcMock.mock.callCount(), 0, "should not call RPC");
});

test("createOrganization — rejects missing name", async () => {
  resetMocks();

  const result = await createOrganization(undefined, formData({}));
  assert.deepEqual(result, { error: "Байгууллагын нэр шаардлагатай." });
  assert.equal(rpcMock.mock.callCount(), 0, "should not call RPC");
});

test("createOrganization — rejects empty name after trim", async () => {
  resetMocks();

  const result = await createOrganization(undefined, formData({ name: "   " }));
  assert.deepEqual(result, { error: "Байгууллагын нэр шаардлагатай." });
  assert.equal(rpcMock.mock.callCount(), 0, "should not call RPC");
});

test("createOrganization — creates with provided slug", async () => {
  resetMocks();

  await assert.rejects(
    () =>
      createOrganization(
        undefined,
        formData({ name: "Acme Corp", slug: "my-custom-slug" }),
      ),
    { message: "REDIRECT" },
  );

  assert.equal(redirectMock.mock.callCount(), 1);
  assert.deepEqual(redirectMock.mock.calls[0].arguments, ["/"]);
  assert.equal(revalidatePathMock.mock.callCount(), 1);

  // Verify RPC was called with the provided slug
  const rpcCall = rpcMock.mock.calls[0].arguments;
  assert.equal(rpcCall[0], "create_organization");
  assert.deepEqual(rpcCall[1], {
    org_name: "Acme Corp",
    org_slug: "my-custom-slug",
    org_type: "retail",
  });
});

test("createOrganization — creates with auto-generated slug via slugify", async () => {
  resetMocks();

  await assert.rejects(
    () => createOrganization(undefined, formData({ name: "My Company Name" })),
    { message: "REDIRECT" },
  );

  const rpcCall = rpcMock.mock.calls[0].arguments;
  assert.deepEqual(rpcCall[1], {
    org_name: "My Company Name",
    org_slug: "my-company-name",
    org_type: "retail",
  });
});

test("createOrganization — uses default companyType retail when not provided", async () => {
  resetMocks();

  await assert.rejects(
    () => createOrganization(undefined, formData({ name: "Test Org" })),
    { message: "REDIRECT" },
  );

  const rpcCall = rpcMock.mock.calls[0].arguments;
  assert.equal(rpcCall[1].org_type, "retail");
});

test("createOrganization — uses provided companyType", async () => {
  resetMocks();

  await assert.rejects(
    () =>
      createOrganization(
        undefined,
        formData({ name: "Wholesale Inc", company_type: "wholesale" }),
      ),
    { message: "REDIRECT" },
  );

  const rpcCall = rpcMock.mock.calls[0].arguments;
  assert.equal(rpcCall[1].org_type, "wholesale");
});

test("createOrganization — handles RPC error", async () => {
  resetMocks();
  rpcMock.mock.mockImplementation(async () => ({
    data: null,
    error: { message: "duplicate slug" },
  }));

  const result = await createOrganization(
    undefined,
    formData({ name: "Acme" }),
  );

  assert.deepEqual(result, {
    error: "Байгууллага үүсгэхэд алдаа гарлаа: duplicate slug",
  });

  // capture(rpcError) is always called — even when it exists
  assert.equal(captureMock.mock.callCount(), 1);
  assert.deepEqual(captureMock.mock.calls[0].arguments, [
    { message: "duplicate slug" },
  ]);
  assert.equal(redirectMock.mock.callCount(), 0, "should not redirect");
});

test("createOrganization — handles RPC returning object result with error field", async () => {
  resetMocks();
  rpcMock.mock.mockImplementation(async () => ({
    data: { error: "Org name already exists" },
    error: null,
  }));

  const result = await createOrganization(
    undefined,
    formData({ name: "Duplicate" }),
  );

  assert.deepEqual(result, { error: "Org name already exists" });

  // Both captures fire: rpcError (null) then result
  assert.equal(captureMock.mock.callCount(), 2);
  assert.deepEqual(captureMock.mock.calls[0].arguments, [null]);
  assert.deepEqual(captureMock.mock.calls[1].arguments, [
    { error: "Org name already exists" },
  ]);
  assert.equal(redirectMock.mock.callCount(), 0, "should not redirect");
});

test("createOrganization — calls capture for both rpcError and result on success", async () => {
  resetMocks();

  await assert.rejects(
    () => createOrganization(undefined, formData({ name: "Good Org" })),
    { message: "REDIRECT" },
  );

  // capture(null) for rpcError, then capture(result) for success
  assert.equal(captureMock.mock.callCount(), 2);
  assert.deepEqual(captureMock.mock.calls[0].arguments, [null]);
  assert.deepEqual(captureMock.mock.calls[1].arguments, [{ id: "org-1" }]);
});

test("createOrganization — trims name before sending to RPC", async () => {
  resetMocks();

  await assert.rejects(
    () => createOrganization(undefined, formData({ name: "  Trimmed Name  " })),
    { message: "REDIRECT" },
  );

  const rpcCall = rpcMock.mock.calls[0].arguments;
  assert.equal(rpcCall[1].org_name, "Trimmed Name");
});

test("createOrganization — trims slug before sending to RPC", async () => {
  resetMocks();

  await assert.rejects(
    () =>
      createOrganization(
        undefined,
        formData({ name: "Org", slug: "  padded-slug  " }),
      ),
    { message: "REDIRECT" },
  );

  const rpcCall = rpcMock.mock.calls[0].arguments;
  assert.equal(rpcCall[1].org_slug, "padded-slug");
});
