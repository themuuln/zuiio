import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const { GET } = await import("./route");

interface HandlerContext {
  supabase: SupabaseClient;
  orgId: string;
}

describe("organizations/[id]/permissions route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Build a supabase mock that resolves with the given data/error.
   * Chain: .from().select().eq().is().order("resource").order("action")
   */
  function mockPermissions(
    data: unknown[] | null,
    error: object | null = null,
  ) {
    const resolvePromise = { data, error };
    const secondOrder = vi.fn().mockResolvedValue(resolvePromise);

    return {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(() => ({ order: secondOrder })),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;
  }

  describe("GET", () => {
    it("returns permissions on success", async () => {
      const permissions = [
        {
          id: "p-1",
          name: "Read",
          resource: "work_orders",
          action: "read",
          description: null,
        },
      ];
      const context: HandlerContext = {
        supabase: mockPermissions(permissions),
        orgId,
      };

      const response = await GET(context);
      const body = await response.json();

      expect(body.data).toEqual(permissions);
    });

    it("returns empty array when no permissions", async () => {
      const context: HandlerContext = {
        supabase: mockPermissions(null),
        orgId,
      };

      const response = await GET(context);
      const body = await response.json();

      expect(body.data).toEqual([]);
    });

    it("returns apiError on fetch error", async () => {
      const context: HandlerContext = {
        supabase: mockPermissions(null, { message: "DB error" }),
        orgId,
      };

      const response = await GET(context);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("FETCH_ERROR");
    });
  });
});
