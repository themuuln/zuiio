import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  deleteExpenseCategory,
  updateExpenseCategory,
} from "@/lib/services/expense-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

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
    const { categoryId } = params;
    const body = await request.json();
    const category = await updateExpenseCategory(
      supabase,
      categoryId,
      orgId,
      body,
      user.id,
    );
    return NextResponse.json({ data: category });
  },
  { requiredPermission: { resource: "expense_categories", action: "update" } },
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
    const { categoryId } = params;
    await deleteExpenseCategory(supabase, categoryId, orgId, user.id);
    return NextResponse.json({ data: null });
  },
  { requiredPermission: { resource: "expense_categories", action: "delete" } },
);
