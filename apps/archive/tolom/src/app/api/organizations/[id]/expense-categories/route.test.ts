import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCategoriesMock = vi.fn();
const createExpenseCategoryMock = vi.fn();
const seedDefaultExpenseCategoriesMock = vi.fn();

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

vi.mock("@/lib/services/expense-service", () => ({
  createExpenseCategory: createExpenseCategoryMock,
  getExpenseCategories: getCategoriesMock,
  seedDefaultExpenseCategories: seedDefaultExpenseCategoriesMock,
}));

const { GET, POST } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  user?: { id: string };
}

describe("organizations/[id]/expense-categories route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/expense-categories`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("seeds defaults and returns categories", async () => {
      const categories = [
        { id: "cat-1", name: "Parts" },
        { id: "cat-2", name: "Labor" },
      ];
      seedDefaultExpenseCategoriesMock.mockResolvedValue(undefined);
      getCategoriesMock.mockResolvedValue(categories);

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      const response = await GET(context);
      const body = await response.json();

      expect(seedDefaultExpenseCategoriesMock).toHaveBeenCalledWith(
        {},
        orgId,
        user.id,
      );
      expect(getCategoriesMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(categories);
    });

    it("handles service error", async () => {
      getCategoriesMock.mockRejectedValue(new Error("Fetch error"));

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        user,
      };
      await expect(GET(context)).rejects.toThrow("Fetch error");
    });
  });

  describe("POST", () => {
    const body = { name: "New Category" };

    it("creates category and returns 201", async () => {
      const category = { id: "cat-1", ...body };
      createExpenseCategoryMock.mockResolvedValue(category);

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

      expect(createExpenseCategoryMock).toHaveBeenCalledWith(
        {},
        orgId,
        body,
        user.id,
      );
      expect(responseBody.data).toEqual(category);
    });

    it("handles service error", async () => {
      createExpenseCategoryMock.mockRejectedValue(new Error("Create error"));

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
