import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createExpense,
  getExpenseStats,
  getExpenses,
} from "@/lib/services/expense-service";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const branchId =
      searchParams.get("branch_id") ??
      searchParams.get("branchId") ??
      undefined;

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
    const body = await request.json();
    const expense = await createExpense(supabase, orgId, body, user.id);
    return NextResponse.json({ data: expense }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expenses", action: "create" },
  },
);
