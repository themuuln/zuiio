import "server-only";
import { syncCatalog } from "@/lib/catalog-sync";
import { getDb } from "@/lib/db";
import { loadPricingContext, quotePackage } from "@/lib/pricing/quote";
import type { RegionRow } from "@/lib/supabase/types";

/**
 * Display-safe DTOs for the storefront. cost_usd never leaves the
 * server — clients only ever see the computed retail price.
 */

export interface DestinationDto {
  slug: string;
  nameEn: string;
  nameMn: string;
  kind: RegionRow["kind"];
  countryCode: string | null;
  packageCount: number;
  /** Cheapest enabled package, integer ₮ */
  fromPriceMnt: number | null;
}

export interface PackageDto {
  id: string;
  name: string;
  regionSlug: string;
  dataMb: number | null;
  isUnlimited: boolean;
  validityDays: number;
  coverageCountries: string[];
  retailMnt: number;
}

/**
 * Dev bootstrap: with the in-memory backend and an empty catalog,
 * sync the mock provider and enable everything so the storefront has
 * data without any manual admin step.
 */
async function ensureDevCatalog(): Promise<void> {
  const db = getDb();
  if (db.backend !== "memory") return;
  const existing = await db.listPackages();
  if (existing.length > 0) return;

  await syncCatalog();
  for (const pkg of await db.listPackages()) {
    await db.updatePackage(pkg.id, { is_enabled: true });
  }
}

export async function getDestinations(): Promise<DestinationDto[]> {
  await ensureDevCatalog();
  const db = getDb();
  const [regions, ctx] = await Promise.all([
    db.listRegions(true),
    loadPricingContext(),
  ]);

  const destinations: DestinationDto[] = [];
  for (const region of regions) {
    const packages = await db.listEnabledPackagesByRegion(region.id);
    const prices = packages.map((p) => quotePackage(p, ctx).retailMnt);
    destinations.push({
      slug: region.slug,
      nameEn: region.name_en,
      nameMn: region.name_mn,
      kind: region.kind,
      countryCode: region.country_code,
      packageCount: packages.length,
      fromPriceMnt: prices.length > 0 ? Math.min(...prices) : null,
    });
  }
  return destinations;
}

export interface RegionPackagesResult {
  region: {
    slug: string;
    nameEn: string;
    nameMn: string;
    countryCode: string | null;
  };
  packages: PackageDto[];
}

export async function getRegionPackages(
  slug: string,
): Promise<RegionPackagesResult | null> {
  await ensureDevCatalog();
  const db = getDb();
  const region = await db.getRegionBySlug(slug);
  if (!region || !region.is_active) return null;

  const [packages, ctx] = await Promise.all([
    db.listEnabledPackagesByRegion(region.id),
    loadPricingContext(),
  ]);

  return {
    region: {
      slug: region.slug,
      nameEn: region.name_en,
      nameMn: region.name_mn,
      countryCode: region.country_code,
    },
    packages: packages
      .map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        regionSlug: region.slug,
        dataMb: pkg.data_mb,
        isUnlimited: pkg.is_unlimited,
        validityDays: pkg.validity_days,
        coverageCountries: pkg.coverage_countries,
        retailMnt: quotePackage(pkg, ctx).retailMnt,
      }))
      .sort((a, b) => a.retailMnt - b.retailMnt),
  };
}

export interface PackageDetailDto extends PackageDto {
  regionNameEn: string;
  regionNameMn: string;
}

export async function getPackageDetail(
  id: string,
): Promise<PackageDetailDto | null> {
  await ensureDevCatalog();
  const db = getDb();
  const pkg = await db.getPackageById(id);
  if (!pkg || !pkg.is_enabled || pkg.is_archived) return null;

  const [regions, ctx] = await Promise.all([
    db.listRegions(false),
    loadPricingContext(),
  ]);
  const region = regions.find((r) => r.id === pkg.region_id);
  if (!region) return null;

  return {
    id: pkg.id,
    name: pkg.name,
    regionSlug: region.slug,
    regionNameEn: region.name_en,
    regionNameMn: region.name_mn,
    dataMb: pkg.data_mb,
    isUnlimited: pkg.is_unlimited,
    validityDays: pkg.validity_days,
    coverageCountries: pkg.coverage_countries,
    retailMnt: quotePackage(pkg, ctx).retailMnt,
  };
}
