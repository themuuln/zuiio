import { createRouteHandler, ok } from "@/lib/api-response";
import {
  getInventoryBalances,
  getPartsCatalog,
  getStockThresholds,
} from "@/lib/services/inventory-service";
import { getMechanicsList } from "@/lib/services/report-service/mechanics";
import { getServices } from "@/lib/services/service-catalog-service";
import type { GlobalPartCatalog, GlobalServiceCatalog } from "@/lib/types";

/**
 * Catalog data endpoint.
 *
 * Returns semi-static data needed by the work order detail drawer:
 * service/parts catalogs, mechanics, inventory data, org settings.
 * This data rarely changes — cache aggressively on the client.
 */
export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const [
      servicesCatalog,
      partsCatalog,
      globalServicesResult,
      globalPartsResult,
      balances,
      thresholds,
      mechanics,
      priceHistoryResult,
      orgSettingsResult,
    ] = await Promise.all([
      // 1. Org service catalog
      getServices(supabase, orgId),

      // 2. Org parts catalog
      getPartsCatalog(supabase, orgId),

      // 3. Global service catalog (no orgId needed)
      supabase
        .from("global_services_catalog")
        .select(
          "id, name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km, is_active",
        )
        .eq("is_active", true)
        .order("category")
        .order("name"),

      // 4. Global parts catalog
      supabase
        .from("global_parts_catalog")
        .select(
          "id, name, name_mn, category, description, part_number, is_active",
        )
        .eq("is_active", true)
        .order("category")
        .order("name"),

      // 5. Inventory balances
      getInventoryBalances(supabase, orgId),

      // 6. Stock thresholds
      getStockThresholds(supabase, orgId),

      // 7. Mechanics list
      getMechanicsList(supabase, orgId),

      // 8. Price history (services + parts)
      (async () => {
        const [servicePrices, partPrices] = await Promise.all([
          supabase
            .from("service_price_history")
            .select(
              "service_catalog_id, service_name, unit_price, vehicle_make, vehicle_model, created_at",
            )
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("part_price_history")
            .select(
              "part_name, unit_price, vehicle_make, vehicle_model, created_at",
            )
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        // Deduplicate services: index by catalog ID AND by name (fallback for global services)
        type PriceEntry = {
          unit_price: number;
          created_at: string;
          last_make?: string;
          last_model?: string;
        };
        const services: Record<string, PriceEntry> = {};
        const seenServices = new Set<string>();
        for (const row of servicePrices.data ?? []) {
          const sid = row.service_catalog_id as string | null;
          const sname = (row.service_name as string | null)?.toLowerCase();
          // Deduplicate: skip if we've already seen this catalog ID or name
          if (sid && seenServices.has(sid)) continue;
          if (sname && seenServices.has(`name:${sname}`)) continue;
          if (sid) seenServices.add(sid);
          if (sname) seenServices.add(`name:${sname}`);
          const entry: PriceEntry = {
            unit_price: Number(row.unit_price),
            created_at: row.created_at,
            last_make: (row.vehicle_make as string) ?? undefined,
            last_model: (row.vehicle_model as string) ?? undefined,
          };
          // Index by catalog ID (primary key)
          if (sid) services[sid] = entry;
          // Index by service name (fallback for null catalog IDs)
          if (sname && !services[sname]) services[sname] = entry;
        }

        // Deduplicate parts: keep only the latest price per part_name (case-insensitive)
        const parts: Record<
          string,
          {
            unit_price: number;
            created_at: string;
            last_make?: string;
            last_model?: string;
          }
        > = {};
        const seenParts = new Set<string>();
        for (const row of partPrices.data ?? []) {
          const pname = (row.part_name as string).toLowerCase();
          if (seenParts.has(pname)) continue;
          seenParts.add(pname);
          parts[pname] = {
            unit_price: Number(row.unit_price),
            created_at: row.created_at,
            last_make: (row.vehicle_make as string) ?? undefined,
            last_model: (row.vehicle_model as string) ?? undefined,
          };
        }

        return { services, parts };
      })(),
      // 9. Org settings — stored in the `settings` JSON column, not as top-level columns
      (async () => {
        const { data } = await supabase
          .from("organizations")
          .select("settings")
          .eq("id", orgId)
          .single();
        const s = (data?.settings ?? {}) as Record<string, unknown>;
        return {
          default_tax_rate: (s.default_tax_rate as number | null) ?? null,
          payment_method_fees:
            (s.payment_method_fees as Record<string, number> | null) ?? null,
          transfer_bank_accounts:
            (s.transfer_bank_accounts as unknown[] | null) ?? null,
        };
      })(),
    ]);

    return ok({
      servicesCatalog,
      partsCatalog,
      globalServices: (globalServicesResult.data ??
        []) as GlobalServiceCatalog[],
      globalParts: (globalPartsResult.data ?? []) as GlobalPartCatalog[],
      balances,
      thresholds,
      mechanics,
      priceMemory: priceHistoryResult,
      orgSettings: orgSettingsResult,
    });
  },
  { subscription: true },
);
