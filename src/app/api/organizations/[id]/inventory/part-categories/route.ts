import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createPartCategory,
  getPartCategories,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const categories = await getPartCategories(supabase, orgId);
    return NextResponse.json({ data: categories });
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: { message: "Category name is required" } },
        { status: 400 },
      );
    }
    const category = await createPartCategory(
      supabase,
      orgId,
      body.name,
      user.id,
    );
    return NextResponse.json({ data: category }, { status: 201 });
  },
  { requiredPermission: { resource: "inventory", action: "create" } },
);
