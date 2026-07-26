import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getPriceRulesMock = vi.fn();
const getPriceRuleMock = vi.fn();
const resolvePriceMock = vi.fn();
const createPriceRuleMock = vi.fn();
const updatePriceRuleMock = vi.fn();
const deletePriceRuleMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/price-rules-service", () => ({
  getPriceRules: getPriceRulesMock,
  getPriceRule: getPriceRuleMock,
  resolvePrice: resolvePriceMock,
  createPriceRule: createPriceRuleMock,
  updatePriceRule: updatePriceRuleMock,
  deletePriceRule: deletePriceRuleMock,
}));

const { GET, POST, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/price-rules route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const listUrl = `http://localhost/api/organizations/${orgId}/price-rules`;

    it("lists price rules for the organization", async () => {
      getPriceRulesMock.mockResolvedValue([{ id: "rule-1", name: "Test Rule" }]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(listUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getPriceRulesMock).toHaveBeenCalledWith(supabase, orgId);
      expect(body.data).toEqual([{ id: "rule-1", name: "Test Rule" }]);
    });

    it("returns a single price rule by id", async () => {
      getPriceRuleMock.mockResolvedValue({ id: "rule-1", name: "Test Rule" });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${listUrl}?id=rule-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getPriceRuleMock).toHaveBeenCalledWith(supabase, "rule-1");
      expect(body.data).toEqual({ id: "rule-1", name: "Test Rule" });
    });

    it("handles service error", async () => {
      getPriceRulesMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(listUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/price-rules`;

    it("creates a price rule", async () => {
      createPriceRuleMock.mockResolvedValue({ id: "rule-1" });
      const body = { name: "Summer Sale", discount: 10 };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(createPriceRuleMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual({ id: "rule-1" });
      expect(response.status).toBe(201);
    });

    it("passes null userId when user is not available", async () => {
      createPriceRuleMock.mockResolvedValue({ id: "rule-1" });
      const body = { name: "Test Rule" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      await (POST as any)({ supabase, orgId, request, user: undefined });

      expect(createPriceRuleMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        body,
        null,
      );
    });

    it("resolves a price", async () => {
      resolvePriceMock.mockResolvedValue({ price: 100 });
      const input = { partId: "part-1" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ action: "resolve", input }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(resolvePriceMock).toHaveBeenCalledWith(supabase, orgId, input);
      expect(data.data).toEqual({ price: 100 });
    });

    it("handles service error on create", async () => {
      createPriceRuleMock.mockRejectedValue(new Error("Validation failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Validation failed");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    const url = `http://localhost/api/organizations/${orgId}/price-rules`;

    it("updates a price rule", async () => {
      updatePriceRuleMock.mockResolvedValue({ id: "rule-1", name: "Updated" });
      const body = { name: "Updated" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?id=rule-1`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(updatePriceRuleMock).toHaveBeenCalledWith(
        supabase,
        "rule-1",
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual({ id: "rule-1", name: "Updated" });
    });

    it("returns error when rule id is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("MISSING_RULE_ID");
      expect(response.status).toBe(400);
    });

    it("handles service error on update", async () => {
      updatePriceRuleMock.mockRejectedValue(new Error("Update failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?id=rule-1`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    const url = `http://localhost/api/organizations/${orgId}/price-rules`;

    it("deletes a price rule", async () => {
      deletePriceRuleMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?id=rule-1`, { method: "DELETE" });
      const response = await (DELETE as any)({ supabase, orgId, request });
      const data = await response.json();

      expect(deletePriceRuleMock).toHaveBeenCalledWith(supabase, "rule-1", orgId);
      expect(data.data).toEqual({ success: true });
    });

    it("returns error when rule id is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, { method: "DELETE" });
      const response = await (DELETE as any)({ supabase, orgId, request });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("MISSING_RULE_ID");
      expect(response.status).toBe(400);
    });

    it("handles service error on delete", async () => {
      deletePriceRuleMock.mockRejectedValue(new Error("Delete failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?id=rule-1`, { method: "DELETE" });
      await expect(
        (DELETE as any)({ supabase, orgId, request }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
