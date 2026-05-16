import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { getExpenses, createExpense, getExpenseStats, seedDefaultExpenseCategories } from "@/lib/services/expense-service";

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
  const paid = searchParams.has("paid") ? searchParams.get("paid") === "true" : undefined;

  const expenses = await getExpenses(orgId, { search: q, categoryId, startDate, endDate, paid });
  return NextResponse.json({ data: expenses });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  await seedDefaultExpenseCategories(orgId, user.id);
  const expense = await createExpense(orgId, body, user.id);
  return NextResponse.json({ data: expense }, { status: 201 });
});
