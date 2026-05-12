import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import {
  deleteSupplier,
  getSupplier,
  updateSupplier,
} from "@/lib/services/inventory-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string; supplierId: string }> };

/**
 * GET /api/organizations/[id]/suppliers/[supplierId]
 * Returns a single supplier.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId, supplierId } = await context.params;
    const supplier = await getSupplier(supplierId, orgId);
    return NextResponse.json({ data: supplier });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/organizations/[id]/suppliers/[supplierId]
 * Updates a supplier. Send only the fields to change.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId, supplierId } = await context.params;
    const body = await request.json();
    const supplier = await updateSupplier(supplierId, orgId, body);
    return NextResponse.json({ data: supplier });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/organizations/[id]/suppliers/[supplierId]
 * Soft-deletes a supplier.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId, supplierId } = await context.params;
    await deleteSupplier(supplierId, orgId);
    return NextResponse.json({ data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
