import { getDb } from "@/lib/db";
import { loadPricingContext, quotePackage } from "@/lib/pricing/quote";
import { CatalogTable } from "./_table";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const db = getDb();
  const [packages, regions, ctx] = await Promise.all([
    db.listPackages(),
    db.listRegions(false),
    loadPricingContext(),
  ]);
  const regionById = new Map(regions.map((r) => [r.id, r]));

  const rows = packages
    .map((pkg) => ({
      id: pkg.id,
      providerPackageId: pkg.provider_package_id,
      name: pkg.name,
      regionName: regionById.get(pkg.region_id)?.name_en ?? "?",
      costUsd: Number(pkg.cost_usd),
      retailMnt: pkg.is_archived ? null : quotePackage(pkg, ctx).retailMnt,
      isEnabled: pkg.is_enabled,
      isArchived: pkg.is_archived,
      needsRepricing: pkg.needs_repricing,
    }))
    .sort((a, b) =>
      `${a.regionName}${a.costUsd}`.localeCompare(
        `${b.regionName}${b.costUsd}`,
      ),
    );

  return <CatalogTable rows={rows} />;
}
