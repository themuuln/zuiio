import { getEnabledProviders, getProviderByName } from "./registry";
import type { EsimProvider } from "./types";

export type {
  EsimProvider,
  EsimUsage,
  ProviderEsimStatus,
  ProviderPackage,
  ProvisionedEsim,
  ProvisionRequest,
  ProvisionResult,
} from "./types";

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
  const first = providers[0];
  if (!first) throw new Error("No enabled ESIM providers");
  cached = first;
  return cached;
}

/**
 * Get all enabled providers for multi-provider catalog sync.
 */
export { getEnabledProviders, getProviderByName } from "./registry";
