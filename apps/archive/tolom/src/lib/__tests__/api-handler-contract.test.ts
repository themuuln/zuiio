import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ok } from "@/lib/api-response";

// ── Mocks ──────────────────────────────────────────────────────

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

// Import after the mock is registered (hoisted above).
const { createRouteHandler, createSimpleRouteHandler } = await import(
  "@/lib/api-handler"
);

// ── Fake Supabase client ───────────────────────────────────────

interface FakeSupabaseShape {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
}

/** Chainable fake for: from().select().eq().eq().is().maybeSingle() */
function makeFakeSupabase(maybeSingleResult: {
  data: { organization_id: string } | null;
  error: null;
}): FakeSupabaseShape {
  const maybeSingle = vi.fn().mockResolvedValue(maybeSingleResult);
  const is = vi.fn(() => ({ maybeSingle }));
  const eq = vi.fn(() => ({ eq, is }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null as User | null },
        error: null,
      }),
    },
    from,
  };
}

const user: User = {
  id: "user-1",
  aud: "authenticated",
  role: "authenticated",
  email: "user@example.com",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
} as User;

// ── Tests ──────────────────────────────────────────────────────

describe("api-handler contract", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  const makeRequest = () =>
    new NextRequest("http://localhost/api/organizations/org-1/test");

  describe("createRouteHandler", () => {
    it("returns 401 with X-Auth-Required when unauthenticated", async () => {
      const supabase = makeFakeSupabase({ data: null, error: null });
      createClientMock.mockResolvedValue(supabase);

      const response = await createRouteHandler(async () =>
        ok({ never: true }),
      )(makeRequest(), { params: Promise.resolve({ id: "org-1" }) });

      expect(response.status).toBe(401);
      expect(response.headers.get("X-Auth-Required")).toBe("true");
      await expect(response.json()).resolves.toEqual({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" },
      });
    });

    it("passes the authenticated context through and returns the handler response", async () => {
      const supabase = makeFakeSupabase({
        data: { organization_id: "org-1" },
        error: null,
      });
      supabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });
      createClientMock.mockResolvedValue(supabase);

      const handler = vi.fn(
        async (ctx: { orgId: string; user: User; supabase: SupabaseClient }) =>
          ok({ orgId: ctx.orgId, userId: ctx.user.id }),
      );

      const response = await createRouteHandler(handler)(makeRequest(), {
        params: Promise.resolve({ id: "org-1" }),
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: "org-1",
          user,
          supabase,
        }),
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        data: { orgId: "org-1", userId: "user-1" },
      });
    });

    it("returns 403 when the user is not a member of the org", async () => {
      const supabase = makeFakeSupabase({ data: null, error: null });
      supabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });
      createClientMock.mockResolvedValue(supabase);

      const response = await createRouteHandler(async () =>
        ok({ never: true }),
      )(makeRequest(), { params: Promise.resolve({ id: "org-1" }) });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "FORBIDDEN",
          message: "Not a member of this organization",
        },
      });
    });

    it("maps a handler-thrown AppError to its structured shape", async () => {
      const supabase = makeFakeSupabase({
        data: { organization_id: "org-1" },
        error: null,
      });
      supabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });
      createClientMock.mockResolvedValue(supabase);

      const response = await createRouteHandler(async () => {
        throw new (await import("@/lib/errors")).ForbiddenError("nope");
      })(makeRequest(), { params: Promise.resolve({ id: "org-1" }) });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: { code: "FORBIDDEN", message: "nope" },
      });
    });
  });

  describe("createSimpleRouteHandler", () => {
    it("returns 401 by default when unauthenticated", async () => {
      const supabase = makeFakeSupabase({ data: null, error: null });
      createClientMock.mockResolvedValue(supabase);

      const response = await createSimpleRouteHandler(async () =>
        ok({ never: true }),
      )(makeRequest());

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: { code: "UNAUTHORIZED", message: "Unauthorized" },
      });
    });

    it("skips auth for public routes (requireAuth: false) and passes user null", async () => {
      const supabase = makeFakeSupabase({ data: null, error: null });
      createClientMock.mockResolvedValue(supabase);

      const handler = vi.fn(async (ctx: { user: User | null }) =>
        ok({ userId: ctx.user?.id ?? null }),
      );
      const response = await createSimpleRouteHandler(handler, {
        requireAuth: false,
      })(makeRequest());

      expect(supabase.auth.getUser).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        data: { userId: null },
      });
    });
  });
});
