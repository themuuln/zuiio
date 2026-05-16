import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { getExpense, updateExpense, deleteExpense } from "@/lib/services/expense-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { expenseId } = params;
  const expense = await getExpense(expenseId, orgId);
  return NextResponse.json({ data: expense });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const { expenseId } = params;
  const body = await request.json();
  const expense = await updateExpense(expenseId, orgId, body, user.id);
  return NextResponse.json({ data: expense });
});

export const DELETE = createRouteHandler(async ({ orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const { expenseId } = params;
  await deleteExpense(expenseId, orgId, user.id);
  return NextResponse.json({ data: null });
});
