import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const listFollowupsMock = vi.fn();
const createFollowupMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/followup-service", () => ({
  listFollowups: listFollowupsMock,
  createFollowup: createFollowupMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/followups route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/followups`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns followups on success", async () => {
      const result = {
        data: [{ id: "fu-1", subject: "Follow up call" }],
        count: 1,
      };
      listFollowupsMock.mockResolvedValue(result);

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, supabase: {}, orgId });
      const body = await response.json();

      expect(listFollowupsMock).toHaveBeenCalledWith({}, orgId, {
        customerId: undefined,
        status: undefined,
        assignedTo: undefined,
        page: 1,
        limit: 20,
      });
      expect(body.data).toEqual(result);
      expect(response.status).toBe(200);
    });

    it("passes search params when provided", async () => {
      const result = { data: [], count: 0 };
      listFollowupsMock.mockResolvedValue(result);

      const request = new NextRequest(
        `${baseUrl}?customerId=cus-1&status=pending&assignedTo=user-1&page=2&limit=10`,
      );
      await (GET as any)({ request, supabase: {}, orgId });

      expect(listFollowupsMock).toHaveBeenCalledWith({}, orgId, {
        customerId: "cus-1",
        status: "pending",
        assignedTo: "user-1",
        page: 2,
        limit: 10,
      });
    });

    it("handles service error", async () => {
      listFollowupsMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl);
      await expect(
        (GET as any)({ request, supabase: {}, orgId }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("POST", () => {
    it("creates a followup on success", async () => {
      const followup = { id: "fu-1", subject: "Follow up call" };
      createFollowupMock.mockResolvedValue(followup);

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({
          customer_id: "cus-1",
          type: "call",
          subject: "Follow up call",
          notes: "Call customer about service",
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ request, supabase: {}, orgId });
      const body = await response.json();

      expect(createFollowupMock).toHaveBeenCalledWith({}, orgId, {
        customer_id: "cus-1",
        vehicle_id: undefined,
        work_order_id: undefined,
        estimate_id: undefined,
        invoice_id: undefined,
        type: "call",
        subject: "Follow up call",
        notes: "Call customer about service",
        due_at: undefined,
        assigned_to: undefined,
        created_by: undefined,
      });
      expect(body.data).toEqual(followup);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      createFollowupMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({
          customer_id: "cus-1",
          type: "call",
          subject: "Test",
        }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ request, supabase: {}, orgId }),
      ).rejects.toThrow("DB error");
    });
  });
});
