# 3. Provider adapter (`src/lib/provider/`)

Provider-agnostic layer so the real eSIM API provider (chosen later) slots in as one file.

```
provider/
├── types.ts          # interface + normalized DTOs
├── index.ts          # getProvider() factory from process.env.ESIM_PROVIDER
├── mock.ts           # MockProvider
└── webhook.ts        # normalizeWebhook(provider, payload) -> ProviderWebhookEvent
```

## Interface

```ts
export interface ProviderPackage {
  providerPackageId: string;
  name: string;
  regionSlug: string;            // maps to regions.slug
  dataMb: number | null;         // null = unlimited
  validityDays: number;
  coverageCountries: string[];   // ISO2
  costUsd: number;
  meta?: Record<string, unknown>;
}

export interface ProvisionRequest {
  providerPackageId: string;
  orderRef: string;              // our order_code — provider-side idempotency key
  quantity: number;
  customerEmail: string;
}

export type ProvisionResult =
  | { kind: "delivered"; esims: ProvisionedEsim[] }
  | { kind: "pending"; providerOrderId: string }   // async → completed via webhook
  | { kind: "failed"; retryable: boolean; error: string };

export interface ProvisionedEsim {
  providerEsimId: string; iccid: string;
  smdpAddress: string; activationCode: string;
  lpaString: string;             // "LPA:1$<smdp>$<code>"
  raw?: unknown;
}

export interface EsimProvider {
  readonly name: string;
  listCatalog(): Promise<ProviderPackage[]>;
  getPackage(providerPackageId: string): Promise<ProviderPackage | null>;
  provision(req: ProvisionRequest): Promise<ProvisionResult>;
  getEsimStatus(providerEsimId: string): Promise<EsimStatus>;
  getUsage(providerEsimId: string): Promise<EsimUsage | null>;
  cancel?(providerEsimId: string): Promise<{ ok: boolean; refunded: boolean }>;
}
```

## MockProvider

- Deterministic in-memory catalog constant (~30 packages): China (1/3/5/10/20 GB × 7/15/30 days), Japan, Korea, Thailand, Vietnam, Singapore, Turkey, Asia regional, Europe regional, Global. Realistic costs ($2.5–$45). Stable IDs like `mock-cn-5gb-30d`.
- `provision`: derive everything from a hash of `orderRef` (deterministic → testable): ICCID `8985235…` + digits, activation code, `lpaString = "LPA:1$rsp.mock.zuiio.dev$" + token`.
- Failure simulation: fail when `hash(orderRef) % 100 < MOCK_PROVIDER_FAILURE_RATE*100`; magic package `mock-fail-test` always fails (retryable).
- `MOCK_PROVIDER_ASYNC=true`: return `{kind:"pending"}` and (dev-only) POST to own webhook after a short delay.
- `getEsimStatus`/`getUsage`: hash-derived, time-progressing usage.

## Webhook ingestion

`src/app/api/provider/webhook/route.ts`:
1. Verify `PROVIDER_WEBHOOK_SECRET` header
2. `normalizeWebhook(provider, payload)` → `ProviderWebhookEvent`
3. Insert into `webhook_events` with `on conflict (provider, event_id) do nothing` — returning-row check = idempotency
4. If newly inserted: write esims rows, transition order to `delivered`, trigger delivery email

## Swapping in the real provider later

Write `airalo.ts` (or similar) implementing `EsimProvider` + one case in the `index.ts` factory + one branch in `normalizeWebhook`. Nothing else changes.
