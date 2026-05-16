import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getExpenseCategories as getCategories, createExpenseCategory, seedDefaultExpenseCategories } from "@/lib/services/expense-service";

export const GET = createRouteHandler(async ({ orgId, user }) => {
  await seedDefaultExpenseCategories(orgId, user.id);
  const categories = await getCategories(orgId);
  return NextResponse.json({ data: categories });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const body = await request.json();
  const category = await createExpenseCategory(orgId, body, user.id);
  return NextResponse.json({ data: category }, { status: 201 });
});
