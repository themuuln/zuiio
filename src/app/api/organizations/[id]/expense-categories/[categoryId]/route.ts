import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { updateExpenseCategory, deleteExpenseCategory } from "@/lib/services/expense-service";

export const PATCH = createRouteHandler(async ({ request, orgId, params, user }) => {
  const { categoryId } = params;
  const body = await request.json();
  const category = await updateExpenseCategory(categoryId, orgId, body, user.id);
  return NextResponse.json({ data: category });
});

export const DELETE = createRouteHandler(async ({ orgId, params, user }) => {
  const { categoryId } = params;
  await deleteExpenseCategory(categoryId, orgId, user.id);
  return NextResponse.json({ data: null });
});
