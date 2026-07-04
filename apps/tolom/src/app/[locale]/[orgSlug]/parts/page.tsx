import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { StorefrontPage } from "./_components/storefront-page";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

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

type VehicleModelJoin = {
  id: string;
  make: string;
  model: string;
  generation: string | null;
  year_start: number | null;
  year_end: number | null;
  is_active: boolean | null;
  deleted_at: string | null;
  organization_id: string | null;
};

type PartsCatalogJoin = {
  id: string;
  name: string;
  name_mn: string | null;
  part_number: string | null;
  category: string | null;
  default_price: number | null;
  is_active: boolean | null;
  deleted_at: string | null;
  image_url: string | null;
};

type CatalogData = {
  org: OrgInfo;
  brands: BrandInfo[];
  models: ModelInfo[];
  parts: PartInfo[];
};

async function fetchCatalog(slug: string): Promise<CatalogData | null> {
  const supabase = await createServiceRoleClient();

  // 1. Look up org
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (orgError || !org) return null;

  const orgId = org.id;

  // 2. Fetch vehicle_model_parts with joins
  const { data: vehicleModels } = await supabase
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

  // 3. Fetch inventory balances
  const partIds = [
    ...new Set(
      (vehicleModels ?? []).map((r: { part_id: string }) => r.part_id),
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
  // 4. Build response
  const makeSet = new Map<string, Map<string, ModelInfo>>();
  const modelSet = new Map<string, ModelInfo>();
  const parts: PartInfo[] = [];
  for (const row of vehicleModels ?? []) {
    const vm = row.vehicle_models as VehicleModelJoin;
    const part = row.parts_catalog as PartsCatalogJoin;
    if (!vm?.is_active || vm?.deleted_at) continue;
    if (!part?.is_active || part?.deleted_at) continue;

    if (!makeSet.has(vm.make)) makeSet.set(vm.make, new Map());
    const modelMap = makeSet.get(vm.make) ?? new Map();
    if (!modelMap.has(vm.id)) {
      modelMap.set(vm.id, {
        id: vm.id,
        make: vm.make,
        model: vm.model,
        generation: vm.generation,
        year_start: vm.year_start,
        year_end: vm.year_end,
        part_count: 0,
      });
    }
    const modelMapEntry = modelMap.get(vm.id)!;
    modelMapEntry.part_count++;

    if (!modelSet.has(vm.id)) {
      modelSet.set(vm.id, {
        id: vm.id,
        make: vm.make,
        model: vm.model,
        generation: vm.generation,
        year_start: vm.year_start,
        year_end: vm.year_end,
        part_count: 0,
      });
    }
    const modelSetEntry = modelSet.get(vm.id)!;
    modelSetEntry.part_count++;

    const price = row.specific_price ?? part.default_price;
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
    brands.push({ make, model_count: modelMap.size });
  }
  brands.sort((a, b) => a.make.localeCompare(b.make));

  const models: ModelInfo[] = [...modelSet.values()].sort(
    (a: ModelInfo, b: ModelInfo) =>
      a.make.localeCompare(b.make) || a.model.localeCompare(b.model),
  );

  return {
    org: { id: org.id, name: org.name, slug: org.slug, logo_url: org.logo_url },
    brands,
    models,
    parts,
  };
}

export default async function StorefrontRoute({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const data = await fetchCatalog(orgSlug);

  if (!data) {
    notFound();
  }

  return (
    <StorefrontPage
      org={data.org}
      brands={data.brands}
      models={data.models}
      parts={data.parts}
    />
  );
}
