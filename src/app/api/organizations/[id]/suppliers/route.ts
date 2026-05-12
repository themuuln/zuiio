import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import {
  createSupplier,
  getSuppliers,
} from "@/lib/services/inventory-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/organizations/[id]/suppliers
 * Lists all active suppliers for the organization.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId } = await context.params;
    const suppliers = await getSuppliers(orgId);
    return NextResponse.json({ data: suppliers });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/organizations/[id]/suppliers
 * Creates a new supplier.
 * Body: { name, contactPerson?, phone?, email?, address?, taxId?, paymentTerms?, notes? }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    const { id: orgId } = await context.params;
    const body = await request.json();
    const supplier = await createSupplier(orgId, body, user.id);
    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
