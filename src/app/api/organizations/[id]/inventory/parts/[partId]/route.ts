import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import {
  deletePart,
  getPart,
  updatePart,
} from "@/lib/services/inventory-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string; partId: string }> };

/**
 * GET /api/organizations/[id]/inventory/parts/[partId]
 * Returns a single part from the parts catalog.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId, partId } = await context.params;
    const part = await getPart(partId);
    return NextResponse.json({ data: part });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/organizations/[id]/inventory/parts/[partId]
 * Updates a part. Send only the fields to change.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId, partId } = await context.params;
    const body = await request.json();
    const part = await updatePart(partId, orgId, body);
    return NextResponse.json({ data: part });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/organizations/[id]/inventory/parts/[partId]
 * Soft-deletes a part from the catalog.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId, partId } = await context.params;
    await deletePart(partId, orgId);
    return NextResponse.json({ data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
