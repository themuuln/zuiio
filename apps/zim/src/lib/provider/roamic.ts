import type {
  EsimProvider,
  EsimUsage,
  ProviderEsimStatus,
  ProviderPackage,
  ProvisionRequest,
  ProvisionResult,
} from "./types";

// ---------------------------------------------------------------------------
// Roamic API response envelope
// ---------------------------------------------------------------------------

interface RoamicEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    count: number;
    offset: number;
    limit: number;
    total: number;
  };
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

// ---------------------------------------------------------------------------
// Catalog types
// ---------------------------------------------------------------------------

interface CatalogItem {
  type: "catalogs";
  id: number;
  attributes: {
    id: number;
    productSku: string;
    productName: string;
    productDescription?: string;
    price: string; // EUR as string e.g. "0.10000"
    currencyKeyword: string;
    unlimited: number; // 0 or 1
    dataAmount: number | null;
    dataType: string;
    durationAmount: number;
    durationType: string;
    regionKeyword: string;
    unusedValidDays?: number;
    status: string;
    details?: unknown[];
  };
}

// ---------------------------------------------------------------------------
// Order / Query types
// ---------------------------------------------------------------------------

interface OrderResponseData {
  orderId: string;
  transactionId: string;
}

interface QueryEsimData {
  esim: {
    orderId: string;
    transactionId?: string;
    iccid: string;
    activationCode: string;
    qrCodeUrl?: string;
    esimStatus: string;
    expiredDatetime?: string;
  };
}

interface UsageResponseData {
  dataType?: string;
  usage: number; // MB
  maxUsage: number | null; // MB
  unlimited: number; // 0 or 1
  remainingDays?: number;
  status?: string;
}

interface CancelResponseData {
  orderId: string;
}

// ---------------------------------------------------------------------------
// EUR → USD approximate conversion
// ---------------------------------------------------------------------------

const EUR_TO_USD = 1.10;

// ---------------------------------------------------------------------------
// Roamic status → adapter status mapping
// ---------------------------------------------------------------------------


function mapEsimStatus(
  raw: string,
): ProviderEsimStatus["status"] {
  switch (raw) {
    case "GOT_RESOURCE":
      return "delivered";
    case "ACTIVATED":
      return "activated";
    case "EXPIRED":
      return "expired";
    case "CANCELLED":
    case "FAILED":
      return "failed";
    default:
      return "provisioning";
  }
}

// ---------------------------------------------------------------------------
// RoamicProvider
// ---------------------------------------------------------------------------

export class RoamicProvider implements EsimProvider {
  readonly name = "roamic";

  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl =
      process.env.ROAMIC_BASE_URL ?? "https://api.roamic.com";
    this.email = process.env.ROAMIC_EMAIL ?? "";
    this.password = process.env.ROAMIC_PASSWORD ?? "";
  }

  // -----------------------------------------------------------------------
  // Auth
  // -----------------------------------------------------------------------

  private async ensureAuth(): Promise<string> {
    if (this.token) return this.token;
    return this.login();
  }

  private async login(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    if (!res.ok) {
      throw new Error(
        `Roamic login failed: ${res.status} ${await res.text()}`,
      );
    }

    const body = (await res.json()) as RoamicEnvelope<{ token: string }>;
    if (!body.success || !body.data?.token) {
      throw new Error(
        `Roamic login rejected: ${body.message ?? "unknown error"}`,
      );
    }

    this.token = body.data.token;
    return this.token;
  }

  /**
   * Wraps every API call. On 401, re-authenticates and retries once.
   */
  private async api<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<RoamicEnvelope<T>> {
    const token = await this.ensureAuth();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    let res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });

    // Re-login on 401 then retry once
    if (res.status === 401) {
      this.token = null;
      const freshToken = await this.login();
      headers.set("Authorization", `Bearer ${freshToken}`);
      res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    }

    if (!res.ok) {
      throw new Error(
        `Roamic API error: ${res.status} ${await res.text()}`,
      );
    }

    return res.json() as Promise<RoamicEnvelope<T>>;
  }

  // -----------------------------------------------------------------------
  // Catalog
  // -----------------------------------------------------------------------

  async listCatalog(): Promise<ProviderPackage[]> {
    const allItems: CatalogItem[] = [];
    let url: string | null =
      `/v1/catalogs?length=200`;

    while (url) {
      const envelope: RoamicEnvelope<{ data: CatalogItem[] }> = await this.api<{
        data: CatalogItem[];
      }>(url);

      if (envelope.data?.data) {
        allItems.push(...envelope.data.data);
      }

      // Follow pagination via links.next
      const next: string | null | undefined = envelope.links?.next;
      if (next && next !== "null") {
        // Roamic returns absolute URLs — extract path + query
        try {
          const parsed: URL = new URL(next);
          url = `${parsed.pathname}${parsed.search}`;
        } catch {
          // next is already a relative path
          url = next;
        }
      } else {
        url = null;
      }
    }

    return allItems.map((item) => this.mapCatalogItem(item));
  }

  async getPackage(
    providerPackageId: string,
  ): Promise<ProviderPackage | null> {
    // Roamic has no single-item endpoint; fetch filtered catalog
    const envelope = await this.api<{
      data: CatalogItem[];
    }>(`/v1/catalogs?length=200&filter[regionKeyword]=${encodeURIComponent(
      providerPackageId.split("_")[0],
    )}`);

    const items = envelope.data?.data ?? [];
    const match = items.find(
      (i) => i.attributes.productSku === providerPackageId,
    );
    return match ? this.mapCatalogItem(match) : null;
  }

  private mapCatalogItem(item: CatalogItem): ProviderPackage {
    const a = item.attributes;
    return {
      providerPackageId: a.productSku,
      name: a.productName,
      regionSlug: a.regionKeyword.toLowerCase(),
      dataMb: a.unlimited === 1 ? null : a.dataAmount,
      validityDays:
        a.durationType === "DAY" ? a.durationAmount : a.durationAmount * 30,
      coverageCountries: [a.regionKeyword],
      costUsd: parseFloat(a.price) * EUR_TO_USD,
      meta: { originalPriceEur: a.price, currency: a.currencyKeyword },
    };
  }

  // -----------------------------------------------------------------------
  // Provisioning (async — returns pending immediately)
  // -----------------------------------------------------------------------

  async provision(req: ProvisionRequest): Promise<ProvisionResult> {
    try {
      const envelope = await this.api<OrderResponseData>(
        "/v1/manage/esim/order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productSku: req.providerPackageId,
            transactionId: req.orderRef,
          }),
        },
      );

      if (!envelope.success || !envelope.data?.orderId) {
        return {
          kind: "failed",
          retryable: false,
          error: envelope.message ?? "Roamic order failed",
        };
      }

      return {
        kind: "pending",
        providerOrderId: envelope.data.orderId,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Network / 5xx errors are retryable
      const retryable = !msg.includes("400") && !msg.includes("403");
      return { kind: "failed", retryable, error: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Status
  // -----------------------------------------------------------------------

  async getEsimStatus(
    providerEsimId: string,
  ): Promise<ProviderEsimStatus> {
    // providerEsimId stores the orderId from provisioning
    const envelope = await this.api<QueryEsimData>(
      `/v1/manage/esim/query?filter[orderId]=${encodeURIComponent(
        providerEsimId,
      )}`,
    );

    const esim = envelope.data?.esim;
    if (!esim) {
      return { status: "provisioning" };
    }

    return {
      status: mapEsimStatus(esim.esimStatus),
      raw: esim,
    };
  }

  // -----------------------------------------------------------------------
  // Usage
  // -----------------------------------------------------------------------

  async getUsage(providerEsimId: string): Promise<EsimUsage | null> {
    // First resolve the orderId to an iccid via query
    const queryEnvelope = await this.api<QueryEsimData>(
      `/v1/manage/esim/query?filter[orderId]=${encodeURIComponent(
        providerEsimId,
      )}`,
    );

    const iccid = queryEnvelope.data?.esim?.iccid;
    if (!iccid) return null;

    const usageEnvelope = await this.api<UsageResponseData>(
      `/v1/manage/esim/usage/${encodeURIComponent(iccid)}`,
    );

    const u = usageEnvelope.data;
    if (!u) return null;

    return {
      usedMb: u.usage,
      totalMb: u.unlimited === 1 ? null : u.maxUsage,
      expiresAt: queryEnvelope.data?.esim?.expiredDatetime ?? null,
    };
  }

  // -----------------------------------------------------------------------
  // Cancel
  // -----------------------------------------------------------------------

  async cancel(
    providerEsimId: string,
  ): Promise<{ ok: boolean; refunded: boolean }> {
    try {
      const envelope = await this.api<CancelResponseData>(
        "/v1/manage/esim/cancel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: providerEsimId }),
        },
      );

      return {
        ok: envelope.success,
        // Roamic doesn't document refund info — assume refunded on success
        refunded: envelope.success,
      };
    } catch {
      return { ok: false, refunded: false };
    }
  }
}
