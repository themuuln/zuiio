import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getEstimateMock = vi.fn();
const updateEstimateMock = vi.fn();
const deleteEstimateMock = vi.fn();

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
  noContent: vi.fn(() => new Response(null, { status: 204 })),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/estimate-service", () => ({
  getEstimate: getEstimateMock,
  updateEstimate: updateEstimateMock,
  deleteEstimate: deleteEstimateMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  params: Record<string, string>;
  user?: { id: string };
}

describe("organizations/[id]/estimates/[estimateId] route", () => {
  const orgId = "org-1";
  const estimateId = "est-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns estimate when found", async () => {
      const estimate = { id: estimateId, status: "pending" };
      getEstimateMock.mockResolvedValue(estimate);

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        params: { estimateId },
      };
      const response = await GET(context);
      const body = await response.json();

      expect(getEstimateMock).toHaveBeenCalledWith({}, estimateId, orgId);
      expect(body.data).toEqual(estimate);
    });

    it("returns 404 when estimate not found", async () => {
      getEstimateMock.mockResolvedValue(null);

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        params: { estimateId },
      };
      const response = await GET(context);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("handles service error", async () => {
      getEstimateMock.mockRejectedValue(new Error("Fetch error"));

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        params: { estimateId },
      };
      await expect(GET(context)).rejects.toThrow("Fetch error");
    });
  });

  describe("PATCH", () => {
    const body = { status: "approved" };

    it("updates estimate and returns result", async () => {
      const updated = { id: estimateId, ...body };
      updateEstimateMock.mockResolvedValue(updated);

      const req = new NextRequest(
        new URL(
          `http://localhost/api/organizations/${orgId}/estimates/${estimateId}`,
        ),
        { method: "PATCH", body: JSON.stringify(body) },
      );
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { estimateId },
        user,
      };
      const response = await PATCH(context);
      const responseBody = await response.json();

      expect(updateEstimateMock).toHaveBeenCalledWith(
        {},
        estimateId,
        orgId,
        body,
        user.id,
      );
      expect(responseBody.data).toEqual(updated);
    });

    it("handles service error", async () => {
      updateEstimateMock.mockRejectedValue(new Error("Update error"));

      const req = new NextRequest(
        new URL(
          `http://localhost/api/organizations/${orgId}/estimates/${estimateId}`,
        ),
        { method: "PATCH", body: JSON.stringify(body) },
      );
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { estimateId },
        user,
      };
      await expect(PATCH(context)).rejects.toThrow("Update error");
    });
  });

  describe("DELETE", () => {
    it("deletes estimate and returns noContent", async () => {
      deleteEstimateMock.mockResolvedValue(undefined);

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        params: { estimateId },
      };
      const response = await DELETE(context);

      expect(deleteEstimateMock).toHaveBeenCalledWith({}, estimateId, orgId);
      expect(response.status).toBe(204);
    });

    it("handles service error", async () => {
      deleteEstimateMock.mockRejectedValue(new Error("Delete error"));

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        params: { estimateId },
      };
      await expect(DELETE(context)).rejects.toThrow("Delete error");
    });
  });
});
