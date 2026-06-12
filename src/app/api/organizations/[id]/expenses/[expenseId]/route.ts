import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  deleteExpense,
  getExpense,
  updateExpense,
} from "@/lib/services/expense-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { expenseId } = params;
  const expense = await getExpense(supabase, expenseId, orgId);
  return NextResponse.json({ data: expense });
}, { requiredPermission: { resource: "expenses", action: "read" } });

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
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
    const expense = await updateExpense(supabase, expenseId, orgId, body, user.id);
    return NextResponse.json({ data: expense });
  },
  { requiredPermission: { resource: "expenses", action: "update" } },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
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
    await deleteExpense(supabase, expenseId, orgId, user.id);
    return NextResponse.json({ data: null });
  },
  { requiredPermission: { resource: "expenses", action: "delete" } },
);
