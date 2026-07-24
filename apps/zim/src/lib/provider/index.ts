import { getProviderByName, getEnabledProviders } from "./registry";
import type { EsimProvider } from "./types";

export type { EsimProvider, ProviderPackage, ProvisionRequest, ProvisionedEsim, ProvisionResult, ProviderEsimStatus, EsimUsage } from "./types";

/**
 * Legacy single-provider accessor (backwards compatible).
 * Prefers ESIM_PROVIDER env var, falls back to first enabled provider.
 */
let cached: EsimProvider | null = null;
export function getProvider(): EsimProvider {
  if (cached) return cached;

  const name = process.env.ESIM_PROVIDER;
  if (name) {
    const provider = getProviderByName(name);
    if (!provider) throw new Error(`Unknown ESIM_PROVIDER: ${name}`);
    cached = provider;
    return cached;
  }

  // Fall back to first enabled provider
  const providers = getEnabledProviders();
  cached = providers[0]!;
  return cached;
}

/**
 * Get all enabled providers for multi-provider catalog sync.
 */
export { getEnabledProviders, getProviderByName } from "./registry";
