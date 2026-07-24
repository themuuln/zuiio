import { createClient } from "@supabase/supabase-js";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { reportServerError } from "@/lib/sentry-report-server";

interface VehicleModelRow {
  id: string;
  make: string;
  model: string;
  generation: string | null;
  year_start: number | null;
  year_end: number | null;
  is_active: boolean;
  deleted_at: string | null;
}

interface PartsCatalogRow {
  id: string;
  name: string;
  name_mn: string | null;
  part_number: string | null;
  category: string | null;
  default_price: number | null;
  is_active: boolean;
  deleted_at: string | null;
  image_url: string | null;
}

type OrgInfo = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type BrandInfo = {
  make: string;
  model_count: number;
};

type ModelInfo = {
  id: string;
  make: string;
  model: string;
  generation: string | null;
  year_start: number | null;
  year_end: number | null;
  part_count: number;
};

type PartInfo = {
  id: string;
  name: string;
  name_mn: string | null;
  part_number: string | null;
  category: string | null;
  price: number | null;
  in_stock: boolean;
  image_url: string | null;
  vehicle_model_id: string;
};

type CatalogResponse = {
  org: OrgInfo;
  brands: BrandInfo[];
  models: ModelInfo[];
  parts: PartInfo[];
};

export const GET = createSimpleRouteHandler(
  async ({ request }) => {
    const slug = request.nextUrl.pathname.split("/").at(-2);

    if (!slug) {
      return apiError("NOT_FOUND", "Organization slug is required", 404);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      reportServerError("[public/orgs/parts] Missing env vars");
      return apiError("CONFIG_ERROR", "Configuration error", 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // 1. Look up the organization by slug
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug, logo_url")
      .eq("slug", slug)
      .eq("is_active", true)
      .is("deleted_at", null)
      .single();

    if (orgError || !org) {
      return apiError("NOT_FOUND", "Organization not found", 404);
    }

    const orgId = org.id;

    // 2. Fetch vehicle models that have parts assigned (via vehicle_model_parts)
    const { data: vehicleModels, error: vmError } = await supabase
      .from("vehicle_model_parts")
      .select(`
      vehicle_model_id,
      vehicle_models!inner (
        id, make, model, generation, year_start, year_end, is_active, deleted_at, organization_id
      ),
      part_id,
      specific_price,
      parts_catalog!inner (
        id, name, name_mn, part_number, category, default_price, is_active, deleted_at, image_url
      )
    `)
      .eq("organization_id", orgId);

    if (vmError) {
      reportServerError(
        "[public/orgs/parts] vehicle_model_parts query error:",
        vmError,
      );
      return apiError("CATALOG_ERROR", "Failed to fetch catalog", 500);
    }

    // 3. Fetch inventory balances for all parts in this org
    const partIds = [
      ...new Set(
        (vehicleModels ?? []).map(
          (r: Record<string, unknown>) => r.part_id as string,
        ),
      ),
    ];

    const balanceMap = new Map<string, boolean>();
    if (partIds.length > 0) {
      const { data: balances } = await supabase
        .from("inventory_balances")
        .select("part_id, quantity_on_hand")
        .eq("organization_id", orgId)
        .in("part_id", partIds);

      for (const b of balances ?? []) {
        const current = balanceMap.get(b.part_id) ?? false;
        balanceMap.set(b.part_id, current || (b.quantity_on_hand ?? 0) > 0);
      }
    }

    // 4. Build the response structures
    const makeSet = new Map<string, Map<string, ModelInfo>>();
    const modelSet = new Map<string, ModelInfo>();
    const parts: PartInfo[] = [];

    for (const row of vehicleModels ?? []) {
      const vm = row.vehicle_models as unknown as VehicleModelRow;
      const part = row.parts_catalog as unknown as PartsCatalogRow;

      // Skip inactive or deleted records
      if (!vm?.is_active || vm?.deleted_at) continue;
      if (!part?.is_active || part?.deleted_at) continue;

      // Brand aggregation
      let modelMap = makeSet.get(vm.make);
      if (!modelMap) {
        modelMap = new Map();
        makeSet.set(vm.make, modelMap);
      }
      let entry = modelMap.get(vm.id);
      if (!entry) {
        entry = {
          id: vm.id,
          make: vm.make,
          model: vm.model,
          generation: vm.generation,
          year_start: vm.year_start,
          year_end: vm.year_end,
          part_count: 0,
        };
        modelMap.set(vm.id, entry);
      }
      entry.part_count++;

      // Model aggregation (deduplicated)
      let modelEntry = modelSet.get(vm.id);
      if (!modelEntry) {
        modelEntry = {
          id: vm.id,
          make: vm.make,
          model: vm.model,
          generation: vm.generation,
          year_start: vm.year_start,
          year_end: vm.year_end,
          part_count: 0,
        };
        modelSet.set(vm.id, modelEntry);
      }
      modelEntry.part_count++;

      // Parts with pricing logic
      const price =
        ((row as Record<string, unknown>).specific_price as number | null) ??
        part.default_price;
      const inStock = balanceMap.get(part.id) ?? false;

      parts.push({
        id: part.id,
        name: part.name,
        name_mn: part.name_mn,
        part_number: part.part_number,
        category: part.category,
        price,
        in_stock: inStock,
        image_url: part.image_url ?? null,
        vehicle_model_id: vm.id,
      });
    }

    const brands: BrandInfo[] = [];
    for (const [make, modelMap] of makeSet) {
      brands.push({
        make,
        model_count: modelMap.size,
      });
    }
    brands.sort((a, b) => a.make.localeCompare(b.make));

    const models: ModelInfo[] = [...modelSet.values()].sort(
      (a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model),
    );

    const response: CatalogResponse = {
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo_url: org.logo_url,
      },
      brands,
      models,
      parts,
    };

    return ok(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  },
  { requireAuth: false },
);
