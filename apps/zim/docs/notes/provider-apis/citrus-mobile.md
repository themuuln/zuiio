# Citrus Mobile API — Integration Spec

## Auth
- Bearer token: `Authorization: Bearer rsk_<key>`
- Key managed at citrusmobile.com/developer
- 100 req/min rate limit

## Base URL
`https://citrusmobile.com/api/v2/reseller`

## OpenAPI Spec
`https://citrusmobile.com/openapi-reseller.yaml`

## Key Endpoints

### Provision eSIM
POST /esim/provision
```json
{ "end_user_reference": "order_789", "label": "Jane Smith - Tokyo" }
```
Response 201:
```json
{
  "id": "uuid",
  "iccid": "8999201200000000001",
  "lpa_string": "LPA:1$...",
  "qr_code": "data:image/png;base64,...",
  "direct_install_url": "https://...",
  "status": "pending",
  "euicc_state": "RELEASED",
  "cost": 1.75,
  "balance_remaining": 142.50,
  "created_at": "ISO 8601"
}
```
Errors: 401 InvalidApiKey, 402 InsufficientBalance, 503 NoEsimsAvailable

### List eSIMs
GET /esim/list?status=active&limit=50&offset=0

### Get eSIM Detail
GET /esim/{iccid}
Returns full detail with LPA, status, wallet_balance_usd, total_data_charged_usd

### Enable/Disable Data
POST /esim/{iccid}/enable
POST /esim/{iccid}/disable

### Terminate eSIM
POST /esim/{iccid}/terminate (IRREVERSIBLE, balance forfeited)

### Fund eSIM Wallet
POST /esim/{iccid}/fund
```json
{ "amount": 5.00 }
```
Deducts from reseller balance. Only charge — no ongoing debit during usage.

### Get Rates
GET /rates?country=japan
```json
{
  "total_countries": 218,
  "discount": "10% off retail rates",
  "countries": [{
    "name": "Japan", "iso2": "JP", "flag": "🇯🇵",
    "cheapest_per_gb_usd": 1.38,
    "cheapest_operator": "KDDI Corporation",
    "networks": [
      { "operator": "KDDI Corporation", "per_mb_usd": 0.0013, "per_gb_usd": 1.38 },
      { "operator": "Rakuten", "per_mb_usd": 0.0018, "per_gb_usd": 1.89 }
    ]
  }]
}
```

### Wallet Balance
GET /wallet/balance
```json
{ "balance_usd": 142.50, "lifetime_topped_up_usd": 500.00, "lifetime_usage_usd": 357.50 }
```

### Webhooks
GET /webhooks — list registered webhooks
POST /webhooks — register (max 5, returns signing_secret shown ONCE)
POST /webhooks/{id}/test — send test event
Webhook payload signed with HMAC-SHA256

## Wallet System
- Reseller pre-funded wallet (min $10 for developers)
- Each eSIM gets its own sub-wallet via /fund
- Per-MB billing, checked every 10 min
- Balance hits zero → data pauses (no overage)
- Bonus tiers: $10+ = 10%, $20+ = 20%, $30+ = 30%
- Balance never expires

## Provisioning Fee
$1.75 per eSIM (deducted on provision)
