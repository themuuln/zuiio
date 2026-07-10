import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "@/lib/services/supplier-service";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const suppliers = await getSuppliers(supabase, orgId);
    return ok(suppliers);
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const supplier = await createSupplier(supabase, orgId, body, user.id);
    return created(supplier);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("supplierId") ?? searchParams.get("id");
    if (!itemId) {
      return apiError("VALIDATION", "supplierId required", 400);
    }
    const body = await request.json();
    const supplier = await updateSupplier(supabase, itemId, orgId, body);
    return ok(supplier);
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("supplierId") ?? searchParams.get("id");
    if (!itemId) {
      return apiError("VALIDATION", "supplierId required", 400);
    }
    await deleteSupplier(supabase, itemId, orgId);
    return ok({ success: true });
  },
  { rateLimit: true, subscription: true },
);
