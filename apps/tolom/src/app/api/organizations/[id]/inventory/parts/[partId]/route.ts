import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deletePart,
  getPart,
  updatePart,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ params, supabase, orgId }) => {
  const { partId } = params;
  const part = await getPart(supabase, partId, orgId);
  return NextResponse.json({ data: part });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { partId } = params;
    const body = await request.json();
    const part = await updatePart(supabase, partId, orgId, body);
    return NextResponse.json({ data: part });
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { partId } = params;
    await deletePart(supabase, partId, orgId);
    return NextResponse.json({ data: null });
  },
  { rateLimit: true, subscription: true },
);
