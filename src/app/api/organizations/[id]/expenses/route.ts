import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createExpense,
  getExpenseStats,
  getExpenses,
} from "@/lib/services/expense-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const branchId =
      searchParams.get("branch_id") ?? searchParams.get("branchId") ?? undefined;

    if (type === "stats") {
      const stats = await getExpenseStats(supabase, orgId, branchId);
      return NextResponse.json({ data: stats });
    }

    const q = searchParams.get("q") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const paidParam = searchParams.get("paid");
    const paid =
      paidParam === "true" ? true : paidParam === "false" ? false : undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;
    const offset = searchParams.get("offset")
      ? Number(searchParams.get("offset"))
      : undefined;
    const overdue = searchParams.get("overdue") === "true" ? true : undefined;

    const expenses = await getExpenses(supabase, orgId, {
      search: q,
      categoryId,
      startDate,
      endDate,
      paid,
      limit,
      offset,
      overdue,
      branchId,
    });
    return NextResponse.json({ data: expenses });
  },
  { requiredPermission: { resource: "expenses", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
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
    const body = await request.json();
    const expense = await createExpense(supabase, orgId, body, user.id);
    return NextResponse.json({ data: expense }, { status: 201 });
  },
  { requiredPermission: { resource: "expenses", action: "create" } },
);
