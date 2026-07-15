import type {
  EsimProvider,
  EsimUsage,
  ProviderEsimStatus,
  ProviderPackage,
  ProvisionedEsim,
  ProvisionRequest,
  ProvisionResult,
} from "./types";

// ─── Citrus Mobile API response shapes ─────────────────────────────

interface CitrusNetwork {
  operator: string;
  per_mb_usd: number;
  per_gb_usd: number;
}

interface CitrusCountry {
  name: string;
  iso2: string;
  cheapest_per_gb_usd: number;
  cheapest_operator: string;
  networks: CitrusNetwork[];
}

interface CitrusRatesResponse {
  total_countries: number;
  countries: CitrusCountry[];
}

interface CitrusProvisionResponse {
  id: string;
  iccid: string;
  lpa_string: string;
  qr_code: string;
  status: string;
  cost: number;
  balance_remaining: number;
  created_at: string;
}

interface CitrusEsimDetail {
  id: string;
  iccid: string;
  status: string;
  euicc_state: string;
  wallet_balance_usd: number;
  total_data_charged_usd: number;
  lpa_string: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

/** Strip corporate suffixes then slugify: "KDDI Corporation" → "kddi" */
function operatorSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|ltd|llc|corporation|corp|co|company|gmbh|ag|sa|pty)\b\.?/gi, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse a Citrus LPA string.
 * Format: `LPA:1$<smdp>$<activation_code>`
 */
function parseLpaString(lpa: string): {
  smdpAddress: string;
  activationCode: string;
} {
  const parts = lpa.split("$");
  if (parts.length < 3) {
    throw new Error(`Invalid LPA string: ${lpa}`);
  }
  return {
    smdpAddress: parts[1],
    // Activation code may itself contain `$` — rejoin the rest
    activationCode: parts.slice(2).join("$"),
  };
}

/** Map Citrus eSIM status to our ProviderEsimStatus union. */
function mapCitrusStatus(status: string): ProviderEsimStatus["status"] {
  switch (status) {
    case "pending":
      return "provisioning";
    case "active":
      return "delivered";
    case "suspended":
      return "expired";
    case "terminated":
      return "failed";
    default:
      return "provisioning";
  }
}

/** Synthetic data tiers (GB) generated for every operator. */
const DATA_TIERS = [1, 3, 5, 10] as const;

// ─── Provider ──────────────────────────────────────────────────────

export class CitrusMobileProvider implements EsimProvider {
  readonly name = "citrus-mobile";

  private readonly baseUrl: string;
  private readonly apiKey: string;

  /** Maps providerEsimId (UUID) → iccid so getEsimStatus/getUsage can call the API. */
  private readonly esimMap = new Map<string, string>();

  /** In-memory catalog cache — populated once on first listCatalog(). */
  private catalog: ProviderPackage[] | null = null;

  constructor() {
    this.apiKey = process.env.CITRUS_API_KEY ?? "";
    this.baseUrl = (
      process.env.CITRUS_BASE_URL ??
      "https://citrusmobile.com/api/v2/reseller"
    ).replace(/\/$/, "");

    if (!this.apiKey) {
      console.warn(
        "[citrus-mobile] CITRUS_API_KEY is not set — API calls will fail with 401",
      );
    }
  }

  // ── HTTP ───────────────────────────────────────────────────────────

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Citrus API ${res.status}: ${body || res.statusText}`);
    }

    // Some endpoints (e.g. terminate) may return an empty body
    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  // ── Catalog ────────────────────────────────────────────────────────

  async listCatalog(): Promise<ProviderPackage[]> {
    if (this.catalog) return this.catalog;

    const data = await this.request<CitrusRatesResponse>("/rates");
    const packages: ProviderPackage[] = [];

    for (const country of data.countries) {
      for (const network of country.networks) {
        const slug = operatorSlug(network.operator);

        for (const gb of DATA_TIERS) {
          packages.push({
            providerPackageId: `${country.iso2}_${slug}_${gb}gb`,
            name: `${country.name} — ${network.operator} ${gb}GB`,
            regionSlug: country.iso2.toLowerCase(),
            dataMb: null,
            validityDays: 30,
            coverageCountries: [country.iso2],
            costUsd: network.per_gb_usd * gb,
            meta: {
              perMbUsd: network.per_mb_usd,
              perGbUsd: network.per_gb_usd,
              operator: network.operator,
              billingModel: "per-mb",
              tierGb: gb,
            },
          });
        }
      }
    }

    this.catalog = packages;
    return packages;
  }

  async getPackage(
    providerPackageId: string,
  ): Promise<ProviderPackage | null> {
    const catalog = await this.listCatalog();
    return catalog.find((p) => p.providerPackageId === providerPackageId) ?? null;
  }

  // ── Provisioning (sync — returns QR instantly) ─────────────────────

  async provision(req: ProvisionRequest): Promise<ProvisionResult> {
    try {
      const body = await this.request<CitrusProvisionResponse>(
        "/esim/provision",
        {
          method: "POST",
          body: JSON.stringify({
            end_user_reference: req.orderRef,
            label: req.customerEmail,
          }),
        },
      );

      const { smdpAddress, activationCode } = parseLpaString(body.lpa_string);

      const esim: ProvisionedEsim = {
        providerEsimId: body.id,
        iccid: body.iccid,
        smdpAddress,
        activationCode,
        lpaString: body.lpa_string,
        raw: body,
      };

      // Cache UUID → iccid for subsequent status/usage lookups
      this.esimMap.set(body.id, body.iccid);

      return { kind: "delivered", esims: [esim] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Map known Citrus error codes to retryable/terminal
      if (message.includes("401")) {
        return { kind: "failed", retryable: false, error: "Invalid API key" };
      }
      if (message.includes("402")) {
        return {
          kind: "failed",
          retryable: true,
          error: "Insufficient balance",
        };
      }
      if (message.includes("503")) {
        return {
          kind: "failed",
          retryable: true,
          error: "No eSIMs available",
        };
      }

      return { kind: "failed", retryable: false, error: message };
    }
  }

  // ── Status & Usage ─────────────────────────────────────────────────

  async getEsimStatus(providerEsimId: string): Promise<ProviderEsimStatus> {
    // Resolve UUID → iccid if cached, otherwise treat the input as an iccid directly
    const iccid = this.esimMap.get(providerEsimId) ?? providerEsimId;

    const detail = await this.request<CitrusEsimDetail>(`/esim/${iccid}`);
    return {
      status: mapCitrusStatus(detail.status),
      raw: detail,
    };
  }

  async getUsage(providerEsimId: string): Promise<EsimUsage | null> {
    const iccid = this.esimMap.get(providerEsimId) ?? providerEsimId;

    const detail = await this.request<CitrusEsimDetail>(`/esim/${iccid}`);

    // Citrus bills per-MB via wallet — approximate usage from total_data_charged_usd
    return {
      usedMb: detail.total_data_charged_usd * 1024,
      totalMb: null,
      expiresAt: null,
    };
  }

  // ── Cancel ─────────────────────────────────────────────────────────

  async cancel(
    providerEsimId: string,
  ): Promise<{ ok: boolean; refunded: boolean }> {
    const iccid = this.esimMap.get(providerEsimId) ?? providerEsimId;

    try {
      await this.request(`/esim/${iccid}/terminate`, { method: "POST" });
      // Terminate is irreversible — wallet balance is forfeited
      return { ok: true, refunded: false };
    } catch {
      return { ok: false, refunded: false };
    }
  }
}
