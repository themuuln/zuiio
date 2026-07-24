import type {
  EsimProvider,
  EsimUsage,
  ProviderEsimStatus,
  ProviderPackage,
  ProvisionedEsim,
  ProvisionRequest,
  ProvisionResult,
} from "./types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://api.omaxtelecom.com/bappy/v1";
const TOKEN_ENDPOINT =
  "https://id.omaxtelecom.com/realms/platform/protocol/openid-connect/token";
const TOKEN_LIFETIME_MS = 300_000; // 5 minutes
const TOKEN_REFRESH_BUFFER_MS = 30_000; // refresh 30s before expiry

// ---------------------------------------------------------------------------
// Bappy response envelopes
// ---------------------------------------------------------------------------

interface BappyEnvelope<T> {
  success: boolean;
  data: T;
  meta?: { timestamp: string; response_time_ms: number };
}

interface BappyErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

interface BappyErrorEnvelope {
  success: false;
  error: BappyErrorDetail;
}

interface BappyPaginatedData<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface BappyPlan {
  id: string;
  name: string;
  region: string;
  coverage_type: string;
  price: string;
  currency: string;
  data_mb: number | null;
  validity_days: number;
  coverage_countries: string[];
}

interface BappyLink {
  id: string;
  iccid: string;
  lpa_profile: string;
  activation_url: string;
  amount_charged: string;
  currency: string;
}

interface BappyLinkStatus {
  id: string;
  iccid: string;
  status: "active" | "suspended" | "inactive";
  data_used_mb: number | null;
  data_remaining_mb: number | null;
  activations: unknown[];
}

interface BappyErrorResponse {
  success: boolean;
  error?: BappyErrorDetail;
}

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------

interface TokenCache {
  accessToken: string;
  expiresAt: number; // Date.now() + ms
}

// ---------------------------------------------------------------------------
// Region mapping
// ---------------------------------------------------------------------------

const REGION_MAP: Record<string, string> = {
  EU: "europe",
  AS: "asia",
  NA: "north-america",
  SA: "south-america",
  AF: "africa",
  OC: "oceania",
  ME: "middle-east",
  GL: "global",
};

function normalizeRegion(region: string): string {
  const upper = region.toUpperCase();
  return REGION_MAP[upper] ?? region.toLowerCase();
}

// ---------------------------------------------------------------------------
// BappyProvider
// ---------------------------------------------------------------------------

export class BappyProvider implements EsimProvider {
  readonly name = "bappy";

  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private tokenCache: TokenCache | null = null;

  constructor() {
    this.baseUrl = process.env.BAPPY_BASE_URL ?? DEFAULT_BASE_URL;
    this.clientId = process.env.BAPPY_CLIENT_ID ?? "";
    this.clientSecret = process.env.BAPPY_CLIENT_SECRET ?? "";

    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        "BappyProvider requires BAPPY_CLIENT_ID and BAPPY_CLIENT_SECRET env vars",
      );
    }
  }

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
      return this.tokenCache.accessToken;
    }
    return this.refreshToken();
  }

  private async refreshToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Bappy auth failed (${res.status}): ${text.slice(0, 200)}`,
      );
    }

    const json: unknown = await res.json();
    if (!isTokenResponse(json)) {
      throw new Error("Bappy auth: unexpected token response shape");
    }

    this.tokenCache = {
      accessToken: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? TOKEN_LIFETIME_MS) * 1000,
    };

    return this.tokenCache.accessToken;
  }

  // -------------------------------------------------------------------------
  // HTTP helpers
  // -------------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);

    // Handle 401 once — re-auth and retry
    if (res.status === 401) {
      const newToken = await this.refreshToken();
      const retryInit: RequestInit = {
        ...init,
        headers: {
          ...init.headers as Record<string, string>,
          Authorization: `Bearer ${newToken}`,
        },
      };
      const retryRes = await fetch(url, retryInit);
      return this.parseEnvelope<T>(retryRes);
    }

    return this.parseEnvelope<T>(res);
  }

  private async parseEnvelope<T>(res: Response): Promise<T> {
    const json: unknown = await res.json();

    if (!res.ok || !isSuccessEnvelope(json)) {
      throw this.toProviderError(res.status, json);
    }

    return json.data as T;
  }

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  private toProviderError(status: number, body: unknown): Error {
    const msg = isErrorResponse(body)
      ? `${body.error.code}: ${body.error.message}`
      : `HTTP ${status}`;

    const code = isErrorResponse(body) ? body.error.code : undefined;

    const err = new Error(`Bappy: ${msg}`);
    // Attach metadata for callers to inspect
    (err as ProviderError).providerCode = code;
    (err as ProviderError).httpStatus = status;
    (err as ProviderError).retryable = isRetryable(status, code);
    return err;
  }

  // -------------------------------------------------------------------------
  // EsimProvider — listCatalog
  // -------------------------------------------------------------------------

  async listCatalog(): Promise<ProviderPackage[]> {
    const packages: ProviderPackage[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const data = await this.request<BappyPaginatedData<BappyPlan>>(
        "GET",
        `/v1/plans?page=${page}`,
      );
      packages.push(...data.data.map(mapPlan));
      lastPage = data.meta.last_page;
      page++;
    } while (page <= lastPage);

    return packages;
  }

  // -------------------------------------------------------------------------
  // EsimProvider — getPackage
  // -------------------------------------------------------------------------

  async getPackage(providerPackageId: string): Promise<ProviderPackage | null> {
    try {
      // Bappy doesn't have a single-plan endpoint; fetch all and find.
      // For a single lookup, page through until found or exhausted.
      let page = 1;
      let lastPage = 1;

      do {
        const data = await this.request<BappyPaginatedData<BappyPlan>>(
          "GET",
          `/v1/plans?page=${page}`,
        );
        const found = data.data.find((p) => p.id === providerPackageId);
        if (found) return mapPlan(found);
        lastPage = data.meta.last_page;
        page++;
      } while (page <= lastPage);

      return null;
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // EsimProvider — provision (SYNC)
  // -------------------------------------------------------------------------

  async provision(req: ProvisionRequest): Promise<ProvisionResult> {
    try {
      const link = await this.request<BappyLink>("POST", "/v1/links", {
        plan_id: req.providerPackageId,
        name: req.orderRef,
      });

      const parsed = parseLpa(link.lpa_profile);

      const esim: ProvisionedEsim = {
        providerEsimId: link.id,
        iccid: link.iccid,
        smdpAddress: parsed.smdpAddress,
        activationCode: parsed.activationCode,
        lpaString: link.lpa_profile,
        raw: link,
      };

      return { kind: "delivered", esims: [esim] };
    } catch (err) {
      return mapProvisionError(err);
    }
  }

  // -------------------------------------------------------------------------
  // EsimProvider — getEsimStatus
  // -------------------------------------------------------------------------

  async getEsimStatus(providerEsimId: string): Promise<ProviderEsimStatus> {
    const data = await this.request<BappyLinkStatus>(
      "GET",
      `/v1/links/${encodeURIComponent(providerEsimId)}`,
    );

    return {
      status: mapBappyStatus(data.status),
      raw: data,
    };
  }

  // -------------------------------------------------------------------------
  // EsimProvider — getUsage
  // -------------------------------------------------------------------------

  async getUsage(providerEsimId: string): Promise<EsimUsage | null> {
    try {
      const data = await this.request<BappyLinkStatus>(
        "GET",
        `/v1/links/${encodeURIComponent(providerEsimId)}`,
      );

      const usedMb = data.data_used_mb ?? 0;
      const remainingMb = data.data_remaining_mb;

      // null remaining = unlimited
      const totalMb =
        remainingMb !== null ? usedMb + remainingMb : null;

      return {
        usedMb,
        totalMb,
        expiresAt: null,
      };
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // EsimProvider — cancel (optional)
  // -------------------------------------------------------------------------

  async cancel(
    providerEsimId: string,
  ): Promise<{ ok: boolean; refunded: boolean }> {
    try {
      await this.request<BappyLinkStatus>(
        "PUT",
        `/v1/links/${encodeURIComponent(providerEsimId)}`,
        { status: "suspended" },
      );
      // Bappy auto-refunds on suspend
      return { ok: true, refunded: true };
    } catch {
      return { ok: false, refunded: false };
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mapPlan(plan: BappyPlan): ProviderPackage {
  const priceEur = parseFloat(plan.price);
  return {
    providerPackageId: plan.id,
    name: plan.name,
    regionSlug: normalizeRegion(plan.region),
    dataMb: plan.data_mb,
    validityDays: plan.validity_days,
    coverageCountries: plan.coverage_countries,
    // EUR → USD (approximate rate)
    costUsd: Number((priceEur * 1.1).toFixed(2)),
    meta: {
      originalPriceEur: plan.price,
      currency: plan.currency,
      region: plan.region,
    },
  };
}

function parseLpa(lpaProfile: string): {
  smdpAddress: string;
  activationCode: string;
} {
  // Format: "LPA:1$smdp$activation_code"
  const parts = lpaProfile.split("$");
  if (parts.length < 3) {
    throw new Error(`Bappy: malformed LPA string: ${lpaProfile}`);
  }
  return {
    smdpAddress: parts[1],
    activationCode: parts.slice(2).join("$"), // activation code may contain $
  };
}

function mapBappyStatus(
  status: BappyLinkStatus["status"],
): ProviderEsimStatus["status"] {
  switch (status) {
    case "active":
      return "delivered";
    case "suspended":
      return "expired";
    case "inactive":
      return "failed";
  }
}

function mapProvisionError(err: unknown): ProvisionResult {
  if (err instanceof Error) {
    const pe = err as ProviderError;
    const retryable = pe.retryable ?? false;
    return {
      kind: "failed",
      retryable,
      error: err.message,
    };
  }
  return {
    kind: "failed",
    retryable: false,
    error: "Unknown provision error",
  };
}

function isRetryable(httpStatus: number, code?: string): boolean {
  if (httpStatus === 402) return true; // INSUFFICIENT_BALANCE — auto-refunded
  if (httpStatus === 502) return true; // PROVISIONING_ERROR / PROVIDER_ERROR
  if (code === "INSUFFICIENT_BALANCE") return true;
  if (code === "PROVISIONING_ERROR" || code === "PROVIDER_ERROR") return true;
  return false;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

interface TokenResponse {
  access_token: string;
  expires_in?: number;
}

function isTokenResponse(val: unknown): val is TokenResponse {
  return (
    typeof val === "object" &&
    val !== null &&
    "access_token" in val &&
    typeof (val as Record<string, unknown>).access_token === "string"
  );
}

function isSuccessEnvelope<T>(val: unknown): val is BappyEnvelope<T> {
  return (
    typeof val === "object" &&
    val !== null &&
    (val as Record<string, unknown>).success === true &&
    "data" in val
  );
}

function isErrorResponse(val: unknown): val is BappyErrorEnvelope {
  return (
    typeof val === "object" &&
    val !== null &&
    (val as Record<string, unknown>).success === false &&
    "error" in val
  );
}

interface ProviderError extends Error {
  providerCode?: string;
  httpStatus?: number;
  retryable?: boolean;
}
