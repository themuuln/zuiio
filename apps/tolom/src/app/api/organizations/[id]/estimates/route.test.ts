import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getEstimatesMock = vi.fn();
const createEstimateMock = vi.fn();

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

vi.mock("@/lib/services/estimate-service", () => ({
  getEstimates: getEstimatesMock,
  createEstimate: createEstimateMock,
}));

const { GET, POST } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  user?: { id: string };
}

describe("organizations/[id]/estimates route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/estimates`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns estimates with query params", async () => {
      const data = [{ id: "est-1", status: "pending" }];
      getEstimatesMock.mockResolvedValue({ data, count: 1 });

      const req = new NextRequest(
        new URL(
          `${baseUrl}?status=pending&q=john&page=1&pageSize=20&branch_id=br-1&customer_id=c-1&date_from=2024-01-01&date_to=2024-12-31`,
        ),
      );
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await GET(context);
      const body = await response.json();

      expect(getEstimatesMock).toHaveBeenCalledWith({}, orgId, {
        status: "pending",
        customer_id: "c-1",
        date_from: "2024-01-01",
        date_to: "2024-12-31",
        branchId: "br-1",
        search: "john",
        page: 1,
        pageSize: 20,
      });
      expect(body.data).toEqual({ data, count: 1 });
    });

    it("returns estimates with minimal params", async () => {
      const data = [{ id: "est-1" }];
      getEstimatesMock.mockResolvedValue({ data, count: 1 });

      const req = new NextRequest(new URL(baseUrl));
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await GET(context);
      const body = await response.json();

      expect(getEstimatesMock).toHaveBeenCalledWith({}, orgId, {
        status: undefined,
        customer_id: undefined,
        date_from: undefined,
        date_to: undefined,
        branchId: undefined,
        search: undefined,
        page: undefined,
        pageSize: undefined,
      });
      expect(body.data).toEqual({ data, count: 1 });
    });

    it("handles service error", async () => {
      getEstimatesMock.mockRejectedValue(new Error("Fetch error"));

      const req = new NextRequest(new URL(baseUrl));
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      await expect(GET(context)).rejects.toThrow("Fetch error");
    });
  });

  describe("POST", () => {
    const body = { customer_id: "c-1", services: [] };

    it("creates estimate and returns 201", async () => {
      const estimate = { id: "est-1", ...body };
      createEstimateMock.mockResolvedValue(estimate);

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify(body),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      const response = await POST(context);
      const responseBody = await response.json();

      expect(createEstimateMock).toHaveBeenCalledWith({}, orgId, body, user.id);
      expect(responseBody.data).toEqual(estimate);
    });

    it("handles service error", async () => {
      createEstimateMock.mockRejectedValue(new Error("Create error"));

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify(body),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      await expect(POST(context)).rejects.toThrow("Create error");
    });
  });
});
