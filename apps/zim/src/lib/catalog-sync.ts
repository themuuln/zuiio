import "server-only";
import { getDb } from "@/lib/db";
import { getProvider, getEnabledProviders, type EsimProvider } from "@/lib/provider";
import { notifyRepricingNeeded } from "@/lib/telegram";

export interface SyncResult {
  inserted: number;
  updated: number;
  archived: number;
  repriced: string[];
  skippedUnknownRegion: string[];
}

/**
 * Pulls a single provider's catalog and upserts packages by
 * (provider, provider_package_id). Vanished packages are archived +
 * disabled; cost changes flag needs_repricing.
 */
export async function syncCatalogFor(
  provider: EsimProvider,
): Promise<SyncResult> {
  const db = getDb();

  const [catalog, regions, existing] = await Promise.all([
    provider.listCatalog(),
    db.listRegions(false),
    db.listPackages(provider.name),
  ]);

  const regionBySlug = new Map(regions.map((r) => [r.slug, r]));
  const existingById = new Map(existing.map((p) => [p.provider_package_id, p]));

  const result: SyncResult = {
    inserted: 0,
    updated: 0,
    archived: 0,
    repriced: [],
    skippedUnknownRegion: [],
  };
  const now = new Date().toISOString();
  const seenIds = new Set<string>();

  for (const pkg of catalog) {
    const region = regionBySlug.get(pkg.regionSlug);
    if (!region) {
      result.skippedUnknownRegion.push(pkg.providerPackageId);
      continue;
    }
    seenIds.add(pkg.providerPackageId);

    const current = existingById.get(pkg.providerPackageId);
    if (!current) {
      await db.insertPackage({
        provider: provider.name,
        provider_package_id: pkg.providerPackageId,
        region_id: region.id,
        name: pkg.name,
        data_mb: pkg.dataMb,
        is_unlimited: pkg.dataMb === null,
        validity_days: pkg.validityDays,
        coverage_countries: pkg.coverageCountries,
        cost_usd: pkg.costUsd,
        provider_meta: pkg.meta ?? {},
        synced_at: now,
      });
      result.inserted++;
      continue;
    }

    const costChanged = Number(current.cost_usd) !== pkg.costUsd;
    await db.updatePackage(current.id, {
      name: pkg.name,
      region_id: region.id,
      data_mb: pkg.dataMb,
      is_unlimited: pkg.dataMb === null,
      validity_days: pkg.validityDays,
      coverage_countries: pkg.coverageCountries,
      cost_usd: pkg.costUsd,
      provider_meta: pkg.meta ?? {},
      is_archived: false,
      needs_repricing: current.needs_repricing || costChanged,
      synced_at: now,
    });
    result.updated++;
    if (costChanged) result.repriced.push(pkg.providerPackageId);
  }

  for (const pkg of existing) {
    if (!seenIds.has(pkg.provider_package_id) && !pkg.is_archived) {
      await db.updatePackage(pkg.id, {
        is_archived: true,
        is_enabled: false,
        synced_at: now,
      });
      result.archived++;
    }
  }

  if (result.repriced.length > 0) {
    await notifyRepricingNeeded(result.repriced);
  }

  return result;
}
/**
 * Backwards-compatible: sync from the default/legacy provider.
 */
export async function syncCatalog(): Promise<SyncResult> {
  return syncCatalogFor(getProvider());
}


/**
 * Sync catalog from ALL enabled providers.
 * Returns combined results across all providers.
 */
export async function syncAllProviders(): Promise<SyncResult> {
  const providers = getEnabledProviders();
  const combined: SyncResult = {
    inserted: 0,
    updated: 0,
    archived: 0,
    repriced: [],
    skippedUnknownRegion: [],
  };

  for (const provider of providers) {
    const result = await syncCatalogFor(provider);
    combined.inserted += result.inserted;
    combined.updated += result.updated;
    combined.archived += result.archived;
    combined.repriced.push(...result.repriced);
    combined.skippedUnknownRegion.push(...result.skippedUnknownRegion);
  }

  return combined;
}
