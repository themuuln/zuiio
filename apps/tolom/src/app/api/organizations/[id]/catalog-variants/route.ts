import { ok, created, apiError } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
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
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ── Groups ──
      case "list-groups": {
        const appliesTo = body.applies_to as
          | "service"
          | "part"
          | "both"
          | undefined;
        const groups = await getVariantGroups(supabase, orgId, appliesTo);
        return ok(groups);
      }

      case "get-group": {
        const group = await getVariantGroup(supabase, body.id);
        return ok(group);
      }

      case "create-group": {
        const group = await createVariantGroup(supabase, orgId, {
          name: body.name,
          name_mn: body.name_mn,
          applies_to: body.applies_to,
          sort_order: body.sort_order,
        });
        return created(group);
      }

      case "update-group": {
        const group = await updateVariantGroup(supabase, body.id, orgId, {
          name: body.name,
          name_mn: body.name_mn,
          applies_to: body.applies_to,
          sort_order: body.sort_order,
        });
        return ok(group);
      }

      case "delete-group": {
        await deleteVariantGroup(supabase, body.id, orgId);
        return ok(null);
      }

      // ── Options ──
      case "list-options": {
        const options = await getVariantOptions(supabase, orgId, body.group_id);
        return ok(options);
      }

      case "get-option": {
        const option = await getVariantOption(supabase, body.id);
        return ok(option);
      }

      case "create-option": {
        const option = await createVariantOption(supabase, orgId, {
          group_id: body.group_id,
          label: body.label,
          label_mn: body.label_mn,
          sort_order: body.sort_order,
        });
        return created(option);
      }

      case "update-option": {
        const option = await updateVariantOption(supabase, body.id, orgId, {
          label: body.label,
          label_mn: body.label_mn,
          sort_order: body.sort_order,
        });
        return ok(option);
      }

      case "delete-option": {
        await deleteVariantOption(supabase, body.id, orgId);
        return ok(null);
      }

      // ── Item Variants ──
      case "list-items": {
        const items = await getItemVariants(
          supabase,
          orgId,
          body.entity_type as "service" | "part",
          body.entity_id,
        );
        return ok(items);
      }

      case "create-item": {
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
        await deleteItemVariant(supabase, body.id, orgId, user?.id ?? null);
        return ok(null);
      }

      case "bulk-items": {
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
        return apiError("BAD_REQUEST", `Unknown action: ${action}`, 400);
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
