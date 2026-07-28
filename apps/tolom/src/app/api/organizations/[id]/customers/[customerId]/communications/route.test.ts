import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getCustomerCommunicationsMock = vi.fn();
const createCustomerCommunicationMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/services/communication-service", () => ({
  getCustomerCommunications: getCustomerCommunicationsMock,
  createCustomerCommunication: createCustomerCommunicationMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/customers/[customerId]/communications route", () => {
  const orgId = "org-1";
  const customerId = "cust-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("lists communications for a customer", async () => {
      const communications = [{ id: "comm-1", message: "Hello" }];
      getCustomerCommunicationsMock.mockResolvedValue(communications);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { customerId },
      });
      const body = await response.json();

      expect(getCustomerCommunicationsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        customerId,
      );
      expect(body.data).toEqual(communications);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getCustomerCommunicationsMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      await expect(
        (GET as any)({ supabase, orgId, params: { customerId } }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/customers/${customerId}/communications`;

    it("creates a communication", async () => {
      const communication = { id: "comm-1", message: "Hello" };
      createCustomerCommunicationMock.mockResolvedValue(communication);

      const body = { type: "email", subject: "Welcome", message: "Hello" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        supabase,
        orgId,
        params: { customerId },
        request,
        user,
      });
      const data = await response.json();

      expect(createCustomerCommunicationMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        customerId,
        body,
        user.id,
      );
      expect(data.data).toEqual(communication);
      expect(response.status).toBe(201);
    });

    it("handles service error", async () => {
      createCustomerCommunicationMock.mockRejectedValue(
        new Error("Validation failed"),
      );

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ type: "email" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({
          supabase,
          orgId,
          params: { customerId },
          request,
          user,
        }),
      ).rejects.toThrow("Validation failed");
    });
  });
});
