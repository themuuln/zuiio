import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteExpense,
  getExpense,
  updateExpense,
} from "@/lib/services/expense-service";

export const GET = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    const { expenseId } = params;
    const expense = await getExpense(supabase, expenseId, orgId);
    return NextResponse.json({ data: expense });
  },
  { requiredPermission: { resource: "expenses", action: "read" } },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { expenseId } = params;
    const body = await request.json();
    const expense = await updateExpense(
      supabase,
      expenseId,
      orgId,
      body,
      user.id,
    );
    return NextResponse.json({ data: expense });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expenses", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { expenseId } = params;
    await deleteExpense(supabase, expenseId, orgId, user.id);
    return NextResponse.json({ data: null });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expenses", action: "delete" },
  },
);
