import type { EsimProvider } from "./types";

/**
 * Provider registry — maps provider names to their adapter classes.
 * Enabled providers are controlled by ESIM_PROVIDERS env var (comma-separated).
 * Falls back to ESIM_PROVIDER (single) for backwards compatibility.
 */

type ProviderFactory = () => EsimProvider;

const factories: Record<string, ProviderFactory> = {
  mock: () => {
    // Lazy import to avoid loading real provider deps in mock mode
    const { MockProvider } = require("./mock");
    return new MockProvider();
  },
  firsty: () => {
    const { FirstyProvider } = require("./firsty");
    return new FirstyProvider();
  },
  "citrus-mobile": () => {
    const { CitrusMobileProvider } = require("./citrus-mobile");
    return new CitrusMobileProvider();
  },
  roamic: () => {
    const { RoamicProvider } = require("./roamic");
    return new RoamicProvider();
  },
  bappy: () => {
    const { BappyProvider } = require("./bappy");
    return new BappyProvider();
  },
};

const cache = new Map<string, EsimProvider>();

/**
 * Get a single provider by name. Returns null if unknown.
 */
export function getProviderByName(name: string): EsimProvider | null {
  const cached = cache.get(name);
  if (cached) return cached;

  const factory = factories[name];
  if (!factory) return null;

  const provider = factory();
  cache.set(name, provider);
  return provider;
}

/**
 * Get all enabled providers based on env config.
 * ESIM_PROVIDERS=firsty,citrus-mobile  →  [FirstyProvider, CitrusMobileProvider]
 * Falls back to ESIM_PROVIDER=single-name  →  [that one provider]
 * Always includes "mock" if no real providers are configured.
 */
export function getEnabledProviders(): EsimProvider[] {
  const envList = process.env.ESIM_PROVIDERS;
  const envSingle = process.env.ESIM_PROVIDER;

  let names: string[];
  if (envList) {
    names = envList.split(",").map((n) => n.trim()).filter(Boolean);
  } else if (envSingle) {
    names = [envSingle.trim()];
  } else {
    names = ["mock"];
  }

  const providers: EsimProvider[] = [];
  for (const name of names) {
    const provider = getProviderByName(name);
    if (provider) providers.push(provider);
  }

  // Always include mock if no real providers resolved
  if (providers.length === 0) {
    const mock = getProviderByName("mock");
    if (mock) providers.push(mock);
  }

  return providers;
}

/**
 * List all known provider names (for admin UI / diagnostics).
 */
export function listProviderNames(): string[] {
  return Object.keys(factories);
}
