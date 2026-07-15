import type {
  EsimProvider,
  EsimUsage,
  ProviderEsimStatus,
  ProviderPackage,
  ProvisionedEsim,
  ProvisionRequest,
  ProvisionResult,
} from "./types";

/**
 * Deterministic mock provider. Everything derives from a hash of the
 * order reference, so the same order always yields the same eSIM —
 * which makes retries, idempotency and tests verifiable.
 */

const SMDP = "rsp.mock.zuiio.dev";

/** Magic package id that always fails provisioning (retryable). */
export const MOCK_FAIL_PACKAGE_ID = "mock-fail-test";

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function digits(seed: number, count: number): string {
  let value = seed;
  let out = "";
  while (out.length < count) {
    value = (Math.imul(value, 1103515245) + 12345) >>> 0;
    out += String(value % 10);
  }
  return out;
}

function token(seed: number, length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = seed;
  let out = "";
  while (out.length < length) {
    value = (Math.imul(value, 1103515245) + 12345) >>> 0;
    out += alphabet[value % alphabet.length];
  }
  return out;
}

interface CatalogSpec {
  regionSlug: string;
  code: string;
  countries: string[];
  /** [dataGb, validityDays, costUsd] — dataGb null = unlimited */
  plans: [number | null, number, number][];
}

const ASIA = ["CN", "JP", "KR", "TH", "VN", "SG", "MY", "PH", "ID", "TW", "HK"];
const EUROPE = [
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "AT",
  "CH",
  "CZ",
  "PL",
  "GR",
  "PT",
  "SE",
  "TR",
  "GB",
];
const GLOBAL = [
  ...new Set([...ASIA, ...EUROPE, "US", "CA", "AU", "NZ", "AE", "IN"]),
];

const CATALOG_SPECS: CatalogSpec[] = [
  {
    regionSlug: "china",
    code: "cn",
    countries: ["CN"],
    plans: [
      [1, 7, 2.5],
      [3, 15, 5.5],
      [5, 30, 8.0],
      [10, 30, 13.5],
      [20, 30, 22.0],
    ],
  },
  {
    regionSlug: "japan",
    code: "jp",
    countries: ["JP"],
    plans: [
      [1, 7, 3.0],
      [3, 15, 6.5],
      [5, 30, 9.5],
      [10, 30, 16.0],
    ],
  },
  {
    regionSlug: "south-korea",
    code: "kr",
    countries: ["KR"],
    plans: [
      [1, 7, 3.0],
      [3, 15, 6.0],
      [5, 30, 9.0],
      [10, 30, 15.0],
    ],
  },
  {
    regionSlug: "thailand",
    code: "th",
    countries: ["TH"],
    plans: [
      [1, 7, 2.5],
      [3, 15, 5.0],
      [10, 30, 12.0],
      [null, 15, 18.0],
    ],
  },
  {
    regionSlug: "vietnam",
    code: "vn",
    countries: ["VN"],
    plans: [
      [1, 7, 2.5],
      [3, 15, 5.0],
      [5, 30, 8.5],
    ],
  },
  {
    regionSlug: "singapore",
    code: "sg",
    countries: ["SG"],
    plans: [
      [1, 7, 3.5],
      [5, 30, 10.0],
    ],
  },
  {
    regionSlug: "turkey",
    code: "tr",
    countries: ["TR"],
    plans: [
      [3, 15, 7.0],
      [10, 30, 17.0],
    ],
  },
  {
    regionSlug: "asia",
    code: "asia",
    countries: ASIA,
    plans: [
      [3, 15, 8.5],
      [5, 30, 12.5],
      [10, 30, 20.0],
    ],
  },
  {
    regionSlug: "europe",
    code: "eu",
    countries: EUROPE,
    plans: [
      [3, 15, 9.0],
      [5, 30, 13.5],
      [10, 30, 21.0],
    ],
  },
  {
    regionSlug: "global",
    code: "global",
    countries: GLOBAL,
    plans: [
      [3, 15, 14.0],
      [10, 30, 30.0],
      [20, 30, 45.0],
    ],
  },
];

function buildCatalog(): ProviderPackage[] {
  const packages: ProviderPackage[] = [];
  for (const spec of CATALOG_SPECS) {
    for (const [dataGb, validityDays, costUsd] of spec.plans) {
      const dataLabel = dataGb === null ? "unlimited" : `${dataGb}gb`;
      packages.push({
        providerPackageId: `mock-${spec.code}-${dataLabel}-${validityDays}d`,
        name:
          dataGb === null
            ? `Unlimited / ${validityDays} days`
            : `${dataGb} GB / ${validityDays} days`,
        regionSlug: spec.regionSlug,
        dataMb: dataGb === null ? null : dataGb * 1024,
        validityDays,
        coverageCountries: spec.countries,
        costUsd,
      });
    }
  }
  return packages;
}

const MOCK_CATALOG = buildCatalog();

function makeEsim(orderRef: string, index: number): ProvisionedEsim {
  const seed = fnv1a(`${orderRef}:${index}`);
  const activationCode = token(seed ^ 0x5f3759df, 24);
  return {
    providerEsimId: `mock-esim-${token(seed, 10).toLowerCase()}`,
    iccid: `8985235${digits(seed, 12)}`,
    smdpAddress: SMDP,
    activationCode,
    lpaString: `LPA:1$${SMDP}$${activationCode}`,
  };
}

function failureRate(): number {
  const raw = Number(process.env.MOCK_PROVIDER_FAILURE_RATE ?? "0");
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 1) : 0;
}

export class MockProvider implements EsimProvider {
  readonly name = "mock";

  async listCatalog(): Promise<ProviderPackage[]> {
    return MOCK_CATALOG;
  }

  async getPackage(providerPackageId: string): Promise<ProviderPackage | null> {
    if (providerPackageId === MOCK_FAIL_PACKAGE_ID) {
      return {
        providerPackageId: MOCK_FAIL_PACKAGE_ID,
        name: "Always-fails test package",
        regionSlug: "global",
        dataMb: 1024,
        validityDays: 7,
        coverageCountries: ["CN"],
        costUsd: 1.0,
      };
    }
    return (
      MOCK_CATALOG.find((p) => p.providerPackageId === providerPackageId) ??
      null
    );
  }

  async provision(req: ProvisionRequest): Promise<ProvisionResult> {
    if (req.providerPackageId === MOCK_FAIL_PACKAGE_ID) {
      return {
        kind: "failed",
        retryable: true,
        error: "mock: forced failure package",
      };
    }

    const rate = failureRate();
    if (rate > 0 && fnv1a(req.orderRef) % 100 < rate * 100) {
      return {
        kind: "failed",
        retryable: true,
        error: `mock: simulated failure (rate=${rate})`,
      };
    }

    if (process.env.MOCK_PROVIDER_ASYNC === "true") {
      return {
        kind: "pending",
        providerOrderId: `mock-order-${token(fnv1a(req.orderRef), 10).toLowerCase()}`,
      };
    }

    const esims = Array.from({ length: req.quantity }, (_, i) =>
      makeEsim(req.orderRef, i),
    );
    return { kind: "delivered", esims };
  }

  async getEsimStatus(providerEsimId: string): Promise<ProviderEsimStatus> {
    // Mock eSIMs are delivered and never expire.
    void providerEsimId;
    return { status: "delivered" };
  }

  async getUsage(providerEsimId: string): Promise<EsimUsage | null> {
    const seed = fnv1a(providerEsimId);
    const totalMb = [1024, 3072, 5120, 10240][seed % 4];
    return {
      usedMb: seed % totalMb,
      totalMb,
      expiresAt: null,
    };
  }

  /** Deterministic esims for a pending (async) order — used by the dev webhook simulator. */
  esimsForOrder(orderRef: string, quantity: number): ProvisionedEsim[] {
    return Array.from({ length: quantity }, (_, i) => makeEsim(orderRef, i));
  }
}
