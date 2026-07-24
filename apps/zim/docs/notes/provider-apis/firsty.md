# Firsty Partners API — Complete Research Report

**API Version:** 3.4.0  
**OpenAPI Spec:** https://developers.firsty.app/openapi.yaml  
**Docs:** https://developers.firsty.app  
**Contact:** dev@firsty.app (technical), partners@firsty.app (business)  
**ISO 27001 certified**

---

## 1. Base URLs

| Environment | Base URL |
|---|---|
| **Production** | `https://connect.firsty.app/api/v3` |
| **Staging (Sandbox)** | `https://connect.test.firsty.app/api/v3` |

All endpoint paths below are relative to the base URL. Example: `POST /auth/token` → `https://connect.firsty.app/api/v3/auth/token`.

**Sandbox:** Free sandbox environment with real eSIM provisioning to test end-to-end. Credentials obtainable in ~60 seconds via sandbox signup. Sandbox provisions real profiles against Tier-1 carriers.

---

## 2. Authentication — OAuth2 Client Credentials

### Flow

1. Contact Firsty support to receive `client_id` (6-digit numeric, e.g. `550840`) and `client_secret`
2. Call `POST /auth/token` to get a Bearer token
3. Include `Authorization: Bearer {token}` on all subsequent requests (except `/auth/token` itself)

### Token Endpoint

```
POST /auth/token
Content-Type: application/x-www-form-urlencoded
```

**Request Body (form-urlencoded):**

| Field | Type | Required | Pattern | Description |
|---|---|---|---|---|
| `grant_type` | string | YES | — | Must be `"client_credentials"` |
| `client_id` | string | YES | `^(?!89)[0-9]{6}$` | 6-digit client identifier |
| `client_secret` | string | YES | — | Client authentication secret |

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

- **Token lifetime:** 24 hours (86400 seconds)
- **Refresh strategy:** Request a new token when expired (no refresh token; just re-authenticate)
- **Auth URL:** `https://connect.firsty.app/api/v3/auth/token`

### Token Error Responses

| Status | Meaning |
|---|---|
| 400 | Bad Request — missing or invalid parameters |
| 401 | Unauthorized — invalid credentials |
| 429 | Rate limit exceeded |

---

## 3. All Endpoints

### 3.1 eSIM Lifecycle Management

#### `POST /esims` — Order an eSIM
Orders an eSIM and creates a new profile. Returns activation code (LPA string) + profile reference.

**Request Body (JSON):**
```json
{
  "externalProfileId": "my-customer-123"
}
```
- `externalProfileId` — optional, string 1-255 chars, unique per client

**Response (201):**
```json
{
  "data": {
    "profileReference": "1234567890123456",
    "externalProfileId": "my-customer-123",
    "esimReference": "123456000000000001",
    "iccid": "89012345678901234567",
    "activationCode": "LPA:1$provider.example.com$ACTIVATION_CODE_HERE",
    "status": "released",
    "lifecycleStatus": "preactive",
    "createdAt": "2019-08-24T14:15:22Z"
  }
}
```

**Error codes:** 401, 403, 404 (no eSIM found), 409 (conflict — idempotency in-flight or duplicate externalProfileId), 422 (idempotency body mismatch), 429, 500

---

#### `GET /profiles/{profileReference}/esims` — List eSIMs for a profile

**Path params:** `profileReference` (16-digit numeric)
**Query params:** `limit` (1-100, default 20), `cursor`, `status` (released|downloaded|installed|enabled|disabled|deleted|faulted)

**Response (200):**
```json
{
  "data": [ { "profileReference": "...", "esimReference": "...", "status": "...", "lifecycleStatus": "...", "createdAt": "..." } ],
  "pagination": { "limit": 20, "hasMore": true, "nextCursor": "..." }
}
```

---

#### `GET /profiles/{profileReference}/esims/{esimReference}` — Get eSIM details

**Path params:** `profileReference` (16-digit), `esimReference` (18-digit)

**Response (200):**
```json
{
  "data": {
    "profileReference": "1234567890123456",
    "externalProfileId": "my-customer-123",
    "esimReference": "123456000000000001",
    "iccid": "89012345678901234567",
    "eid": "89049032000000000000000000000001",
    "activationCode": "LPA:1$provider.example.com$ACTIVATION_CODE_HERE",
    "status": "released",
    "lifecycleStatus": "preactive",
    "provisioned": true,
    "createdAt": "2019-08-24T14:15:22Z",
    "updatedAt": "2019-08-24T14:15:22Z"
  }
}
```

---

#### `PATCH /profiles/{profileReference}/esims/{esimReference}/lifecycle` — eSIM lifecycle

**Available operations:** `suspend`, `reactivate`, `terminate`

**Request Body:**
```json
{
  "operation": "suspend"
}
```
- `action` is accepted as an alias for `operation`

**Response (200):**
```json
{
  "data": {
    "profileReference": "string",
    "esimReference": "123456000000000001",
    "iccid": "string",
    "status": "released",
    "lifecycleStatus": "preactive",
    "updatedAt": "2019-08-24T14:15:22Z"
  }
}
```

**Error codes:** 400, 401, 403, 404, 409 (invalid state transition), 429, 500

---

#### `GET /profiles/{profileReference}/esims/{esimReference}/usage` — Get eSIM usage

**Response (200):**
```json
{
  "data": {
    "profileReference": "string",
    "esimReference": "123456000000000001",
    "iccid": "string",
    "packages": [ { /* per-package usage */ } ],
    "totals": { /* aggregate data used/remaining */ }
  }
}
```

---

### 3.2 Packages (Data Plans)

#### `GET /profiles/{profileReference}/esims/{esimReference}/packages` — List packages

**Query params:** `limit` (1-100, default 20), `cursor`, `status` (active|throttled|exhausted|expired|removed)

#### `POST /profiles/{profileReference}/esims/{esimReference}/packages` — Order a package

**Request Body:**
```json
{
  "planReference": "C123456XYZDUSR",
  "externalTransactionId": "order-12345"
}
```
- `planReference` — required, 14-char opaque token
- `externalTransactionId` — optional, 1-255 chars, unique per client

**Response (200):**
```json
{
  "data": {
    "packageReference": "C123456XYZDUSR_A1B2C3D4",
    "externalTransactionId": "order-12345",
    "profileReference": "string",
    "externalProfileId": "my-customer-123",
    "esimReference": "123456000000000001",
    "iccid": "string",
    "planReference": "C123456XYZDUSR",
    "type": "data",
    "countryCode": "string",
    "status": "active",
    "recurring": true,
    "activatedAt": "2019-08-24T14:15:22Z",
    "expiresAt": "2019-08-24T14:15:22Z"
  }
}
```

**Error codes:** 400 (invalid / not available for region), 401, 403, 404, 409, 422, 429, 500

#### `GET /profiles/{profileReference}/esims/{esimReference}/packages/history` — Package history
Returns all packages including expired/removed, with usage data. Paginated.

#### `GET /profiles/{profileReference}/esims/{esimReference}/packages/{packageReference}` — Package details
Returns detailed package info including `packagePlan` and `usage` objects.

#### `DELETE /profiles/{profileReference}/esims/{esimReference}/packages/{packageReference}` — Remove package
Sets status to `removed`. Idempotent — returns same result if already removed.

---

### 3.3 Catalog

#### `GET /catalog/packages` — List available package plans
**Query params:** `limit` (1-100), `cursor`, `countryCode` (ISO 3166-1 alpha-2, e.g. `US`)
Returns paginated plans. Each plan is region-specific with recurring/one-time setting.

#### `GET /catalog/regions` — List available regions
Returns paginated list of regions where packages are available.

#### `GET /catalog/devices` — List compatible devices
Returns hierarchical device catalog organized by brand (Apple, Samsung, Google, etc.).

#### `GET /catalog/devices/compatibility` — Check device compatibility
**Query params:** `brand` (required), `model` (required), `variant` (optional)
**Response:** `{ "data": { "compatible": true } }`

#### `GET /catalog/coverage/{regionCode}` — Network coverage
**Path params:** `regionCode` (ISO 3166-1 alpha-2)
**Response:** `{ "data": { "countryCode": "US", "countryCodeAlpha3": "USA", "name": "United States", "networks": [...] } }`

---

### 3.4 Number Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/number/{profileReference}/assignments` | List phone numbers (query: `esimReference` required) |
| POST | `/number/{profileReference}/allocate` | Allocate a phone number |
| DELETE | `/number/{profileReference}/{numberId}` | Release a phone number |

**Allocate body:**
```json
{
  "esimReference": "123456000000000001",
  "countryCode": "US",
  "type": "local",
  "isPrimary": true,
  "customerInfo": { "firstName": "John", "lastName": "Doe", "companyName": "Acme Corp", "email": "john@example.com", "phone": "+31612345678" },
  "address": { "street": "Keizersgracht", "streetNumber": "123", "city": "Amsterdam", "state": "Noord-Holland", "postalCode": "1015 CJ", "countryCode": "NL" }
}
```
- NumberType: `local` | `mobile` | `tollfree`

---

### 3.5 Porting

Workflow: **Create → Modify → Submit → Execute**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/porting/{profileReference}/requests` | List porting requests (query: `esimReference` required, optional `status` filter) |
| POST | `/porting/{profileReference}/request` | Create porting request (draft) |
| GET | `/porting/{profileReference}/{requestId}` | Get porting request details |
| PATCH | `/porting/{profileReference}/{requestId}` | Modify porting request (draft only) |
| DELETE | `/porting/{profileReference}/{requestId}` | Delete (draft/rejected only) |
| POST | `/porting/{profileReference}/{requestId}/submit` | Submit to carrier |
| POST | `/porting/{profileReference}/{requestId}/execute` | Execute / reschedule |
| POST | `/porting/{profileReference}/{requestId}/cancel` | Cancel (submitted/approved/scheduled) |

**Porting statuses:** `draft` → `submitted` → `approved` / `rejected` → `scheduled` → `completed` / `failed`

---

## 4. Two-Step Provisioning Flow

Firsty uses a **two-step provisioning** model:

1. **Step 1 — `POST /esims`** → Creates eSIM profile, returns `esimReference` + `activationCode` (QR code/LPA string). **Instant.**
2. **Step 2 — `POST /profiles/{profileReference}/esims/{esimReference}/packages`** → Attaches data plan when user is ready to buy.

**Benefit:** QR code generated upfront at checkout. Plan attachment happens after payment. Ideal for marketplaces, gift-card flows, trial-to-paid conversions.

---

## 5. Idempotency

**Header:** `X-Idempotency-Key: <unique-string>` (optional, max 255 chars)
**Applicable to:** All mutating endpoints (POST, PATCH, DELETE)
**TTL:** 48 hours

### Behavior Matrix

| Same Key + Same Body | Same Key + Different Body | Same Key + In-Flight Request |
|---|---|---|
| Returns cached response (no duplicate) | Returns **422** error | Returns **409** Conflict + `Retry-After` header |

### Request Body Fingerprinting

- Bodies compared via **canonical JSON** (recursive key sort) + **SHA-256 hash**
- `{"a":1,"b":2}` and `{"b":2,"a":1}` are treated as **identical**
- Whitespace differences are **ignored**
- URL parameters and headers are **NOT** included

### Best Practices
- Use UUIDs or client-generated unique strings
- Store keys on your side to support retries
- Don't reuse keys across different operations

---

## 6. Rate Limiting

| Endpoint Category | Limit |
|---|---|
| General endpoints | **10 requests/second** |
| Auth endpoint (`/auth/token`) | **30 requests/second** |

### Rate Limit Headers

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | Max requests in window |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | Unix timestamp when window resets |

**On 429:** Response includes `Retry-After` header (seconds to wait).

---

## 7. Error Handling

### Standard Error (RFC 9457 Problem Details)

```json
{
  "type": "https://developers.firsty.app/errors/not-found",
  "title": "Not found",
  "status": 404,
  "detail": "eSIM not found"
}
```

### Validation Error (RFC 9457 with extensions)

```json
{
  "type": "https://developers.firsty.app/errors/validation-failed",
  "title": "Validation failed",
  "status": 400,
  "detail": "Your request is not valid.",
  "errors": [
    { "field": "number", "detail": "Must be a valid phone number starting with +" }
  ]
}
```

### Error URI Reference Table

| URI | HTTP Status |
|---|---|
| `https://developers.firsty.app/errors/bad-request` | 400 |
| `https://developers.firsty.app/errors/unauthorized` | 401 |
| `https://developers.firsty.app/errors/not-found` | 404 |
| `https://developers.firsty.app/errors/conflict` | 409 |
| `https://developers.firsty.app/errors/validation-failed` | 400 |

### HTTP Status Code Reference

| Code | Meaning | Retry? |
|---|---|---|
| 200 | Success | — |
| 201 | Created | — |
| 204 | Deleted | — |
| 400 | Bad request / validation | No — fix input |
| 401 | Unauthorized | No — refresh token |
| 403 | Forbidden | No — check permissions |
| 404 | Not found | No |
| 409 | Idempotency in-flight | Yes — `Retry-After` header |
| 422 | Idempotency body mismatch | No — fix key/body |
| 429 | Rate limit exceeded | Yes — `Retry-After` header |
| 500 | Internal server error | Yes — retry with same idempotency key |

---

## 8. Webhooks

### Security — Standard Webhooks Spec

**Headers on every webhook delivery:**

| Header | Description |
|---|---|
| `webhook-id` | Unique identifier for the event |
| `webhook-timestamp` | Unix timestamp (seconds) of delivery attempt |
| `webhook-signature` | HMAC-SHA256 signature (format: `v1,{base64-signature}`) |

### Signature Verification

```
1. Concatenate: {webhook-id}.{webhook-timestamp}.{raw-request-body}
2. Compute HMAC-SHA256 using your webhook secret
3. Base64-encode the result
4. Compare with value in webhook-signature header (strip "v1," prefix)
5. Reject if mismatch or if webhook-timestamp is outside ±5 min window
```

### All Webhook Events

**eSIM Events:**

| Event | Trigger | Key Payload Fields |
|---|---|---|
| `esim.assigned` | eSIM created and assigned with activation code | profileReference, esimReference, iccid |
| `esim.downloaded` | Profile downloaded to device | profileReference, esimReference, iccid |
| `esim.installed` | Profile installed on eSIM chip | profileReference, esimReference, iccid |
| `esim.enabled` | Profile enabled on device | profileReference, esimReference, iccid |
| `esim.disabled` | Profile disabled on device | profileReference, esimReference, iccid |
| `esim.deleted` | Profile deleted from device | profileReference, esimReference, iccid |
| `esim.mccswitch` | Network/roaming switch | + previousCountry, previousMcc, previousMnc, newCountry, newMcc, newMnc |

**Package Events:**

| Event | Trigger | Key Payload Fields |
|---|---|---|
| `package.created` | New package provisioned | packageReference, profileReference, esimReference, iccid, planReference, countryCode |
| `package.activated` | Package active and ready | same as above |
| `package.ended` | Package expired/exhausted/removed | above + `reason` ("expired"/"exhausted"/"removed") |
| `package.usage` | Usage milestone (33%, 66%, 100%) | above + dataUsedMb, dataRemainingMb, percentageUsed |
| `package.usage.threshold` | Threshold crossed (33% or 66%) | above + thresholdPercent, usedAmount, remainingAmount, capacityTotal |
| `package.throttled` | Recurring data exhausted this cycle | same fields |
| `package.exhausted` | Non-recurring data fully consumed | same fields |
| `package.renewed` | Recurring package renewed | same + nextRenewalAt, remainingAmount |

**Profile Events:**

| Event | Trigger |
|---|---|
| `profile.suspended` | Profile + all eSIMs suspended |
| `profile.reactivated` | Profile + all eSIMs reactivated |
| `profile.terminated` | Profile + all eSIMs terminated |

**Porting Events:**

| Event | Trigger |
|---|---|
| `porting.approved` | Approved by donor carrier |
| `porting.rejected` | Rejected by donor carrier |
| `porting.completed` | Porting completed successfully |
| `porting.failed` | Porting failed |

### Webhook Payload Template

All events follow this shape:
```json
{
  "type": "esim.assigned",
  "timestamp": "2026-01-24T14:30:00Z",
  "data": {
    "profileReference": "1234567890123456",
    "esimReference": "123456000000000001",
    "iccid": "89012345678901234567"
  }
}
```

### Delivery & Retry

| Attempt | Delay |
|---|---|
| 1 | Immediate |
| 2 | 30 seconds |
| 3 | 1 minute |
| 4 | 5 minutes |
| 5 | 15 minutes |
| 6 | 30 minutes |
| 7 | 1 hour |
| 8 | 2 hours |
| 9 | 4 hours |
| 10 | 8 hours |

- **Max:** 10 attempts over ~24 hours. After that, marked permanently failed (request replay via support).
- **Retry triggers:** HTTP 5xx, 408, timeout (30s), connection errors
- **Success:** HTTP 2xx within 30 seconds
- **Replay window:** 7 days
- **Ordering:** Best-effort, NOT guaranteed — design handlers to be idempotent
- **Duplicate detection:** Use `webhook-id` as idempotency key

---

## 9. Key Identifiers

All identifiers are **opaque strings** — do NOT parse or decode.

| Identifier | Pattern | Length | Example |
|---|---|---|---|
| `profileReference` | `^(?!89)[0-9]{16}$` | 16 digits | `1234567890123456` |
| `esimReference` | `^(?!89)[0-9]{18}$` | 18 digits | `123456000000000001` |
| `packageReference` | `^[CS][0-9A-Z]{6}[0-9A-Z]{3}[DMV][A-Z]{2}[RN]_[0-9A-Z]{8}$` | 23 chars | `C123456XYZDUSR_A1B2C3D4` |
| `planReference` | `^[CS][0-9A-Z]{6}[0-9A-Z]{3}[DMV][A-Z]{2}[RN]$` | 14 chars | `C123456XYZDUSR` |
| `client_id` | `^(?!89)[0-9]{6}$` | 6 digits | `550840` |

---

## 10. Enums

| Enum | Values |
|---|---|
| **EsimStatus** | `released`, `downloaded`, `installed`, `enabled`, `disabled`, `deleted`, `faulted` |
| **LifecycleStatus** | `preactive`, `active`, `suspended`, `terminated`, `faulted`, `stale` (nullable) |
| **PackageStatus** | `active`, `throttled`, `exhausted`, `expired`, `removed` |
| **PackageType** | `data`, `sms`, `voice` |
| **NumberType** | `local`, `mobile`, `tollfree` |
| **NumberStatus** | `active`, `suspended`, `released` |
| **PortingRequestStatus** | `draft`, `submitted`, `approved`, `rejected`, `scheduled`, `completed`, `failed`, `cancelled` |

---

## 11. Pagination

All list endpoints use cursor-based pagination:

**Request:** `?limit=20&cursor=<opaque-token>`

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "MjAyNC0wMS0xNVQxMDowMDowMC4wMDBaOjQy"
  }
}
```

Pass `nextCursor` as the `cursor` parameter for the next page. When `hasMore` is `false`, you've reached the end.

---

## 12. Code Examples

### TypeScript — Full Auth + Provisioning Flow

```typescript
const BASE_URL = "https://connect.firsty.app/api/v3";
// Sandbox: "https://connect.test.firsty.app/api/v3"

// --- 1. Get Access Token ---
const tokenRes = await fetch(`${BASE_URL}/auth/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: "YOUR_6_DIGIT_ID",
    client_secret: "YOUR_SECRET",
  }),
});
const { access_token } = await tokenRes.json();

const headers = {
  Authorization: `Bearer ${access_token}`,
  "Content-Type": "application/json",
};

// --- 2. Order eSIM (Step 1) ---
const esimRes = await fetch(`${BASE_URL}/esims`, {
  method: "POST",
  headers: {
    ...headers,
    "X-Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    externalProfileId: "customer-abc-123",
  }),
});
const { data: esim } = await esimRes.json();
// esim.activationCode → QR code / LPA string
// esim.esimReference → use for step 2

// --- 3. Attach Data Plan (Step 2) ---
const planRes = await fetch(
  `${BASE_URL}/profiles/${esim.profileReference}/esims/${esim.esimReference}/packages`,
  {
    method: "POST",
    headers: {
      ...headers,
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      planReference: "C123456XYZDUSR",
      externalTransactionId: "txn-789",
    }),
  }
);
const { data: pkg } = await planRes.json();
// pkg.status === "active"
```

### TypeScript — Check Usage

```typescript
const usageRes = await fetch(
  `${BASE_URL}/profiles/${profileRef}/esims/${esimRef}/usage`,
  { headers }
);
const { data: usage } = await usageRes.json();
```

### TypeScript — Suspend eSIM

```typescript
await fetch(
  `${BASE_URL}/profiles/${profileRef}/esims/${esimRef}/lifecycle`,
  {
    method: "PATCH",
    headers: {
      ...headers,
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({ operation: "suspend" }),
  }
);
```

### TypeScript — Terminate eSIM

```typescript
await fetch(
  `${BASE_URL}/profiles/${profileRef}/esims/${esimRef}/lifecycle`,
  {
    method: "PATCH",
    headers: {
      ...headers,
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({ operation: "terminate" }),
  }
);
```

### TypeScript — Webhook Signature Verification

```typescript
import crypto from "crypto";

function verifyWebhook(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string
): boolean {
  // Check timestamp freshness (±5 min)
  const tolerance = 300;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(webhookTimestamp)) > tolerance) return false;

  // Compute expected signature
  const toSign = `${webhookId}.${webhookTimestamp}.${body}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(toSign)
    .digest("base64");

  // Compare (support multiple signatures separated by spaces)
  const signatures = webhookSignature.split(" ");
  return signatures.some((sig) => {
    const [version, value] = sig.split(",");
    return version === "v1" && value === expected;
  });
}
```

### TypeScript — Token Management (with auto-refresh)

```typescript
class FirstyClient {
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private baseUrl: string,
    private clientId: string,
    private clientSecret: string
  ) {}

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const res = await fetch(`${this.baseUrl}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
    const data = await res.json();
    this.token = data.access_token;
    // Refresh 5 min before expiry
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return this.token;
  }

  async request(path: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    return fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }
}
```

---

## 13. SDKs / Official Libraries

No official public SDK found on GitHub or npm. The API is a standard REST API documented via OpenAPI 3.1.0 spec.

**OpenAPI spec download:** `https://developers.firsty.app/openapi.yaml`

Generate clients with: `openapi-typescript`, `openapi-fetch`, `openapi-generator` (any language).

---

## 14. Adapter Interface Mapping

For building an EsimProvider adapter:

| Adapter Method | Firsty Endpoint(s) |
|---|---|
| `listCatalog()` | `GET /catalog/packages`, `GET /catalog/regions` |
| `getPackage()` | `GET /catalog/packages` (filtered by countryCode) |
| `provision()` | `POST /esims` (step 1) → `POST .../packages` (step 2) |
| `getEsimStatus()` | `GET /profiles/{ref}/esims/{ref}` → `status` + `lifecycleStatus` |
| `getUsage()` | `GET /profiles/{ref}/esims/{ref}/usage` |
| `cancel()` | `PATCH .../lifecycle` with `{ operation: "terminate" }` |
| `listPackages()` | `GET /profiles/{ref}/esims/{ref}/packages` |
| `removePackage()` | `DELETE /profiles/{ref}/esims/{ref}/packages/{pkgRef}` |
