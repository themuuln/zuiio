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

const { PATCH, DELETE } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  params: Record<string, string>;
}

describe("organizations/[id]/diagnosis-labels/[labelId] route", () => {
  const orgId = "org-1";
  const labelId = "lbl-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("updates allowed fields", async () => {
      const updated = {
        id: labelId,
        name: "Updated",
        color: "#ff0000",
        is_active: false,
      };
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
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
          `http://localhost/api/organizations/${orgId}/diagnosis-labels/${labelId}`,
        ),
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated",
            color: "#ff0000",
            is_active: false,
          }),
        },
      );
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { labelId },
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(body.data).toEqual(updated);
    });

    it("throws ValidationError when no valid fields", async () => {
      const req = new NextRequest(
        new URL(
          `http://localhost/api/organizations/${orgId}/diagnosis-labels/${labelId}`,
        ),
        { method: "PATCH", body: JSON.stringify({ invalid_field: "value" }) },
      );
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { labelId },
      };
      await expect(PATCH(context)).rejects.toThrow("No valid fields to update");
    });

    it("throws NotFoundError when label not found", async () => {
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
          `http://localhost/api/organizations/${orgId}/diagnosis-labels/${labelId}`,
        ),
        { method: "PATCH", body: JSON.stringify({ name: "Updated" }) },
      );
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { labelId },
      };
      await expect(PATCH(context)).rejects.toThrow("Diagnosis label not found");
    });

    it("throws on supabase error", async () => {
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
          `http://localhost/api/organizations/${orgId}/diagnosis-labels/${labelId}`,
        ),
        { method: "PATCH", body: JSON.stringify({ name: "Updated" }) },
      );
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { labelId },
      };
      await expect(PATCH(context)).rejects.toThrow("DB error");
    });
  });

  describe("DELETE", () => {
    it("soft-deletes label", async () => {
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;

      const context: HandlerContext = { supabase, orgId, params: { labelId } };
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

      const context: HandlerContext = { supabase, orgId, params: { labelId } };
      await expect(DELETE(context)).rejects.toThrow("DB error");
    });
  });
});
