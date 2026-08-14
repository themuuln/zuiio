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

const { PATCH } = await import("./route");

interface HandlerContext {
  request: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
}

describe("organizations/[id]/diagnosis-labels/reorder route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/diagnosis-labels/reorder`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Chain: .from("diagnosis_labels").update({...}).eq("id", x).eq("organization_id", orgId)
   * The first .eq() returns an object with .eq(), the second resolves.
   */
  function mockReorder(error: unknown = null) {
    const secondEq = vi.fn().mockResolvedValue({ error });
    const firstEq = vi.fn(() => ({ eq: secondEq }));
    return {
      from: vi.fn(() => ({
        update: vi.fn(() => ({ eq: firstEq })),
      })),
    } as unknown as SupabaseClient;
  }

  describe("PATCH", () => {
    it("reorders labels successfully", async () => {
      const supabase = mockReorder(null);
      const updates = [
        { id: "lbl-1", sort_order: 2 },
        { id: "lbl-2", sort_order: 1 },
      ];

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ updates }),
      });
      const context: HandlerContext = { request: req, supabase, orgId };
      const response = await PATCH(context);
      const body = await response.json();

      expect(body.data).toEqual({ success: true });
    });

    it("throws ValidationError when updates is not an array", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ updates: "not-array" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      await expect(PATCH(context)).rejects.toThrow("updates array is required");
    });

    it("throws ValidationError when updates is empty", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ updates: [] }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      await expect(PATCH(context)).rejects.toThrow("updates array is required");
    });

    it("throws ValidationError when item lacks id or sort_order", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ updates: [{ id: "lbl-1" }] }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      await expect(PATCH(context)).rejects.toThrow(
        "Each update must have id and sort_order",
      );
    });

    it("throws on supabase error", async () => {
      const supabase = mockReorder(new Error("DB error"));

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ updates: [{ id: "lbl-1", sort_order: 1 }] }),
      });
      const context: HandlerContext = { request: req, supabase, orgId };
      await expect(PATCH(context)).rejects.toThrow("DB error");
    });
  });
});
