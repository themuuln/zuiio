import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getExpenseMock = vi.fn();
const updateExpenseMock = vi.fn();
const deleteExpenseMock = vi.fn();
const requireActiveSubscriptionMock = vi.fn();
const mutationRateLimiterCheckMock = vi.fn(() => ({
  allowed: true,
  resetAt: Date.now() + 1000,
}));

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/expense-service", () => ({
  getExpense: getExpenseMock,
  updateExpense: updateExpenseMock,
  deleteExpense: deleteExpenseMock,
}));

vi.mock("@/lib/services/subscription-enforcement", () => ({
  requireActiveSubscription: requireActiveSubscriptionMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: {
    check: mutationRateLimiterCheckMock,
  },
}));

const { GET, PATCH, DELETE } = await import("./route");

describe("expenses/[expenseId] route", () => {
  const supabase = { client: "supabase" };
  const user = { id: "user-1" };
  const orgId = "org-1";
  const expenseId = "exp-1";

  beforeEach(() => {
    vi.clearAllMocks();
    mutationRateLimiterCheckMock.mockReturnValue({
      allowed: true,
      resetAt: Date.now() + 1000,
    });
  });

  it("passes supabase into getExpense", async () => {
    getExpenseMock.mockResolvedValue({ id: expenseId });

    const response = await (GET as any)({
      request: new NextRequest(
        `http://localhost/api/organizations/${orgId}/expenses/${expenseId}`,
      ),
      orgId,
      params: { expenseId },
      supabase,
    });
    const body = await response.json();

    expect(getExpenseMock).toHaveBeenCalledWith(supabase, expenseId, orgId);
    expect(body.data).toEqual({ id: expenseId });
  });

  it("passes supabase into updateExpense", async () => {
    updateExpenseMock.mockResolvedValue({ id: expenseId, description: "Fuel" });
    const request = new NextRequest(
      `http://localhost/api/organizations/${orgId}/expenses/${expenseId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ description: "Fuel" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await (PATCH as any)({
      request,
      orgId,
      params: { expenseId },
      user,
      supabase,
    });
    const body = await response.json();

    expect(requireActiveSubscriptionMock).toHaveBeenCalledWith(orgId);
    expect(updateExpenseMock).toHaveBeenCalledWith(
      supabase,
      expenseId,
      orgId,
      { description: "Fuel" },
      user.id,
    );
    expect(body.data).toEqual({ id: expenseId, description: "Fuel" });
  });

  it("passes supabase into deleteExpense", async () => {
    const request = new NextRequest(
      `http://localhost/api/organizations/${orgId}/expenses/${expenseId}`,
      { method: "DELETE" },
    );

    const response = await (DELETE as any)({
      request,
      orgId,
      params: { expenseId },
      user,
      supabase,
    });
    const body = await response.json();

    expect(requireActiveSubscriptionMock).toHaveBeenCalledWith(orgId);
    expect(deleteExpenseMock).toHaveBeenCalledWith(
      supabase,
      expenseId,
      orgId,
      user.id,
    );
    expect(body.data).toBeNull();
  });
});
