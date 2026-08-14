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

describe("organizations/[id]/commission-rules route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/commission-rules`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns enriched commission rules", async () => {
      const rules = [
        {
          id: "r-1",
          mechanic_id: "m-1",
          name: "Rule 1",
          commission_type: "percentage_of_labor",
          commission_value: 20,
          min_commission: null,
          max_commission: null,
          is_active: true,
          priority: 1,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: "r-2",
          mechanic_id: null,
          name: "Global Rule",
          commission_type: "fixed_per_work_order",
          commission_value: 5000,
          min_commission: null,
          max_commission: null,
          is_active: true,
          priority: 0,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      const profiles = [{ id: "m-1", full_name: "Bob" }];

      let profileQueryCalled = false;
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "mechanic_commission_rules") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  is: vi.fn(() => ({
                    order: vi.fn(() =>
                      Promise.resolve({ data: rules, error: null }),
                    ),
                  })),
                })),
              })),
            };
          }
          if (table === "profiles") {
            profileQueryCalled = true;
            return {
              select: vi.fn(() => ({
                in: vi.fn(() =>
                  Promise.resolve({ data: profiles, error: null }),
                ),
              })),
            };
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ is: vi.fn(() => ({ order: vi.fn() })) })),
            })),
          };
        }),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(profileQueryCalled).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].mechanic_name).toBe("Bob");
      expect(body.data[1].mechanic_name).toBeNull();
    });

    it("returns empty array when no rules", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(body.data).toEqual([]);
    });

    it("throws on supabase error", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({ data: null, error: new Error("DB error") }),
                ),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId };
      await expect(GET(context)).rejects.toThrow("DB error");
    });
  });

  describe("POST", () => {
    it("creates commission rule on success", async () => {
      const rule = {
        id: "r-1",
        organization_id: orgId,
        name: "New Rule",
        commission_type: "percentage_of_labor",
        commission_value: 15,
        mechanic_id: null,
        min_commission: null,
        max_commission: null,
        is_active: true,
        priority: 0,
        created_by: user.id,
      };

      let _capturedInsert: unknown = null;
      const supabase = {
        from: vi.fn(() => ({
          insert: vi.fn((insertData: unknown) => {
            _capturedInsert = insertData;
            return {
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: rule, error: null }),
                ),
              })),
            };
          }),
        })),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({
          name: "New Rule",
          commission_type: "percentage_of_labor",
          commission_value: 15,
        }),
      });
      const context: HandlerContext = { request: req, supabase, orgId, user };
      const response = await POST(context);
      const body = await response.json();

      expect(body.data).toEqual(rule);
    });

    it("throws ValidationError when name is missing", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({
          commission_type: "percentage_of_labor",
          commission_value: 10,
        }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      await expect(POST(context)).rejects.toThrow(
        "Name, commission_type, and commission_value are required",
      );
    });

    it("throws ValidationError when commission_type is missing", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({ name: "Rule", commission_value: 10 }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      await expect(POST(context)).rejects.toThrow(
        "Name, commission_type, and commission_value are required",
      );
    });

    it("throws ValidationError for invalid commission_type", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({
          name: "Rule",
          commission_type: "invalid",
          commission_value: 10,
        }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      await expect(POST(context)).rejects.toThrow("Invalid commission_type");
    });

    it("throws on supabase error", async () => {
      const supabase = {
        from: vi.fn(() => ({
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
        body: JSON.stringify({
          name: "Rule",
          commission_type: "percentage_of_labor",
          commission_value: 10,
        }),
      });
      const context: HandlerContext = { request: req, supabase, orgId, user };
      await expect(POST(context)).rejects.toThrow("DB error");
    });
  });
});
