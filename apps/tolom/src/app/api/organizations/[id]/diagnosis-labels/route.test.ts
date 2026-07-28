import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const { GET, POST } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  user?: { id: string };
}

describe("organizations/[id]/diagnosis-labels route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/diagnosis-labels`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockSelectSupabase(data: unknown[], error: unknown = null) {
    return {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data, error })),
              })),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;
  }

  describe("GET", () => {
    it("returns diagnosis labels", async () => {
      const labels = [{ id: "lbl-1", name: "Check Engine", sort_order: 1 }];
      const supabase = mockSelectSupabase(labels);

      const context: HandlerContext = { supabase, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(body.data).toEqual(labels);
    });

    it("returns empty array when no labels", async () => {
      const supabase = mockSelectSupabase(null);

      const context: HandlerContext = { supabase, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(body.data).toEqual([]);
    });

    it("throws on supabase error", async () => {
      const supabase = mockSelectSupabase(null, new Error("DB error"));

      const context: HandlerContext = { supabase, orgId };
      await expect(GET(context)).rejects.toThrow("DB error");
    });
  });

  describe("POST", () => {
    it("creates diagnosis label with explicit sort_order", async () => {
      const label = { id: "lbl-1", name: "Check Engine", sort_order: 5 };
      const supabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: label, error: null }),
              ),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({ name: "Check Engine", sort_order: 5 }),
      });
      const context: HandlerContext = { request: req, supabase, orgId, user };
      const response = await POST(context);
      const body = await response.json();
      const _responseBody = await body;

      expect(body.data).toEqual(label);
    });

    it("auto-assigns sort_order when not specified", async () => {
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "diagnosis_labels") {
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: "lbl-2", name: "New Label", sort_order: 4 },
                      error: null,
                    }),
                  ),
                })),
              })),
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  is: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn(() => ({
                        single: vi.fn(() =>
                          Promise.resolve({
                            data: { sort_order: 3 },
                            error: null,
                          }),
                        ),
                      })),
                    })),
                  })),
                })),
              })),
            };
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({ single: vi.fn() })),
                  })),
                })),
              })),
            })),
          };
        }),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({ name: "New Label" }),
      });
      const context: HandlerContext = { request: req, supabase, orgId, user };
      const response = await POST(context);
      const body = await response.json();

      expect(body.data.name).toBe("New Label");
      expect(body.data.sort_order).toBe(4);
    });

    it("throws ValidationError when name is missing", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({ color: "#ff0000" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      await expect(POST(context)).rejects.toThrow("name is required");
    });

    it("throws on supabase insert error", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn(() =>
                      Promise.resolve({ data: { sort_order: 5 }, error: null }),
                    ),
                  })),
                })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: new Error("DB error") }),
              ),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({ name: "New Label" }),
      });
      const context: HandlerContext = { request: req, supabase, orgId, user };
      await expect(POST(context)).rejects.toThrow("DB error");
    });
  });
});
