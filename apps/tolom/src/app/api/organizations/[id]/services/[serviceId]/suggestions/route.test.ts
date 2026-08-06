import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getSuggestionsMock = vi.fn();
const addSuggestionMock = vi.fn();
const removeSuggestionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/service-part-suggestions-service", () => ({
  getServicePartSuggestions: getSuggestionsMock,
  addServicePartSuggestion: addSuggestionMock,
  removeServicePartSuggestion: removeSuggestionMock,
}));

const { GET, POST, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/services/[serviceId]/suggestions route", () => {
  const orgId = "org-1";
  const serviceId = "svc-1";
  const suggestionId = "sug-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/services/${serviceId}/suggestions`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns suggestions for a service", async () => {
      const suggestions = [
        {
          id: suggestionId,
          service_id: serviceId,
          part_id: "part-1",
          part_name: "Oil Filter",
          quantity: 1,
        },
      ];
      getSuggestionsMock.mockResolvedValue(suggestions);

      const response = await (GET as any)({
        orgId,
        params: { serviceId },
        supabase: {},
      });
      const body = await response.json();

      expect(getSuggestionsMock).toHaveBeenCalledWith({}, orgId, serviceId);
      expect(body.data).toEqual(suggestions);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getSuggestionsMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (GET as any)({ orgId, params: { serviceId }, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("POST", () => {
    it("adds a suggestion with partId, quantity, notes", async () => {
      const suggestion = {
        id: suggestionId,
        service_id: serviceId,
        part_id: "part-1",
        quantity: 2,
        notes: "Use premium",
      };
      addSuggestionMock.mockResolvedValue(suggestion);

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({
          partId: "part-1",
          quantity: 2,
          notes: "Use premium",
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        params: { serviceId },
        supabase: {},
        user: { id: "user-1" },
      });
      const body = await response.json();

      expect(addSuggestionMock).toHaveBeenCalledWith(
        {},
        orgId,
        serviceId,
        { partId: "part-1", quantity: 2, notes: "Use premium" },
        "user-1",
      );
      expect(body.data).toEqual(suggestion);
      expect(response.status).toBe(201);
    });

    it("handles service error", async () => {
      addSuggestionMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ partId: "part-1" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({
          request,
          orgId,
          params: { serviceId },
          supabase: {},
          user: { id: "user-1" },
        }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("DELETE", () => {
    it("deletes a suggestion by query param id", async () => {
      removeSuggestionMock.mockResolvedValue(undefined);

      const response = await (DELETE as any)({
        request: new NextRequest(`${baseUrl}?id=${suggestionId}`, {
          method: "DELETE",
        }),
        orgId,
        params: { serviceId },
        supabase: {},
      });
      const body = await response.json();

      expect(removeSuggestionMock).toHaveBeenCalledWith(
        {},
        orgId,
        suggestionId,
      );
      expect(body.data).toBeNull();
      expect(response.status).toBe(200);
    });

    it("returns 400 when id query param is missing", async () => {
      const response = await (DELETE as any)({
        request: new NextRequest(baseUrl, { method: "DELETE" }),
        orgId,
        params: { serviceId },
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("validation_error");
    });

    it("handles not found error", async () => {
      removeSuggestionMock.mockRejectedValue(new Error("Not found"));

      await expect(
        (DELETE as any)({
          request: new NextRequest(`${baseUrl}?id=nonexistent`, {
            method: "DELETE",
          }),
          orgId,
          params: { serviceId },
          supabase: {},
        }),
      ).rejects.toThrow("Not found");
    });
  });
});
