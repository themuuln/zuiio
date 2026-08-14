import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import {
  addSupplierPart,
  getSupplierParts,
  removeSupplierPart,
} from "@/lib/services/supplier-service";

export const GET = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    const { supplierId } = params;
    const parts = await getSupplierParts(supabase, orgId, supplierId);
    return ok(parts);
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { supplierId } = params;
    const body = await request.json();

    if (!body.part_id) {
      return apiError("VALIDATION", "part_id is required", 400);
    }

    const result = await addSupplierPart(
      supabase,
      orgId,
      {
        supplier_id: supplierId,
        part_id: body.part_id,
        supplier_part_number: body.supplier_part_number ?? null,
        unit_cost: body.unit_cost ?? null,
        is_preferred: body.is_preferred ?? false,
        notes: body.notes ?? null,
      },
      user.id,
    );

    return created(result);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");
    if (!itemId) {
      return apiError("VALIDATION", "id required", 400);
    }

    await removeSupplierPart(supabase, orgId, itemId);
    return ok({ success: true });
  },
  { rateLimit: true, subscription: true },
);
