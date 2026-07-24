/**
 * Provider-agnostic eSIM adapter interface.
 * A real provider (Airalo, eSIM Access, eSIM-Go, …) is one file
 * implementing EsimProvider plus a branch in webhook.ts.
 */

export interface ProviderPackage {
  providerPackageId: string;
  name: string;
  /** Maps to regions.slug */
  regionSlug: string;
  /** null = unlimited */
  dataMb: number | null;
  validityDays: number;
  /** ISO2 codes */
  coverageCountries: string[];
  costUsd: number;
  meta?: Record<string, unknown>;
}

export interface ProvisionRequest {
  providerPackageId: string;
  /** Our order_code — used as the provider-side idempotency key */
  orderRef: string;
  quantity: number;
  customerEmail: string;
}

export interface ProvisionedEsim {
  providerEsimId: string;
  iccid: string;
  smdpAddress: string;
  activationCode: string;
  /** "LPA:1$<smdp>$<code>" — the QR payload phones scan */
  lpaString: string;
  raw?: unknown;
}

export type ProvisionResult =
  | { kind: "delivered"; esims: ProvisionedEsim[] }
  | { kind: "pending"; providerOrderId: string }
  | { kind: "failed"; retryable: boolean; error: string };

export interface ProviderEsimStatus {
  status: "provisioning" | "delivered" | "activated" | "expired" | "failed";
  raw?: unknown;
}

export interface EsimUsage {
  usedMb: number;
  totalMb: number | null;
  expiresAt: string | null;
}

export interface EsimProvider {
  readonly name: string;
  listCatalog(): Promise<ProviderPackage[]>;
  getPackage(providerPackageId: string): Promise<ProviderPackage | null>;
  provision(req: ProvisionRequest): Promise<ProvisionResult>;
  getEsimStatus(providerEsimId: string): Promise<ProviderEsimStatus>;
  getUsage(providerEsimId: string): Promise<EsimUsage | null>;
  cancel?(providerEsimId: string): Promise<{ ok: boolean; refunded: boolean }>;
}

export interface ProviderWebhookEvent {
  provider: string;
  eventId: string;
  type: "esim.delivered" | "esim.failed" | "esim.status_changed";
  providerOrderId?: string;
  providerEsimId?: string;
  esims?: ProvisionedEsim[];
  status?: ProviderEsimStatus["status"];
  raw: unknown;
}
