import type {
  EsimProvider,
  EsimUsage,
  ProviderEsimStatus,
  ProviderPackage,
  ProvisionedEsim,
  ProvisionRequest,
  ProvisionResult,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Firsty Connect v3 provider adapter                                */
/*  Two-step provisioning: create eSIM → order package onto it.       */
/*  Self-contained OAuth2 client-credentials token management.        */
/* ------------------------------------------------------------------ */

const DEFAULT_BASE_URL = "https://connect.test.firsty.app/api/v3";
const TOKEN_SAFETY_MARGIN_MS = 30_000;

/* ---- Firsty API response shapes (internal, not exported) ---------- */

interface FirstyTokenResponse {
  access_token: string;
  expires_in: number; // seconds
  token_type: string;
}

interface FirstyPagination {
  hasMore: boolean;
  nextCursor: string | null;
}

interface FirstyCatalogItem {
  planReference: string;
  name: string;
  countryCode: string;
  validityDays: number;
  dataMb: number | null;
  priceUsd: number;
}

interface FirstyCatalogResponse {
  data: FirstyCatalogItem[];
  pagination: FirstyPagination;
}

interface FirstyEsimCreated {
  profileReference: string;
  esimReference: string;
  iccid: string;
  activationCode: string;
  status: string;
  lifecycleStatus: string;
}

interface FirstyPackageOrder {
  packageReference: string;
  status: string;
  activatedAt: string;
  expiresAt: string;
}

interface FirstyStatusResponse {
  profileReference: string;
  esimReference: string;
  iccid: string;
  lifecycleStatus: string;
  status: string;
}

interface FirstyUsageTotals {
  usedMb: number;
  remainingMb: number;
}

interface FirstyUsageResponse {
  totals: FirstyUsageTotals;
  packages: unknown[];
}

interface FirstyErrorBody {
  message?: string;
  code?: string;
}

/* ---- providerEsimId encoding                                       */
/*  We pack both Firsty identifiers into a single opaque string:      */
/*    `${profileReference}:${esimReference}`                           */
/*  This keeps lookup O(1) with a split.                              */

function encodeFirstyId(profileRef: string, esimRef: string): string {
  return `${profileRef}:${esimRef}`;
}

function decodeFirstyId(providerEsimId: string): {
  profileReference: string;
  esimReference: string;
} {
  const sep = providerEsimId.indexOf(":");
  if (sep <= 0) {
    throw new Error(
      `firsty: invalid providerEsimId format — expected "profileRef:esimRef", got "${providerEsimId}"`,
    );
  }
  return {
    profileReference: providerEsimId.slice(0, sep),
    esimReference: providerEsimId.slice(sep + 1),
  };
}

/* ---- Status mapping ----------------------------------------------- */

const LIFECYCLE_MAP: Record<
  string,
  ProviderEsimStatus["status"]
> = {
  released: "provisioning",
  downloaded: "provisioning",
  installed: "delivered",
  enabled: "delivered",
  disabled: "expired",
  faulted: "failed",
};

function mapLifecycle(status: string): ProviderEsimStatus["status"] {
  return LIFECYCLE_MAP[status] ?? "provisioning";
}

/* ---- HTTP error classification ------------------------------------ */

interface ClassifiedError {
  message: string;
  retryable: boolean;
  status?: number;
}

function classifyHttpError(
  status: number,
  body: FirstyErrorBody | null,
): ClassifiedError {
  const msg = body?.message ?? `firsty: HTTP ${status}`;
  if (status === 409) return { message: msg, retryable: true, status };
  if (status === 500 || status === 502) return { message: msg, retryable: true, status };
  if (status === 422) return { message: msg, retryable: false, status };
  return { message: msg, retryable: false, status };
}

/* ================================================================ */
/*  FirstyProvider                                                  */
/* ================================================================ */

export class FirstyProvider implements EsimProvider {
  readonly name = "firsty";

  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  /* Token cache — single-flight: one request at a time, others await it. */
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private tokenFetchPromise: Promise<string> | null = null;

  constructor() {
    this.baseUrl = (process.env.FIRSTY_BASE_URL ?? DEFAULT_BASE_URL).replace(
      /\/$/,
      "",
    );
    this.clientId = process.env.FIRSTY_CLIENT_ID ?? "";
    this.clientSecret = process.env.FIRSTY_CLIENT_SECRET ?? "";
  }

  /* ---------------------------------------------------------------- */
  /*  Auth                                                             */
  /* ---------------------------------------------------------------- */

  private async getAccessToken(): Promise<string> {
    // Token still valid (with safety margin)?
    if (this.accessToken && Date.now() < this.tokenExpiresAt - TOKEN_SAFETY_MARGIN_MS) {
      return this.accessToken;
    }

    // In-flight fetch? Await it instead of issuing a second request.
    if (this.tokenFetchPromise) return this.tokenFetchPromise;

    this.tokenFetchPromise = this.fetchToken();
    try {
      return await this.tokenFetchPromise;
    } finally {
      this.tokenFetchPromise = null;
    }
  }

  private async fetchToken(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`firsty: token request failed (${res.status}): ${text}`);
    }

    const data: FirstyTokenResponse = await res.json();
    this.accessToken = data.access_token;
    // expires_in is seconds from now; store absolute timestamp
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  /* ---------------------------------------------------------------- */
  /*  Authenticated HTTP helper                                       */
  /* ---------------------------------------------------------------- */

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    if (!res.ok) {
      let parsed: FirstyErrorBody | null = null;
      try {
        parsed = JSON.parse(text) as FirstyErrorBody;
      } catch {
        /* non-JSON — use raw text in classifier */
      }
      const err = classifyHttpError(res.status, parsed);
      throw Object.assign(new Error(err.message), {
        retryable: err.retryable,
        status: err.status,
      });
    }

    return JSON.parse(text) as T;
  }

  /* ---------------------------------------------------------------- */
  /*  Catalog                                                          */
  /* ---------------------------------------------------------------- */

  async listCatalog(): Promise<ProviderPackage[]> {
    const packages: ProviderPackage[] = [];
    let cursor: string | null = null;

    do {
      const params = new URLSearchParams({ limit: "100" });
      if (cursor) params.set("cursor", cursor);

      const res = await this.request<FirstyCatalogResponse>(
        "GET",
        `/catalog/packages?${params.toString()}`,
      );

      for (const item of res.data) {
        packages.push({
          providerPackageId: item.planReference,
          name: item.name,
          regionSlug: item.countryCode.toLowerCase(),
          dataMb: item.dataMb,
          validityDays: item.validityDays,
          coverageCountries: [item.countryCode],
          costUsd: item.priceUsd,
          meta: { planReference: item.planReference },
        });
      }

      cursor = res.pagination.hasMore ? res.pagination.nextCursor : null;
    } while (cursor);

    return packages;
  }

  async getPackage(providerPackageId: string): Promise<ProviderPackage | null> {
    // Fetch full catalog and find the match. Firsty has no single-plan endpoint,
    // but catalog is ≤ 100 items per page and typically 1-2 pages total.
    const all = await this.listCatalog();
    return all.find((p) => p.providerPackageId === providerPackageId) ?? null;
  }

  /* ---------------------------------------------------------------- */
  /*  Provisioning (two-step)                                          */
  /* ---------------------------------------------------------------- */

  async provision(req: ProvisionRequest): Promise<ProvisionResult> {
    try {
      // Step 1: create the eSIM shell
      const esimRes = await this.request<FirstyEsimCreated>(
        "POST",
        "/esims",
        { externalProfileId: req.orderRef },
      );

      // Step 2: order the package onto the newly created eSIM
      const planRef = req.providerPackageId;
      await this.request<FirstyPackageOrder>(
        "POST",
        `/profiles/${esimRes.profileReference}/esims/${esimRes.esimReference}/packages`,
        { planReference: planRef, externalTransactionId: req.orderRef },
      );

      const providerEsimId = encodeFirstyId(
        esimRes.profileReference,
        esimRes.esimReference,
      );

      const esim: ProvisionedEsim = {
        providerEsimId,
        iccid: esimRes.iccid,
        smdpAddress: "", // Firsty returns the full LPA in activationCode
        activationCode: esimRes.activationCode,
        lpaString: esimRes.activationCode,
        raw: esimRes,
      };

      return { kind: "delivered", esims: [esim] };
    } catch (err: unknown) {
      if (err instanceof Error && "retryable" in err) {
        const classified = err as Error & { retryable: boolean; status?: number };
        return {
          kind: "failed",
          retryable: classified.retryable,
          error: classified.message,
        };
      }
      throw err;
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Status                                                           */
  /* ---------------------------------------------------------------- */

  async getEsimStatus(providerEsimId: string): Promise<ProviderEsimStatus> {
    const { profileReference, esimReference } = decodeFirstyId(providerEsimId);
    const res = await this.request<FirstyStatusResponse>(
      "GET",
      `/profiles/${profileReference}/esims/${esimReference}`,
    );
    return {
      status: mapLifecycle(res.lifecycleStatus),
      raw: res,
    };
  }

  /* ---------------------------------------------------------------- */
  /*  Usage                                                            */
  /* ---------------------------------------------------------------- */

  async getUsage(providerEsimId: string): Promise<EsimUsage | null> {
    const { profileReference, esimReference } = decodeFirstyId(providerEsimId);
    const res = await this.request<FirstyUsageResponse>(
      "GET",
      `/profiles/${profileReference}/esims/${esimReference}/usage`,
    );

    return {
      usedMb: res.totals.usedMb,
      totalMb: res.totals.usedMb + res.totals.remainingMb,
      expiresAt: null, // Firsty usage endpoint doesn't expose expiry directly
    };
  }

  /* ---------------------------------------------------------------- */
  /*  Cancel (lifecycle terminate)                                     */
  /* ---------------------------------------------------------------- */

  async cancel(
    providerEsimId: string,
  ): Promise<{ ok: boolean; refunded: boolean }> {
    const { profileReference, esimReference } = decodeFirstyId(providerEsimId);
    try {
      await this.request(
        "PATCH",
        `/profiles/${profileReference}/esims/${esimReference}/lifecycle`,
        { operation: "terminate" },
      );
      // Firsty does not provide refund info in the response —
      // default to false (non-refunded) as a safe assumption.
      return { ok: true, refunded: false };
    } catch {
      return { ok: false, refunded: false };
    }
  }
}
