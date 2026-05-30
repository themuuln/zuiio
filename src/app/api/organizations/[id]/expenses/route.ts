import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getExpenses,
  createExpense,
  getExpenseStats,
} from "@/lib/services/expense-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "stats") {
    const stats = await getExpenseStats(orgId);
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

  const expenses = await getExpenses(orgId, {
    search: q,
    categoryId,
    startDate,
    endDate,
    paid,
    limit,
    offset,
    overdue,
  });
  return NextResponse.json({ data: expenses });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
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
  const expense = await createExpense(orgId, body, user.id);
  return NextResponse.json({ data: expense }, { status: 201 });
});
