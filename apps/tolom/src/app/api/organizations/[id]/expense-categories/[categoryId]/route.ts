import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteExpenseCategory,
  updateExpenseCategory,
} from "@/lib/services/expense-service";

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
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
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expense_categories", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { categoryId } = params;
    await deleteExpenseCategory(supabase, categoryId, orgId, user.id);
    return NextResponse.json({ data: null });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expense_categories", action: "delete" },
  },
);
