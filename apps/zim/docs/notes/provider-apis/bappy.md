# Bappy/OmaxTelecom API — Deep Research Report

> **Date:** 2026-07-11
> **Sources:** developer.omaxtelecom.com, omaxtelecom.com/products/bappy, context7.com/websites/developer_omaxtelecom_api/llms.txt, bappy.dog

---

## 1. Company Overview

- **Operator:** OMAX GROUP LTD (trading as OmaxTelecom)
- **UK Company No:** 16125244
- **Registered:** 71-75 Shelton Street, London, WC2H 9JQ
- **Regulation:** Ofcom PECN (General Conditions of Entitlement), UK GDPR
- **Founded:** 2024
- **Backbone:** BICS Tier-1 carrier, 350+ operators, 200+ countries

---

## 2. Two API Surfaces

Bappy exposes **two** REST API surfaces:

| Property | Bappy v1 (Link-based) | Bapi v1 (Activation-based) |
|---|---|---|
| **Base URL** | `https://api.omaxtelecom.com/bappy/v1` | `https://api.omaxtelecom.com/bapi/api/v1` |
| **Concept** | Links (UUID/ICCID lifecycle) | Package activation |
| **Auth** | OAuth2 Client Credentials → Bearer token | Bearer API key (`sk_live_...`) |
| **Use case** | Full lifecycle management | Simple provisioning |
| **Auth endpoint** | `id.omaxtelecom.com/.../token` | Bearer key directly |

**Key finding:** The product page marketing example uses the `bapi` surface. The developer portal (`developer.omaxtelecom.com`) documents the `bappy` surface in detail. For an EsimProvider adapter, the **`bappy/v1` surface** is the correct one — it provides full CRUD, usage, status, and cancellation support.

---

## 3. Authentication — OAuth2 Client Credentials

### Token Endpoint
```
POST https://id.omaxtelecom.com/realms/platform/protocol/openid-connect/token
```

### Request
```http
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id={your_client_id}
client_secret={your_client_secret}
```

### cURL Example
```bash
curl --request POST \
  --url 'https://id.omaxtelecom.com/realms/platform/protocol/openid-connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data 'grant_type=client_credentials&client_id={client_id}&client_secret={client_secret}'
```

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 300,
  "token_type": "Bearer",
  "scope": "openid"
}
```

### Token Usage
```
Authorization: Bearer {access_token}
```

### Token Refresh
- **No refresh tokens** (RFC 6749 §4.4.3 — Client Credentials doesn't issue refresh tokens)
- Token lifetime: `expires_in` seconds (observed: 300s / 5 minutes)
- On expiry, request a new token by re-calling the token endpoint
- **Implementation note:** Cache token, re-fetch ~30s before expiry

### Auth Errors
| HTTP | Error | Description |
|---|---|---|
| 401 | `invalid_client` | Client ID or Secret incorrect |
| 400 | `unsupported_grant_type` | Wrong `grant_type` |
| 400 | `invalid_request` | Missing required parameters |

### Credentials Source
- `client_id` and `client_secret` from: **https://console.omaxtelecom.com/**
- Sandbox credentials available in minutes (self-service, no sales calls)

---

## 4. API Base & Common Patterns

### Base URL
```
https://api.omaxtelecom.com/bappy/v1
```

### Request Headers (all authenticated endpoints)
```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

### Standard Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:00:00+00:00",
    "response_time_ms": 142
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "meta": {
      "current_page": 1,
      "last_page": 5,
      "per_page": 20,
      "total": 95,
      "from": 1,
      "to": 20
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Bearer token",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-15T10:00:00+00:00"
  }
}
```

### Link Identifiers
All `{identifier}` path params accept **either** a Link UUID or an ICCID:
```
GET /v1/links/550e8400-e29b-41d4-a716-446655440000   # by UUID
GET /v1/links/8901010000000000001                       # by ICCID
```

---

## 5. Complete Endpoint Reference

### 5.1 Health & Status (No Auth)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/health` | Health check |
| `GET` | `/v1/status` | System status / dependency checks |

### 5.2 Plans

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/v1/plans` | `region`, `coverage_type`, `sponsor_profile` | List all available plans |
| `GET` | `/v1/plans/{plan_id}` | — | Get single plan by UUID |
| `GET` | `/v1/plans/{plan_id}/coverage` | — | Full coverage (countries + operators + network types) |
| `GET` | `/v1/plans/regions` | — | List all regions (EU, AF, AS, LA, NA, OC) |

### 5.3 Links (SIM Management)

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| `GET` | `/v1/links` | `per_page`, `page`, `status`, `search` | List all links (paginated) |
| `POST` | `/v1/links` | `{ "plan_id": "uuid", "name": "optional" }` | Create new link (eSIM activation) |
| `GET` | `/v1/links/{identifier}` | — | Get link details (usage, activations, URLs, coverage) |
| `PUT` | `/v1/links/{identifier}` | `{ "status": "active" }` | Reactivate a suspended link |
| `GET` | `/v1/links/{identifier}/topup-plans` | — | Compatible top-up plans |
| `PUT` | `/v1/links/{identifier}/plans` | `{ "remove": ["activation-uuid"] }` | Cancel/remove activation |
| `GET` | `/v1/links/{identifier}/history` | `per_page`, `page` | Transaction history for link |
| `GET` | `/v1/links/{identifier}/network-status` | `live=true` | Live network status from provider |

### 5.4 SMS

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| `POST` | `/v1/sms` | `{ "link_id": "uuid-or-iccid", "message": "max 80 chars" }` | Send SMS (async) |
| `GET` | `/v1/sms` | `link_id={identifier}` | List SMS for a link |

### 5.5 Organization (Tenant)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/organization` | Profile (name, slug, status, pricing settings) |
| `GET` | `/v1/organization/balance` | Wallet balance + currency |

### 5.6 Transactions & Analytics

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/v1/transactions` | `link_id` | List all transactions (filterable) |
| `GET` | `/v1/transactions/stats` | `from`, `to` (Y-m-d) | Statistics for date range |
| `GET` | `/v1/transactions/analytics` | `period_days` (default 30) | Analytics |

### 5.7 Info

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/info/instructions` | eSIM installation steps (iOS + Android) |
| `GET` | `/v1/info/operators` | `search={country}` — search operators by country |

---

## 6. Detailed Request/Response Schemas

### 6.1 Create Link (POST /v1/links)

**Request:**
```json
{
  "plan_id": "uuid-of-plan",
  "name": "Optional display name"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My new SIM",
    "iccid": "8932042000000000000",
    "msisdn": "+31612345678",
    "lpa_profile": "LPA:1$example.com$ACTIVATION_CODE",
    "activation_url": "https://example.smdp.com",
    "amount_charged": "4.50",
    "currency": "EUR",
    "created_at": "2025-06-01T12:00:00+00:00"
  },
  "message": "Link created."
}
```

**Provisioning Flow (internal):**
1. Check wallet balance ≥ plan retail price
2. Fetch available eSIM ICCID from OmaxTelecom Core (filtered by sponsor profile)
3. Deduct plan price from wallet
4. Create provider endpoint with plan as addon
5. Create link + activation + transaction records
6. On provider failure → **automatic wallet refund**

### 6.2 Get Link Details (GET /v1/links/{identifier})

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My SIM",
    "iccid": "8932042000000000000",
    "status": "active",
    "created_at": "2025-01-10T08:30:00+00:00",
    "lpa_profile": "LPA:1$example.com$ACTIVATION_CODE",
    "apple_activation_url": "https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA:1$...",
    "android_activation_url": "https://esimsetup.android.com/esim_qrcode_provisioning?carddata=LPA:1$...",
    "msisdn": "+31612345678",
    "data_used_mb": 256.1234,
    "data_remaining_mb": 767.8766,
    "activations": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "plan_id": "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "plan_name": "Europe 1GB - 7 Days",
        "status": "active",
        "activation_date": "2025-01-15T10:00:00+00:00",
        "data_used_mb": 256.1234,
        "data_remaining_mb": 767.8766,
        "expiry_date": "2025-01-22T10:00:00+00:00",
        "coverage_countries": ["HR", "DE", "FR", "IT", "ES"]
      }
    ],
    "coverage_data": [
      {
        "iso2": "HR",
        "name": "Croatia",
        "operators": [
          {
            "operator_id": 123,
            "operator_name": "A1 HR",
            "network_types": "2G, 3G, 4G"
          }
        ]
      }
    ]
  }
}
```

### 6.3 Plan Object

```json
{
  "id": 1,
  "name": "Europe 1GB - 7 Days",
  "retail_price": "4.50",
  "currency": "EUR",
  "data_gb": 1.0,
  "validity_days": 7,
  "sponsor_profile": "IR1",
  "coverage_type": "regional",
  "regions": [
    { "code": "EU", "name": "Europe & UK" }
  ],
  "coverage": {
    "countries": ["HR", "DE", "FR", "IT", "ES"],
    "total_countries": 32,
    "total_operators": 85
  }
}
```

### 6.4 Plan Coverage (detailed)

```json
{
  "success": true,
  "data": {
    "plan_id": 1,
    "plan_name": "Europe 1GB - 7 Days",
    "countries": [
      {
        "country_id": 48,
        "iso2": "HR",
        "iso3": "HRV",
        "name": "Croatia",
        "operators": [
          {
            "operator_name": "A1 HR",
            "sponsor_name": "A1 Telekom Austria",
            "tadig": "HRVVIP",
            "network_types": "2G, 3G, 4G"
          },
          {
            "operator_name": "T-Mobile HR",
            "sponsor_name": "Deutsche Telekom",
            "tadig": "HRVTMO",
            "network_types": "2G, 3G, 4G, 5G"
          }
        ]
      }
    ],
    "total_countries": 32,
    "total_operators": 85
  }
}
```

### 6.5 Regions

```json
{
  "success": true,
  "data": [
    { "code": "EU", "name": "Europe & UK" },
    { "code": "AF", "name": "Africa" },
    { "code": "AS", "name": "Asia" },
    { "code": "LA", "name": "Latin America" },
    { "code": "NA", "name": "North America" },
    { "code": "OC", "name": "Oceania" }
  ]
}
```

### 6.6 Topup Plans

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Europe Topup 1GB - 7 Days",
      "retail_price": "4.50",
      "currency": "EUR",
      "data_gb": 1.0,
      "validity_days": 7,
      "coverage": {
        "countries": ["HR", "DE", "FR", "IT", "ES"],
        "total_countries": 32,
        "total_operators": 85
      }
    }
  ]
}
```

### 6.7 Link History (Transaction per Link)

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "tx-uuid",
        "type": "activation",
        "amount": "4.50",
        "currency": "EUR",
        "plan_name": "Europe 1GB - 7 Days",
        "price_per_link": null,
        "billing_period": null,
        "activation_id": "act-uuid",
        "charged_at": "2025-01-15T10:00:00+00:00",
        "created_at": "2025-01-15T10:00:00+00:00"
      },
      {
        "id": "tx-uuid-2",
        "type": "topup",
        "amount": "10.00",
        "currency": "EUR",
        "plan_name": "Europe 3GB - 30 Days",
        "activation_id": "act-uuid-2",
        "charged_at": "2025-02-01T14:30:00+00:00",
        "created_at": "2025-02-01T14:30:00+00:00"
      },
      {
        "id": "tx-uuid-3",
        "type": "monthly_link_fee",
        "amount": "15.00",
        "currency": "EUR",
        "plan_name": null,
        "price_per_link": "0.5000",
        "billing_period": "2025-01",
        "activation_id": null,
        "charged_at": "2025-02-01T00:00:00+00:00",
        "created_at": "2025-02-01T00:05:00+00:00"
      }
    ],
    "meta": {
      "current_page": 1,
      "last_page": 2,
      "per_page": 15,
      "total": 18,
      "from": 1,
      "to": 15
    }
  }
}
```

**Transaction types:** `activation`, `topup`, `refund`, `monthly_link_fee`

### 6.8 eSIM Installation Instructions

```json
{
  "success": true,
  "data": {
    "ios": {
      "title": "iOS Installation",
      "steps": [
        "Go to Settings > Cellular > Add Cellular Plan.",
        "Scan the QR code or enter the activation details manually.",
        "Label the plan (e.g., 'Travel Data').",
        "Set the eSIM as your data line if needed.",
        "Turn on Data Roaming under Cellular Data Options."
      ]
    },
    "android": {
      "title": "Android Installation",
      "steps": [
        "Go to Settings > Network & Internet > SIMs > Add SIM.",
        "Choose 'Download a SIM instead' or scan QR code.",
        "Follow the on-screen prompts to activate.",
        "Enable Mobile Data and Data Roaming."
      ]
    }
  }
}
```

---

## 7. Error Codes

| Code | HTTP | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid Bearer token |
| `INSUFFICIENT_BALANCE` | 402 | Wallet balance too low (details: required, available, currency) |
| `ORG_SUSPENDED` | 403 | Organization suspended |
| `NOT_FOUND` | 404 | Resource not found |
| `PLAN_NOT_FOUND` | 404 | Plan not found or not enabled for org |
| `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `INVALID_STATUS_CHANGE` | 422 | Status transition not allowed |
| `INVALID_STATE` | 422 | Resource in invalid state |
| `INVALID_PLAN` | 422 | Plan not available for operation |
| `CONFIG_ERROR` | 500 | Server misconfiguration |
| `PROVISIONING_ERROR` | 502 | Provider API error (wallet refunded) |
| `PROVISIONING_FAILED` | 502 | Provider returned no result (wallet refunded) |
| `PROVIDER_ERROR` | 502 | Provider operation failed |

**Error normalization:** The API does NOT expose underlying operator/provider names. Internal provider details are abstracted away.

---

## 8. Webhooks

### 8.1 Supported Event Types
Per the product page, Bappy delivers real-time webhook notifications for:

| Event | Description |
|---|---|
| `sim.activated` | eSIM successfully activated on device |
| `sim.expired` | Plan/expiry reached |
| `sim.usage_threshold` | Data usage threshold crossed |
| `sms.delivered` | SMS confirmed delivered |
| `bulk.completed` | Bulk provisioning job finished |

### 8.2 Webhook Configuration
- Configured via **OmaxTelecom Console** (console.omaxtelecom.com) or during onboarding
- HTTPS endpoint required
- Sandbox webhook validation available during testing
- The platform confirms "one webhook for activation" as part of the core integration pattern

### 8.3 Signature Verification
**[UNVERIFIED — exact HMAC details not found in public docs]**

Typical pattern for eSIM platforms (based on industry norms and related platforms):
- HMAC-SHA256 of payload body using a shared secret
- Secret provided at webhook creation time
- Verify via `X-Signature` or similar header

**Recommendation:** Contact OmaxTelecom support at **bappy@omaxtelecom.com** to confirm:
- Exact signature header name
- HMAC algorithm (SHA-256 vs SHA-512)
- Secret rotation policy
- Webhook retry/backoff schedule

### 8.4 Webhook Payload Shape
**[UNVERIFIED — likely follows standard envelope]**
```json
{
  "event": "sim.activated",
  "data": {
    "link_id": "uuid",
    "iccid": "8932042000000000000",
    "activation_id": "act-uuid",
    "status": "active"
  },
  "timestamp": "2025-01-15T10:05:00+00:00"
}
```

---

## 9. Rate Limits

**[NOT DOCUMENTED in public API docs]**

No rate limit headers, 429 status codes, or throttling documentation found in the public developer portal.

**Recommendations:**
- Implement exponential backoff on any 429 response
- Cache token to avoid excessive auth calls
- Use pagination (`per_page` up to 100) to minimize list calls
- Monitor `meta.response_time_ms` for performance

---

## 10. Sandbox & Testing

### Access
1. Sign up at **https://console.omaxtelecom.com/**
2. Sandbox credentials provided in minutes (self-service)
3. Test in sandbox → preview responses → validate webhooks → go live

### Environment Differences
| Property | Sandbox | Production |
|---|---|---|
| API base | Same (sandbox toggle in console) | Same |
| Auth endpoint | Same `id.omaxtelecom.com` | Same |
| Credentials | Test `client_id` / `client_secret` | Live `client_id` / `client_secret` |
| API keys | Test keys (`sk_test_...`) | Live keys (`sk_live_...`) |
| Provisioning | Simulated/test eSIM | Real eSIM activation |

### Production Onboarding
- Average go-live: **under 7 days**
- Production access granted within **48 hours** of request

---

## 11. Commercial Terms

| Item | Value |
|---|---|
| Setup fee | EUR 500 (one-time) |
| Match credit | EUR 500 (credited up to EUR 1,000 total) |
| Monthly minimums | None |
| Revenue share | None |
| Lock-in contracts | None |
| Pricing model | Prepaid wallet (wholesale) |
| Currency | EUR |
| Auto-refund | Yes (on provider provisioning failure) |
| Price_per_link | Configurable per org |

### Sample Pricing (from product page)
| Package | Your Cost | Retail | Margin |
|---|---|---|---|
| Turkey 0.5GB/1d | €0.30 | €0.51 | +70% |
| Croatia 1GB/7d | €1.03 | €1.78 | +73% |
| Germany 3GB/15d | €3.35 | €5.79 | +73% |
| Japan 5GB/30d | €9.00 | €15.56 | +73% |
| US 20GB/30d | €36.37 | €62.91 | +73% |

---

## 12. White-Label Integration

- **100% white-label:** Your brand, your pricing, your customers
- **Storefront option:** No-code branded eSIM shop (EUR 500 setup)
- **API option:** Full programmatic control
- **OmaxTelecom remains invisible** — handles connectivity issues behind scenes
- **CRM dashboard:** Real-time activations, usage, support tickets
- **First-line support:** Omax handles eSIM/connectivity issues; you handle customer-facing branding

---

## 13. SDKs

**Available (per product page):**
- Node.js
- Python
- Go

**[SDK repository URLs not found in public docs]** — likely distributed via onboarding or available upon request.

**Code examples available in docs:** cURL, JavaScript, Python, Java, Go, C#, Kotlin, Objective-C, PHP, Ruby, Swift

---

## 14. Multi-Tenancy & Data Isolation

- Every authenticated request is bound to an **organization** (tenant) derived from the token
- All Links, transactions, balance, and SMS are scoped to that organization
- No cross-tenant access possible
- Provider/operator names are **never exposed** in the public API

---

## 15. Key Design Decisions for Adapter Implementation

### Core Concept Mapping (Bappy → EsimProvider)

| EsimProvider Method | Bappy Endpoint | Notes |
|---|---|---|
| `listCatalog()` | `GET /v1/plans` + `GET /v1/plans/regions` | Plans + regions |
| `getPackage(id)` | `GET /v1/plans/{plan_id}` | Single plan details |
| `provision(planId)` | `POST /v1/links` | Returns UUID, ICCID, LPA, activation URLs |
| `getStatus(linkId)` | `GET /v1/links/{identifier}` | Usage, activations, status |
| `getUsage(linkId)` | `GET /v1/links/{identifier}` | `data_used_mb`, `data_remaining_mb` from response |
| `cancel(linkId)` | `PUT /v1/links/{identifier}/plans` | Remove activation via `{"remove": ["activation-uuid"]}` |
| `getBalance()` | `GET /v1/organization/balance` | Wallet balance |
| `listTransactions()` | `GET /v1/transactions` + `/links/{id}/history` | Org-wide or per-link |

### Status Mapping

| Bappy Status | EsimProvider Status |
|---|---|
| `active` | `ACTIVE` |
| `suspended` | `SUSPENDED` |
| `inactive` | `INACTIVE` / `EXPIRED` |

### Transaction Type Mapping

| Bappy Type | Description |
|---|---|
| `activation` | Initial link creation charge |
| `topup` | Plan topup |
| `refund` | Refund for failed operations |
| `monthly_link_fee` | Monthly per-link fee |

### Auth Token Caching

```typescript
// Token refresh strategy
const TOKEN_BUFFER_SECONDS = 30;

class OmaxAuthManager {
  private token: string | null = null;
  private expiresAt: number = 0;

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt) {
      return this.token;
    }
    // Re-fetch
    const resp = await fetch(
      'https://id.omaxtelecom.com/realms/platform/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.OMAX_CLIENT_ID!,
          client_secret: process.env.OMAX_CLIENT_SECRET!,
        }),
      }
    );
    const data = await resp.json();
    this.token = data.access_token;
    this.expiresAt = Date.now() + (data.expires_in - TOKEN_BUFFER_SECONDS) * 1000;
    return this.token;
  }
}
```

### Provisioning Flow

```
1. GET /organization/balance     → verify sufficient funds
2. GET /plans                    → find plan_id for requested package
3. POST /links { plan_id }       → create link
   → Returns: UUID, ICCID, LPA profile, activation URLs, amount_charged
4. (Async) Webhook: sim.activated → confirms eSIM installed on device
```

### Cancellation Flow

```
1. GET /links/{id}               → get activations[].id
2. PUT /links/{id}/plans         → { "remove": ["activation-uuid"] }
```

---

## 16. Information Gaps (Need Confirmation from OmaxTelecom)

| Gap | Impact | Recommendation |
|---|---|---|
| **Rate limits** | No public docs | Implement backoff; ask during onboarding |
| **Webhook HMAC details** | Signature algorithm unknown | Ask support for signing spec |
| **Webhook retry policy** | Unknown retry/backoff | Ask; assume exponential |
| **Sandbox base URL** | Same as production? | Verify during sandbox onboarding |
| **SDK repository URLs** | Not published | Request from support |
| **Idempotency keys** | Not documented | Likely not supported; use idempotent POST pattern |
| **Bulk activation** | Product page mentions "up to 500 physical SIMs per request" | Check if `/v1/links` accepts array |
| **API versioning** | Only v1 documented | No v2 announced |
| **Network status response schema** | No example in docs | Check response after live=true call |

---

## 17. Contact & Resources

| Resource | URL |
|---|---|
| Developer Portal | https://developer.omaxtelecom.com/ |
| API Docs (full reference) | https://developer.omaxtelecom.com/bundle-sim |
| Interactive API Explorer | https://developer.omaxtelecom.com/api/bundle-sim |
| Console (credentials) | https://console.omaxtelecom.com/ |
| Product Page | https://www.omaxtelecom.com/products/bappy |
| Marketing Site | https://bappy.dog/ |
| System Status | https://status.omaxtelecom.com/ |
| Support Email | bappy@omaxtelecom.com |
| Phone | +44 20 805 861 85 |
| Docs (additional) | https://docs.omaxtelecom.com |
