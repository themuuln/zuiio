import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createPartCategory,
  getPartCategories,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const categories = await getPartCategories(orgId);
  return NextResponse.json({ data: categories });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: { message: "Category name is required" } },
      { status: 400 },
    );
  }
  const category = await createPartCategory(orgId, body.name, user.id);
  return NextResponse.json({ data: category }, { status: 201 });
});
