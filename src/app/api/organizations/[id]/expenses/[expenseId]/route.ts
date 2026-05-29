import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/services/expense-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { expenseId } = params;
  const expense = await getExpense(expenseId, orgId);
  return NextResponse.json({ data: expense });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = mutationRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }
    const { expenseId } = params;
    const body = await request.json();
    const expense = await updateExpense(expenseId, orgId, body, user.id);
    return NextResponse.json({ data: expense });
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, user }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = mutationRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }
    const { expenseId } = params;
    await deleteExpense(expenseId, orgId, user.id);
    return NextResponse.json({ data: null });
  },
);
