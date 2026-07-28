import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getPartCategoriesMock = vi.fn();
const createPartCategoryMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
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

vi.mock("@/lib/services/inventory-service", () => ({
  getPartCategories: getPartCategoriesMock,
  createPartCategory: createPartCategoryMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/part-categories route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/part-categories`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns part categories on success", async () => {
      const categories = [{ id: "cat-1", name: "Brakes" }];
      getPartCategoriesMock.mockResolvedValue(categories);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({ supabase, orgId });
      const body = await response.json();

      expect(getPartCategoriesMock).toHaveBeenCalledWith(supabase, orgId);
      expect(body.data).toEqual(categories);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getPartCategoriesMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      await expect((GET as any)({ supabase, orgId })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("creates a part category", async () => {
      const category = { id: "cat-1", name: "Brakes" };
      createPartCategoryMock.mockResolvedValue(category);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Brakes" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const body = await response.json();

      expect(createPartCategoryMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "Brakes",
        user.id,
      );
      expect(body.data).toEqual(category);
      expect(response.status).toBe(201);
    });

    it("returns 400 when name is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const body = await response.json();

      expect(createPartCategoryMock).not.toHaveBeenCalled();
      expect(body.error).toEqual({
        code: "BAD_REQUEST",
        message: "Category name is required",
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 when name is empty string", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const body = await response.json();

      expect(createPartCategoryMock).not.toHaveBeenCalled();
      expect(body.error).toEqual({
        code: "BAD_REQUEST",
        message: "Category name is required",
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 when name is whitespace only", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "   " }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const body = await response.json();

      expect(createPartCategoryMock).not.toHaveBeenCalled();
      expect(body.error).toEqual({
        code: "BAD_REQUEST",
        message: "Category name is required",
      });
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      createPartCategoryMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Brakes" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("DB error");
    });
  });
});
