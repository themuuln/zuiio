import { z } from "zod";
import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import {
  bulkGenerateVariants,
  createItemVariant,
  createVariantGroup,
  createVariantOption,
  deleteItemVariant,
  deleteVariantGroup,
  deleteVariantOption,
  getItemVariants,
  getVariantGroup,
  getVariantGroups,
  getVariantOption,
  getVariantOptions,
  updateItemVariant,
  updateVariantGroup,
  updateVariantOption,
} from "@/lib/services/catalog-variant-service";

/** Zod schema for the dispatcher body — validates action + common fields. */
const CatalogVariantBody = z
  .object({
    action: z.string(),
    id: z.string().optional(),
    name: z.string().optional(),
    name_mn: z.string().optional(),
    applies_to: z.enum(["service", "part", "both"]).optional(),
    sort_order: z.number().optional(),
    group_id: z.string().optional(),
    label: z.string().optional(),
    label_mn: z.string().optional(),
    entity_type: z.enum(["service", "part"]).optional(),
    entity_id: z.string().optional(),
    variant_label: z.string().optional(),
    variant_data: z.record(z.string(), z.string()).optional(),
    price: z.number().optional(),
    cost: z.number().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    is_active: z.boolean().optional(),
    dimension_options: z.record(z.string(), z.array(z.string())).optional(),
    get_price: z.record(z.string(), z.number()).optional(),
  })
  .passthrough();

/**
 * POST /api/organizations/:id/catalog-variants
 *
 * Dispatches based on `action` in the body:
 *
 * Groups:
 *   { action: "list-groups" }
 *   { action: "get-group", id: "..." }
 *   { action: "create-group", name: "...", applies_to: "service|part|both" }
 *   { action: "update-group", id: "...", name: "..." }
 *   { action: "delete-group", id: "..." }
 *
 * Options:
 *   { action: "list-options", group_id?: "..." }
 *   { action: "get-option", id: "..." }
 *   { action: "create-option", group_id: "...", label: "..." }
 *   { action: "update-option", id: "...", label: "..." }
 *   { action: "delete-option", id: "..." }
 *
 * Item Variants:
 *   { action: "list-items", entity_type: "service|part", entity_id: "..." }
 *   { action: "create-item", entity_type: "...", entity_id: "...", ... }
 *   { action: "update-item", id: "...", ... }
 *   { action: "delete-item", id: "..." }
 *   { action: "bulk-items", entity_type: "...", entity_id: "...", dimension_options: {...} }
 */
export const POST = createRouteHandler(
  async ({ request, orgId, supabase, user }) => {
    const parsed = CatalogVariantBody.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!parsed.success || !parsed.data.action) {
      return apiError("INVALID_BODY", "Missing or invalid 'action' field", 400);
    }
    const body = parsed.data;

    switch (body.action) {
      // ── Groups ──
      case "list-groups": {
        const appliesTo = body.applies_to;
        const groups = await getVariantGroups(supabase, orgId, appliesTo);
        return ok(groups);
      }

      case "get-group": {
        if (!body.id) return apiError("INVALID_BODY", "Missing 'id'", 400);
        const group = await getVariantGroup(supabase, body.id);
        return ok(group);
      }

      case "create-group": {
        if (!body.name || !body.applies_to)
          return apiError(
            "INVALID_BODY",
            "Missing 'name' or 'applies_to'",
            400,
          );
        const group = await createVariantGroup(supabase, orgId, {
          name: body.name,
          name_mn: body.name_mn,
          applies_to: body.applies_to,
          sort_order: body.sort_order,
        });
        return created(group);
      }

      case "update-group": {
        if (!body.id) return apiError("INVALID_BODY", "Missing 'id'", 400);
        const group = await updateVariantGroup(supabase, body.id, orgId, {
          name: body.name,
          name_mn: body.name_mn,
          applies_to: body.applies_to,
          sort_order: body.sort_order,
        });
        return ok(group);
      }

      case "delete-group": {
        if (!body.id) return apiError("INVALID_BODY", "Missing 'id'", 400);
        await deleteVariantGroup(supabase, body.id, orgId);
        return ok(null);
      }

      // ── Options ──
      case "list-options": {
        const options = await getVariantOptions(supabase, orgId, body.group_id);
        return ok(options);
      }

      case "get-option": {
        if (!body.id) return apiError("INVALID_BODY", "Missing 'id'", 400);
        const option = await getVariantOption(supabase, body.id);
        return ok(option);
      }

      case "create-option": {
        if (!body.group_id || !body.label)
          return apiError("INVALID_BODY", "Missing 'group_id' or 'label'", 400);
        const option = await createVariantOption(supabase, orgId, {
          group_id: body.group_id,
          label: body.label,
          label_mn: body.label_mn,
          sort_order: body.sort_order,
        });
        return created(option);
      }

      case "update-option": {
        if (!body.id) return apiError("INVALID_BODY", "Missing 'id'", 400);
        const option = await updateVariantOption(supabase, body.id, orgId, {
          label: body.label,
          label_mn: body.label_mn,
          sort_order: body.sort_order,
        });
        return ok(option);
      }

      case "delete-option": {
        if (!body.id) return apiError("INVALID_BODY", "Missing 'id'", 400);
        await deleteVariantOption(supabase, body.id, orgId);
        return ok(null);
      }

      // ── Item Variants ──
      case "list-items": {
        if (!body.entity_id)
          return apiError("INVALID_BODY", "Missing 'entity_id'", 400);
        const items = await getItemVariants(
          supabase,
          orgId,
          body.entity_type ?? "service",
          body.entity_id,
        );
        return ok(items);
      }

      case "create-item": {
        if (!body.entity_type || !body.entity_id || !body.variant_label)
          return apiError(
            "INVALID_BODY",
            "Missing 'entity_type', 'entity_id', or 'variant_label'",
            400,
          );
        const item = await createItemVariant(
          supabase,
          orgId,
          {
            entity_type: body.entity_type,
            entity_id: body.entity_id,
            variant_label: body.variant_label,
            variant_data: body.variant_data ?? {},
            price: body.price,
            cost: body.cost,
            sku: body.sku,
            barcode: body.barcode,
            sort_order: body.sort_order,
          },
          user?.id ?? null,
        );
        return created(item);
      }

      case "update-item": {
        if (!body.id) return apiError("INVALID_BODY", "Missing 'id'", 400);
        const item = await updateItemVariant(
          supabase,
          body.id,
          orgId,
          {
            variant_label: body.variant_label,
            variant_data: body.variant_data,
            price: body.price,
            cost: body.cost,
            sku: body.sku,
            barcode: body.barcode,
            is_active: body.is_active,
            sort_order: body.sort_order,
          },
          user?.id ?? null,
        );
        return ok(item);
      }

      case "delete-item": {
        if (!body.id) return apiError("INVALID_BODY", "Missing 'id'", 400);
        await deleteItemVariant(supabase, body.id, orgId, user?.id ?? null);
        return ok(null);
      }

      case "bulk-items": {
        if (!body.entity_type || !body.entity_id || !body.dimension_options)
          return apiError(
            "INVALID_BODY",
            "Missing 'entity_type', 'entity_id', or 'dimension_options'",
            400,
          );
        const items = await bulkGenerateVariants(
          supabase,
          orgId,
          body.entity_type,
          body.entity_id,
          body.dimension_options,
          body.get_price ? createPriceCallback(body.get_price) : undefined,
          user?.id ?? null,
        );
        return ok(items);
      }

      default:
        return apiError(
          "BAD_REQUEST",
          `Unknown action: ${String(body.action)}`,
          400,
        );
    }
  },
);

/**
 * Convert a JSON price mapping to a callback for bulkGenerateVariants.
 * The mapping can be:
 *   - { "Small": 45000, "Large": 65000 } for single-dimension
 *   - { "Small + Basic": 45000, "Small + Wax": 60000 } for multi-dimension
 */
function createPriceCallback(
  priceMap: Record<string, number>,
): (combo: Record<string, string>) => number | null {
  return (combination: Record<string, string>) => {
    const label = Object.values(combination).join(" + ");
    return priceMap[label] ?? null;
  };
}
