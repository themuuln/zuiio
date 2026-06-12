import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateExpenseCategoryMock = vi.fn();
const deleteExpenseCategoryMock = vi.fn();
const requireActiveSubscriptionMock = vi.fn();
const mutationRateLimiterCheckMock = vi.fn(() => ({
  allowed: true,
  resetAt: Date.now() + 1000,
}));

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/expense-service", () => ({
  updateExpenseCategory: updateExpenseCategoryMock,
  deleteExpenseCategory: deleteExpenseCategoryMock,
}));

vi.mock("@/lib/services/subscription-enforcement", () => ({
  requireActiveSubscription: requireActiveSubscriptionMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: {
    check: mutationRateLimiterCheckMock,
  },
}));

const { PATCH, DELETE } = await import("./route");

describe("expense-categories/[categoryId] route", () => {
  const supabase = { client: "supabase" };
  const user = { id: "user-1" };
  const orgId = "org-1";
  const categoryId = "cat-1";

  beforeEach(() => {
    vi.clearAllMocks();
    mutationRateLimiterCheckMock.mockReturnValue({
      allowed: true,
      resetAt: Date.now() + 1000,
    });
  });

  it("passes supabase into updateExpenseCategory", async () => {
    updateExpenseCategoryMock.mockResolvedValue({
      id: categoryId,
      name: "Fuel",
    });
    const request = new NextRequest(
      `http://localhost/api/organizations/${orgId}/expense-categories/${categoryId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name: "Fuel" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await (PATCH as any)({
      request,
      orgId,
      params: { categoryId },
      user,
      supabase,
    });
    const body = await response.json();

    expect(requireActiveSubscriptionMock).toHaveBeenCalledWith(orgId);
    expect(updateExpenseCategoryMock).toHaveBeenCalledWith(
      supabase,
      categoryId,
      orgId,
      { name: "Fuel" },
      user.id,
    );
    expect(body.data).toEqual({ id: categoryId, name: "Fuel" });
  });

  it("passes supabase into deleteExpenseCategory", async () => {
    const request = new NextRequest(
      `http://localhost/api/organizations/${orgId}/expense-categories/${categoryId}`,
      { method: "DELETE" },
    );

    const response = await (DELETE as any)({
      request,
      orgId,
      params: { categoryId },
      user,
      supabase,
    });
    const body = await response.json();

    expect(requireActiveSubscriptionMock).toHaveBeenCalledWith(orgId);
    expect(deleteExpenseCategoryMock).toHaveBeenCalledWith(
      supabase,
      categoryId,
      orgId,
      user.id,
    );
    expect(body.data).toBeNull();
  });
});
