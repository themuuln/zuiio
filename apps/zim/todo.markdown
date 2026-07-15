# eSIM Provider Integration — Status & Roadmap

*Generated: 2026-07-11 | Project: apps/zim | Remote DB: cvqwdscitkpwlwnpajjd*

---

## ✅ Completed

### Database Schema (live on Supabase)
- 13 tables created with RLS enabled on all
- Seed data: 10 regions, 1 pricing rule (20% global), 3 app_settings, 1 fx_rate (USD_MNT=3450)
- RLS policies: public read on regions, own-read on customers/orders/order_items/esims, admin-all on everything else
- packages has NO anon SELECT policy (cost_usd is secret — intentional)
- Admin account: admin@zim.mn (user_id: d84b3e74-0cd5-4623-a9fc-beb0339b83f4, role: admin)
- TypeScript types synced: JSONB columns updated to `Json` type, union type aliases preserved

### Provider API Research (4 providers)
- Firsty: ✅ Full API spec (OAuth2, 24h tokens, two-step provisioning, OpenAPI spec)
- Citrus Mobile: ✅ Full API spec (Bearer token, per-MB billing, wallet sub-accounts)
- Roamic: ✅ Full API spec (email/password auth, async provisioning, EUR pricing)
- Bappy: ✅ Full API spec (OAuth2, 5min tokens, link-based lifecycle, auto-refund)

---

## ✅ Provider Adapters (complete)
- [x] Firsty adapter — `src/lib/provider/firsty.ts` (OAuth2, 24h tokens, two-step provisioning)
- [x] Citrus Mobile adapter — `src/lib/provider/citrus-mobile.ts` (Bearer token, per-MB billing)
- [x] Roamic adapter — `src/lib/provider/roamic.ts` (email/password auth, async provisioning)
- [x] Bappy adapter — `src/lib/provider/bappy.ts` (OAuth2, 5min token refresh)

## ✅ Multi-Provider Infrastructure (complete)
- [x] Provider registry — `src/lib/provider/registry.ts`
- [x] Advantage tag engine — `src/lib/catalog-advantages.ts`
- [x] Updated `src/lib/provider/index.ts` for multi-provider
- [x] Updated `src/lib/catalog-sync.ts` for multi-provider

## ✅ Email Improvements (complete)
- [x] Order confirmation email — `sendConfirmationEmail()`
- [x] Payment receipt email — `sendReceiptEmail()`
- [x] Expiry reminder email — `sendExpiryReminderEmail()` + cron route
- [x] Activation guide in delivery email (iOS + Android steps)

## ✅ Webhook Hardening (complete)
- [x] HMAC signature verification — `verifyWebhookSignature()`
- [x] Normalizers for all 4 providers (Firsty, Citrus, Roamic, Bappy)
- [x] Structured logging in webhook route

## ✅ Multi-Provider Routing (complete)
- [x] Auto-route to correct provider per package in checkout

## ✅ Customer UX (complete)
- [x] Usage tracking page — `[locale]/my/usage/page.tsx`

## ✅ Admin UX (complete)
- [x] Provider health dashboard — `[locale]/admin/providers/page.tsx`
- [x] Bulk sync all providers — server action

## ✅ Observability (complete)
- [x] Structured JSON logger — `src/lib/logger.ts`

---

## 📋 Needs Manual Action (Contact Provider Support)

### Roamic
| Item | Action Required | Contact |
|---|---|---|
| Sandbox credentials | Request sandbox URL + test credentials | partner.support@roamic.com |
| Login response schema | Confirm exact success response shape | partner.support@roamic.com |
| Webhook docs | Request webhook events, payload format, HMAC signing | partner.support@roamic.com |
| Rate limits | Ask for rate limit numbers + retry headers | partner.support@roamic.com |
| Token expiry | Confirm Bearer token lifetime | partner.support@roamic.com |
| eSIM status lifecycle | Get full list of esimStatus values | partner.support@roamic.com |

### Bappy
| Item | Action Required | Contact |
|---|---|---|
| Webhook HMAC | Request HMAC signing details for webhook payloads | bappy@omaxtelecom.com |
| Rate limits | Ask for rate limit numbers | bappy@omaxtelecom.com |
| Production credentials | Sign up at console.omaxtelecom.com | Self-service |

### Firsty
| Item | Action Required | Contact |
|---|---|---|
| Sandbox signup | Sign up at connect.test.firsty.app (free, ~60s) | Self-service |
| Production credentials | Contact for client_id + client_secret | partners@firsty.app |

### Citrus Mobile
| Item | Action Required | Contact |
|---|---|---|
| API key | Generate at citrusmobile.com/developer | Self-service |
| Webhook signing secret | Created when registering webhook (shown ONCE) | Self-service |

---

## 🏗️ Architecture Decisions

### Multi-Provider Design
- **Provider registry**: All providers registered by name, enabled via env vars
- **Catalog sync**: Pulls from all enabled providers, stores `provider` column per package
- **Advantage badges**: Computed per-package (best_price, best_value, most_coverage, longest_validity)
- **No provider names shown to users** — only advantage badges
- **Provisioning routing**: Package's `provider` field routes to correct adapter

### Provider Stack (Priority Order)
1. **Firsty** (primary) — best API, flat global pricing, 24h tokens, sandbox
2. **Citrus Mobile** (Asia) — best Korea/China/Mongolia rates, per-MB billing
3. **Roamic** (wholesale) — cheapest Japan/Thailand, async provisioning
4. **Bappy** (backup) — transparent EUR, auto-refund on failure

---

## 💰 Pricing Summary (Wholesale → Retail Margin)

| Route | Cheapest Provider | Wholesale | Retail Target | Margin |
|---|---|---|---|---|
| Japan 5GB | Roamic | ~€1.50 | $14.00 | 88% |
| Korea 5GB | Citrus Mobile | ~$4.60 | $14.00 | 67% |
| China 5GB | Citrus Mobile | ~$6.15 | $16.00 | 62% |
| Thailand 5GB | Roamic | ~€1.75 | $12.00 | 84% |
| Mongolia 5GB | Citrus Mobile | ~$13.62 | $30.00 | 55% |

---

## 🔑 Environment Variables Needed

```bash
# Provider: Firsty
FIRSTY_CLIENT_ID=
FIRSTY_CLIENT_SECRET=
FIRSTY_BASE_URL=https://connect.test.firsty.app/api/v3  # sandbox

# Provider: Citrus Mobile
CITRUS_API_KEY=
CITRUS_BASE_URL=https://citrusmobile.com/api/v2/reseller

# Provider: Roamic
ROAMIC_EMAIL=
ROAMIC_PASSWORD=
ROAMIC_BASE_URL=https://api.roamic.com

# Provider: Bappy
BAPPY_CLIENT_ID=
BAPPY_CLIENT_SECRET=
BAPPY_BASE_URL=https://api.omaxtelecom.com/bappy/v1

# Active providers (comma-separated)
ESIM_PROVIDERS=firsty,citrus-mobile
```
