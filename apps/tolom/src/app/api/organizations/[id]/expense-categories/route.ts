import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createExpenseCategory,
  getExpenseCategories as getCategories,
  seedDefaultExpenseCategories,
} from "@/lib/services/expense-service";

export const GET = createRouteHandler(
  async ({ orgId, user, supabase }) => {
    await seedDefaultExpenseCategories(supabase, orgId, user.id);
    const categories = await getCategories(supabase, orgId);
    return NextResponse.json({ data: categories });
  },
  { requiredPermission: { resource: "expense_categories", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const category = await createExpenseCategory(
      supabase,
      orgId,
      body,
      user.id,
    );
    return NextResponse.json({ data: category }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expense_categories", action: "create" },
  },
);
