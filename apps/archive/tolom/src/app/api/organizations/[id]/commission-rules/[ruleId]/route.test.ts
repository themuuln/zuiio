import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const { GET, PATCH, DELETE } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  params: Record<string, string>;
}

describe("organizations/[id]/commission-rules/[ruleId] route", () => {
  const orgId = "org-1";
  const ruleId = "r-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockSingleSupabase(data: unknown, error: unknown = null) {
    return {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data, error })),
              })),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;
  }

  describe("GET", () => {
    it("returns commission rule when found", async () => {
      const rule = {
        id: ruleId,
        name: "Rule 1",
        commission_type: "percentage_of_labor",
      };
      const supabase = mockSingleSupabase(rule);

      const context: HandlerContext = { supabase, orgId, params: { ruleId } };
      const response = await GET(context);
      const body = await response.json();

      expect(body.data).toEqual(rule);
    });

    it("throws NotFoundError when rule not found", async () => {
      const supabase = mockSingleSupabase(null, {
        message: "Not found",
        code: "PGRST116",
      });

      const context: HandlerContext = { supabase, orgId, params: { ruleId } };
      await expect(GET(context)).rejects.toThrow("Commission rule not found");
    });
  });

  describe("PATCH", () => {
    it("updates allowed fields", async () => {
      const updated = {
        id: ruleId,
        name: "Updated",
        commission_type: "percentage_of_labor",
        commission_value: 25,
        is_active: false,
      };

      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn((_updates: unknown) => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: updated, error: null }),
                  ),
                })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const req = new NextRequest(
        new URL(
          `http://localhost/api/organizations/${orgId}/commission-rules/${ruleId}`,
        ),
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated",
            commission_value: 25,
            is_active: false,
          }),
        },
      );
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { ruleId },
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(body.data).toEqual(updated);
    });

    it("throws ValidationError when no valid fields", async () => {
      const req = new NextRequest(
        new URL(
          `http://localhost/api/organizations/${orgId}/commission-rules/${ruleId}`,
        ),
        { method: "PATCH", body: JSON.stringify({ invalid_field: "value" }) },
      );
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { ruleId },
      };
      await expect(PATCH(context)).rejects.toThrow("No valid fields to update");
    });

    it("throws ValidationError for invalid commission_type", async () => {
      const req = new NextRequest(
        new URL(
          `http://localhost/api/organizations/${orgId}/commission-rules/${ruleId}`,
        ),
        {
          method: "PATCH",
          body: JSON.stringify({ commission_type: "invalid" }),
        },
      );
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { ruleId },
      };
      await expect(PATCH(context)).rejects.toThrow("Invalid commission_type");
    });

    it("throws NotFoundError on update when no data returned", async () => {
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: null, error: null }),
                  ),
                })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const req = new NextRequest(
        new URL(
          `http://localhost/api/organizations/${orgId}/commission-rules/${ruleId}`,
        ),
        { method: "PATCH", body: JSON.stringify({ name: "Updated" }) },
      );
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { ruleId },
      };
      await expect(PATCH(context)).rejects.toThrow("Commission rule not found");
    });

    it("throws on supabase error during update", async () => {
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: null,
                      error: new Error("DB error"),
                    }),
                  ),
                })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const req = new NextRequest(
        new URL(
          `http://localhost/api/organizations/${orgId}/commission-rules/${ruleId}`,
        ),
        { method: "PATCH", body: JSON.stringify({ name: "Updated" }) },
      );
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { ruleId },
      };
      await expect(PATCH(context)).rejects.toThrow("DB error");
    });
  });

  describe("DELETE", () => {
    it("soft-deletes commission rule", async () => {
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId, params: { ruleId } };
      const response = await DELETE(context);
      const body = await response.json();

      expect(body.data).toEqual({ success: true });
    });

    it("throws on supabase error", async () => {
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({ error: new Error("DB error") }),
              ),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId, params: { ruleId } };
      await expect(DELETE(context)).rejects.toThrow("DB error");
    });
  });
});
