import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getExpensesMock = vi.fn();
const getExpenseStatsMock = vi.fn();
const createExpenseMock = vi.fn();

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
  createExpense: createExpenseMock,
  getExpenseStats: getExpenseStatsMock,
  getExpenses: getExpensesMock,
}));

const { GET, POST } = await import("./route");

interface HandlerContext {
  request: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
  user?: { id: string };
}

describe("organizations/[id]/expenses route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/expenses`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns expense stats when type=stats", async () => {
      const stats = { total: 1000, count: 5 };
      getExpenseStatsMock.mockResolvedValue(stats);

      const req = new NextRequest(
        new URL(`${baseUrl}?type=stats&branch_id=br-1`),
      );
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await GET(context);
      const body = await response.json();

      expect(getExpenseStatsMock).toHaveBeenCalledWith({}, orgId, "br-1");
      expect(body.data).toEqual(stats);
    });

    it("returns expense stats with branchId param", async () => {
      const stats = { total: 500, count: 3 };
      getExpenseStatsMock.mockResolvedValue(stats);

      const req = new NextRequest(
        new URL(`${baseUrl}?type=stats&branchId=br-2`),
      );
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await GET(context);
      const body = await response.json();

      expect(getExpenseStatsMock).toHaveBeenCalledWith({}, orgId, "br-2");
      expect(body.data).toEqual(stats);
    });

    it("returns expenses list with filters", async () => {
      const expenses = [{ id: "exp-1", amount: 100 }];
      getExpensesMock.mockResolvedValue(expenses);

      const req = new NextRequest(
        new URL(
          `${baseUrl}?q=oil&categoryId=cat-1&startDate=2024-01-01&endDate=2024-12-31&paid=true&limit=10&offset=0&overdue=true&branch_id=br-1`,
        ),
      );
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await GET(context);
      const body = await response.json();

      expect(getExpensesMock).toHaveBeenCalledWith({}, orgId, {
        search: "oil",
        categoryId: "cat-1",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        paid: true,
        limit: 10,
        offset: 0,
        overdue: true,
        branchId: "br-1",
      });
      expect(body.data).toEqual(expenses);
    });

    it("returns expenses without optional filters", async () => {
      const expenses = [{ id: "exp-1" }];
      getExpensesMock.mockResolvedValue(expenses);

      const req = new NextRequest(new URL(baseUrl));
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await GET(context);
      const body = await response.json();

      expect(getExpensesMock).toHaveBeenCalledWith({}, orgId, {
        search: undefined,
        categoryId: undefined,
        startDate: undefined,
        endDate: undefined,
        paid: undefined,
        limit: undefined,
        offset: undefined,
        overdue: undefined,
        branchId: undefined,
      });
      expect(body.data).toEqual(expenses);
    });

    it("handles service error", async () => {
      getExpensesMock.mockRejectedValue(new Error("Fetch error"));

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
    const body = { description: "Oil change", amount: 100 };

    it("creates expense and returns 201", async () => {
      const expense = { id: "exp-1", ...body };
      createExpenseMock.mockResolvedValue(expense);

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

      expect(createExpenseMock).toHaveBeenCalledWith({}, orgId, body, user.id);
      expect(responseBody.data).toEqual(expense);
    });

    it("handles service error", async () => {
      createExpenseMock.mockRejectedValue(new Error("Create error"));

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
