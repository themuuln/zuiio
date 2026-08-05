---
title: E-Commerce Storefront Gaps
desc: Zer-ийг Shopify шиг нийтийн борлуулалтын веб болгоход дутсан фичерүүд
---

# E-Commerce Storefront Gaps

Zer одоогоор **B2B ERP** — дэлгүүрийн эзэн бүтээгдэхүүнээ бүртгэж, борлуулалтаа удирддаг. Харин **нийтийн storefront** (худалдан авагчид харж, худалдан авах веб) байхгүй.

Энэ баримт нь Zer-ийг Shopify/Shopify-like болгоход юу дутсан, хэрхэн барих талаархи төлөвлөгөө.

---

## Одоогийн байдал vs Зорилго

| Зүйл | Одоо (ERP) | Зорилго (Shopify-like) |
|------|-----------|----------------------|
| Хэрэглэгч | Дэлгүүрийн эзэн, менежер | **Худалдан авагч** (нийтийн) |
| Бүтээгдэхүүн | Нэр, SKU, үнэ, нөөц | + Зураг галерей, тайлбар, шүүлтүүр |
| Худалдан авалт | POS-оор бүртгэх | **Онлайн захиалга** (cart → checkout) |
| Төлбөр | Бэлэн/карт/данс | + **QPay, SocialPay, банкны шилжүүлэг** |
| Хүргэлт | Бүртгэх (бодит хүргэлт биш) | + **Хүргэлтийн тооцоо, захиалга** |
| Харагдац | Нүүр хуудасгүй (зөвхөн dashboard) | **Нийтийн storefront** |

---

## Дутсан фичерүүд (Epic бүрээр)

### Epic 1: Public Storefront

Худалдан авагчид харах нийтийн веб хуудас. Zer-ийн product/inventory өгөгдөл дээр ажиллана.

| # | Фичер | Тайлбар | Тэргүүлэх | Хугацаа |
|---|-------|---------|----------|--------|
| 1.1 | **Нүүр хуудас** | Бүтээгдэхүүний жагсаалт, banner, категори | 🔴 | 3-5 өдөр |
| 1.2 | **Бүтээгдэхүүний хуудас** | Нэр, зураг галерей, үнэ, тайлбар, орц, хэрэглэх заавар | 🔴 | 2-3 өдөр |
| 1.3 | **Категори хуудас** | Бүтээгдэхүүнүүдийг категориар харуулах | 🔴 | 1 өдөр |
| 1.4 | **Хайлт + шүүлтүүр** | Нэрээр хайх, үнээр шүүх, эрэмбэлэх | 🟡 | 2 өдөр |
| 1.5 | **Мобайл responsive** | Утаснаа бүрэн ажиллах (mobile-first) | 🔴 | Нэмэлт |
| 1.6 | **SEO** | Meta tags, canonical URL, Open Graph | 🟡 | 1 өдөр |

### Epic 2: Shopping Cart & Checkout

Худалдан авагчид бүтээгдэхүүн сонгоод, төлбөрөө төлөх урсгал.

| # | Фичер | Тайлбар | Тэргүүлэх | Хугацаа |
|---|-------|---------|----------|--------|
| 2.1 | **Сагс (Cart)** | Нэмэх, хасах, тоо ширхэг өөрчлөх, localStorage-д хадгалах | 🔴 | 2 өдөр |
| 2.2 | **Checkout хуудас** | Нэр, утас, хаяг, төлбөрийн арга сонгох | 🔴 | 3 өдөр |
| 2.3 | **Захиалга үүсгэх** | Cart → Order → Zer-д бүртгэх → нөөц хасах | 🔴 | 3 өдөр |
| 2.4 | **Төлбөрийн аргууд** | QPay, SocialPay, банкны шилжүүлэг, бэлэн | 🔴 | 5-7 өдөр |
| 2.5 | **Захиалгын баталгаажуулалт** | Захиалга амжилттай → мэдэгдэл (имэйл/SMS) | 🟡 | 2 өдөр |

### Epic 3: Order Management (Admin)

Дэлгүүрийн эзэн онлайн захиалгуудаа харж, удирдах.

| # | Фичер | Тайлбар | Тэргүүлэх | Хугацаа |
|---|-------|---------|----------|--------|
| 3.1 | **Захиалгын жагсаалт** | Бүх онлайн захиалгууд статусаар (Шинэ, Баталсан, Хүргэсэн, Дууссан) | 🔴 | 2 өдөр |
| 3.2 | **Захиалгын дэлгэрэнгүй** | Хүлээн авагчийн мэдээлэл, бүтээгдэхүүнүүд, төлбөрийн төлөв | 🔴 | 1 өдөр |
| 3.3 | **Статус өөрчлөх** | New → Confirmed → Shipped → Delivered | 🔴 | 1 өдөр |
| 3.4 | **Нөөц автоматаар хасах** | Захиалга баталгаажсан үед inventory-оос хасах | 🔴 | 1 өдөр |
| 3.5 | **Хүргэлтийн статус** | Тээвэрлэгчийн код, хүргэгдсэн эсэх | 🟡 | 2 өдөр |

### Epic 4: Customer Accounts

Худалдан авагчид бүртгүүлж, захиалгын түүхээ харах.

| # | Фичер | Тайлбар | Тэргүүлэх | Хугацаа |
|---|-------|---------|----------|--------|
| 4.1 | **Бүртгэл / нэвтрэх** | Имэйл+нууц үг, social login (Google) | 🟡 | 2-3 өдөр |
| 4.2 | **Профайл** | Нэр, утас, хаяг өөрчлөх | 🟢 | 1 өдөр |
| 4.3 | **Захиалгын түүх** | Өмнөх захиалгуудаа харах | 🟡 | 1 өдөр |
| 4.4 | **Хаягууд** | Олон хаяг хадгалж, сонгох | 🟢 | 1 өдөр |

### Epic 5: Promotions & Marketing

Хямдрал, купон, маркетингийн хэрэгслүүд.

| # | Фичер | Тайлбар | Тэргүүлэх | Хугацаа |
|---|-------|---------|----------|--------|
| 5.1 | **Хямдралын код (Coupon)** | % эсвэл тогтмол дүнгийн хямдрал | 🟡 | 2 өдөр |
| 5.2 | **Бүтээгдэхүүний хямдрал** | "Захиалга авах" товч бүхий хямдралтай бүтээгдэхүүн | 🟡 | 1 өдөр |
| 5.3 | **Banner / промо** | Нүүр хуудасны промо banner | 🟢 | 1 өдөр |

### Epic 6: Notifications & Communication

Худалдан авагчидтай харилцах мэдэгдлүүд.

| # | Фичер | Тайлбар | Тэргүүлэх | Хугацаа |
|---|-------|---------|----------|--------|
| 6.1 | **Имэйл мэдэгдэл** | Захиалга баталгаажуулах, хүргэлтийн статус | 🟡 | 2-3 өдөр |
| 6.2 | **SMS мэдэгдэл** | Заалгын дугаар, хүргэлтийн статус (optional) | 🟢 | 2 өдөр |
| 6.3 | **Admin мэдэгдэл** | Шинэ захиалга ирэхэд dashboard-д мэдэгдэх | 🟡 | 1 өдөр |

---

## Архитектурын сонголт

### Зөвлөх арга: Standalone storefront + Zer API

```
┌─────────────────────────────────────────────┐
│           PUBLIC STOREFRONT (Next.js)        │
│  /, /products, /cart, /checkout, /account    │
│  Нийтийн хэрэглэгчид хардаг                │
└──────────────────┬──────────────────────────┘
                   │ API calls
                   ▼
┌─────────────────────────────────────────────┐
│              ZER API LAYER                   │
│  /api/products, /api/orders, /api/cart       │
│  Supabase RLS-ээр зөвшөөрөл шалгана        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           SUPABASE (Zer-ийн DB)              │
│  products, inventory, orders, customers      │
│  (одоо байгаа өгөгдөл)                      │
└─────────────────────────────────────────────┘
```

**Яагаад ингэж хийх вэ:**
1. Zer-ийн product/inventory өгөгдлийг дахин бүтээхгүй
2. Storefront-ыг тусдаа deploy хийж болно (Vercel)
3. API нь Zer-ийн existing Supabase өгөгдөлд хандана
4. Нэг өгөгдөл — нэг үнэн (single source of truth)

### Дэлгүүрийн эзний dashboard-д нэмэх зүйлс

Storefront-ыг Zer-ийн dashboard-д холбох:

| Зүйл | Тайлбар |
|------|---------|
| **Online Orders хуудас** | Нийтийн захиалгуудыг харах, статус өөрчлөх |
| **Storefront Settings** | Дэлгүүрийн нэр, лого, хаяг, төлбөрийн аргууд |
| **Coupon Management** | Хямдралын код үүсгэх, удирдах |
| **Analytics** | Хүний тоо, хөрвүүлэлтийн хувь, орлого |

---

## Тэргүүлэлтийн эрэмбэ

### P0 — Эхний MVP (7-10 өдөр)

Зүгээр ажилладаг онлайн дэлгүүр:

1. Public storefront (products + categories + search)
2. Shopping cart (localStorage)
3. Checkout → захиалга үүсгэх
4. Admin: захиалгын жагсаалт + статус өөрчлөх
5. Нөөц автоматаар хасах

### P1 — Ажиллагаатай дэлгүүр (+ 5-7 өдөр)

6. Төлбөрийн аргууд (QPay, SocialPay)
7. Имэйл мэдэгдэл
8. Хэрэглэгчийн бүртгэл
9. Хямдралын код

### P2 — Бүрэн дүүрэн (+ 7-14 өдөр)

10. SMS мэдэгдэл
11. Хэрэглэгчийн профайл + хаягууд
12. Бүтээгдэхүүний хямдрал
13. Banner / промо
14. Analytics dashboard

---

## Tech Stack

| Зүйл | Сонголт |
|------|---------|
| Storefront framework | Next.js 16 (existing stack) |
| UI | shadcn/ui + Tailwind (existing) |
| API | Next.js API routes + Supabase |
| Auth | Supabase Auth (existing) |
| Payments | QPay API, SocialPay API |
| Deployment | Vercel (storefront), existing Vercel (Zer admin) |
| Domain | `.mn` эсвэл `.com` — нийтийн storefront-д |

---

## Холбоотой баримтууд

- [Zer Features](/features/) — одоогийн ERP фичерүүд
- [Roadmap](/guide/roadmap) — ERP-ийн хөгжүүлэлтийн төлөвлөгөө
- [Architecture](/architecture/) — одоогийн бүтэц

---

---

# Competitive Gap Analysis (vs. Top POS/ERP Systems)

> Review date: 2026-07-18
> Source: Competitive analysis of Square, Toast, Shopify, Datadog, Grafana
> Scope: UX patterns, feature gaps, differentiation opportunities

---

## 🔴 P0 — Critical Gaps

### 1. Onboarding Wizard (Shipped 2026-08-03)

**What competitors do:** Square: "Get up and running in minutes." Clover: "Set up and start taking payments same day." Shopify: "Start for free" → 3-step setup.

**Current state:** ✅ Multi-step onboarding wizard (`/onboarding`): preset brand import, module selection, company-type category seeding, `onboarding_completed` flag; new orgs land there until configured.

**Why it matters:** First impression = retention. If users don't set up within first session, they churn.

**Action:** 3-step onboarding:
1. Business type (retail/wholesale/manufacturing)
2. Add first products (or import CSV)
3. Take first sale

---

### 2. Offline Mode (Shipped 2026-08-03)

**What competitors do:** Square's #1 feature is "keep selling without internet." Toast built their brand on "works during peak volume, even offline."

**Current state:** ✅ Offline-first POS: `public/sw.js` v4 (static cache-first, navigation stale-while-revalidate, `/rest/v1` + `/api` GET network-first-with-cache-fallback, `/offline` fallback page, push handler); `@zuiio/offline` IndexedDB mutation queue wired into the POS form + storefront checkout (`src/lib/offline-sync.ts` → `queueOfflineAction`/`replayQueuedActions`); `OfflineProvider` auto-replays on reconnect; TanStack Query cache persisted via `indexedDbPersister` (24h). Offline sales queue in the form, sync on reconnect, `OfflineIndicator` in the POS footer.

**Why it matters:** Retailers at markets, pop-ups, and areas with bad internet need offline POS.

**Action:** Full offline-first with background sync. Queue sales, sync when connection returns.

---

## 🟡 P1 — Competitive Gaps

### 3. AI Assistant (Shipped 2026-08-03)

**What competitors do:** Datadog has Bits AI, Grafana has AI Assistant, Toast has Toast IQ, Looker has Gemini. Every top product in 2026 has AI.

**Current state:** ✅ Dashboard AI chat at `/ai-assistant` ("AI туслах"): conversational Q&A powered by `@zuiio/ai-agent` `runWithTools` (DeepSeek, `DEEPSEEK_API_KEY`) with org-scoped tools (`createAllAgentTools` — inventory/sales queries scoped to `organization_id`), Mongolian answers, suggestion chips ("Бага нөөцтэй бараа?", "Өнөөдрийн борлуулалт?").

**Opportunities:**
- "Why is inventory low?"
- "Predict next month's sales"
- "What's my best-selling product this week?"
- "Flag unusual expenses"

**Action:** Wire `@zuiio/ai-agent` into dashboard. AI chat that answers business questions.

---

### 4. Industry Presets / Templates (Missing)

**What competitors do:** Square lets you pick a "mode" (Restaurant/Retail/Services) and auto-generates dashboard. Toast has industry-specific starter dashboards.

**Current state:** No business type selector during setup.

**Opportunities:**
- Retail (clothing, electronics, grocery)
- Wholesale (B2B, bulk orders)
- Manufacturing (BOM, production orders)
- Each gets different default product categories, invoice templates, report views

**Action:** Add "Business Type" selector → auto-configure product categories, invoice templates, reports.

---

### 5. Real-Time Notifications (Shipped 2026-08-03)

**What competitors do:** Square sends low-stock alerts. Toast sends real-time order notifications.

**Current state:** ✅ Web push + Telegram + email: `push_subscriptions` table + VAPID web-push (`src/lib/push.ts`, `PushProvider`), settings toggle, delivery on `low_stock` + `new_sale` events via `notifyWebPushEvent`; Telegram channel existed (bot + per-org chat configs).

**Action:** Push notifications via web-push + Telegram for: low stock, new order, payment received, unusual expense.

---

## 🟢 P2 — Differentiation Opportunities

### 6. Dashboard Templates (Shipped 2026-08-03)

**What competitors do:** Grafana has 800+ dashboard templates. Datadog has integration-based auto-dashboards.

**Current state:** ✅ Per-org dashboard template: `organizations.dashboard_template` (default/retail/financial/inventory), template picker in Settings, onboarding auto-selects by `company_type`, dashboard renders template-defined sections (today pulse, recent sales, monthly trend, delivery stats, low stock, quick shortcuts).

**Action:** Pre-built dashboard templates:
- "Retail Overview" (sales, inventory, top products)
- "Financial Summary" (revenue, expenses, profit)
- "Inventory Health" (stock levels, reorder alerts)

---

### 7. Hardware Integration (Partial 2026-08-03)

**What competitors do:** Square sells dedicated hardware (Register, Terminal, Reader). Toast has Toast Go.

**Current state:** ⚠️ Partial: USB/HID wedge barcode scanners supported in the POS (`useBarcodeScanner` — fast-buffer Enter-terminated scan → product lookup/add-to-cart, variant-aware), `has_receipt_printer` setting + auto-print of the receipt (with print-optimized CSS). No dedicated POS terminal, cash-drawer control, or ESC/POS driver yet.

**Action:** Barcode scanner + receipt printer + cash drawer integration.

---

### 8. Multi-Location Support (Shipped 2026-08-03)

**What competitors do:** Square supports "one location to one hundred." Shopify has unified inventory across stores.

**Current state:** ✅ Cross-location stock transfers: `stock_transfers` + `stock_transfer_items` tables, atomic `approve_stock_transfer` RPC (FOR UPDATE locks, from→to `warehouse_products` move, `transfer` stock_movements, short-stock rejection), transfers UI under `/inventory/transfers` with per-warehouse stock cards; branches + warehouses existed before. Location-level reporting still thin (per-warehouse stock only).

**Action:** Location switching, cross-location inventory transfers, location-level reporting.

---

### 9. Embeddable Analytics (Shipped 2026-08-03)

**What competitors do:** Looker's best feature is embedded analytics. Grafana dashboards can be embedded anywhere.

**Current state:** ✅ Token-gated embed: `embed_tokens` (SHA-256-hashed tokens, expiry, revocation, org-scoped), settings UI at `/settings/embed` with iframe snippet builder, read-only report at `/embed/report?token=…` (today sales, 7-day trend, low stock, recent sales), `X-Frame-Options` replaced with `frame-ancestors *` on `/embed/*`.

**Action:** Make Zer dashboards embeddable via iframe for: accountant portals, investor views, partner dashboards.

---

## Comparison Matrix

> Refreshed 2026-08-03 — Zer column reflects the shipped state.

| Feature | Zer | Square | Shopify | Looker |
|---------|-----|--------|---------|--------|
| Onboarding wizard | ✅ | ✅ | ✅ | ⚠️ |
| Offline mode | ✅ (queue + SW) | ✅ Full | ✅ | ❌ |
| AI assistant | ✅ (/ai-assistant) | ❌ | ❌ | ✅ Gemini |
| Industry presets | ✅ (company-type) | ✅ Mode selector | ❌ | ❌ |
| Real-time alerts | ✅ web-push+Telegram | ✅ | ✅ | ✅ |
| Dashboard templates | ✅ | ✅ | ✅ | ✅ 800+ |
| Hardware | ⚠️ barcode+printer | ✅ Full line | ✅ | ❌ |
| Multi-location | ✅ transfers | ✅ | ✅ | ❌ |
| Embeddable | ✅ token-gated | ✅ | ✅ | ✅ Best |

---

## Key Insight

**Square's "mode switching" is their UX magic. You have a settings page but no industry presets. Add "Business Type" onboarding that auto-configures everything.**

This is the highest-impact, lowest-effort improvement:
1. User signs up
2. Picks business type (retail/wholesale/manufacturing)
3. System auto-creates default categories, invoice template, report views
4. User is productive in minutes, not hours

---

---

# Competitor Research Update (2026-07-31)

> Source: Deep research run — 5 parallel workers, 63 sources (54 T1). Full report at `~/.omp/research/2026-07-31-tolom-zer-onoo-competitor-research/synthesis.md`

---

## 🛑 Critical Competitive Landscape

### Mongolian ERP market is crowded (10+ domestic players)

Zer competes against: **Workzone**, **Ultimate/Masu**, **Todu**, **ОЧ 7.7**, **Od (Odoo-based)**, **1C Mongolia**, **Amar POS**, **Gerege**, **Dayansoft**, **Next ERP**, **Everest**, **Sync**. All have:
- Mongolian tax/e-barimt compliance
- POS module (web, mobile)
- Domestic bank connectivity
- Payroll/HR modules
- Mongolian-language UI

**Zer's differentiation must come from:** modern UX, offline-first, pure-cloud SaaS, and Mongolian-market pricing (MNT 50-200K/mo, not intl SaaS pricing).

### No global ERP covers Mongolian needs end-to-end

Odoo ($24.90-$61/user/mo) has partial Mongolian modules but the main e-barimt module was unpublished. Square (best offline POS) is geo-blocked outside ~8 countries. ERPNext (free) lacks Mongolian localization. QuickBooks ($38-$275/mo) has no offline, no POS, no Mongolian tax.

---

> **Status refresh 2026-08-03:** Offline-first, AI assistant, dashboard templates, hardware (partial), multi-location transfers, embeddable analytics, web-push alerts, consumer mobile app (`apps/zer-mobile`), storefront buyer accounts, and the public buyer checkout RPC (`submit_shop_order`) all shipped. 2026-08-03 hardening: the anon-order spam risk is closed with in-SQL flood protection (per-org + per-phone pending-order caps, migration `20260803130000`; PostgREST can't see the client IP and the consumer app hits Supabase directly, so Vercel Firewall cannot cover that path), and offline replay is now idempotent (every queued action carries a client dedupe key; `createSale`, `createShopSale`, `process_shop_sale`, and `submit_shop_order` return the first sale for a repeated key — a process death mid-replay can no longer double-sell). Still missing: POS register (touch-optimized), QPay/SocialPay online payments, e-Barimt API integration, payroll extras, social-commerce selling.

## 🔴 New P0 Gaps (From Competitor Research)

| Feature | Status | Competitor benchmark | Effort | Priority |
|---------|--------|---------------------|--------|----------|
| **POS module** | ⚠️ Cash register + offline sales form; no touch POS register | ALL 10+ Mongolian competitors have POS | 4-6 weeks | 🔴 Blocks retail SME segment |
| **QPay payment integration** | ❌ Missing | Todu, MASU, all local POS systems | 2-3 weeks | 🔴 Blocks storefront revenue |
| **e-Barimt tax receipt** | ❌ Missing (ebarimt_id stored only) | All local competitors | 3-4 weeks | 🔴 Legal requirement |
| **Payroll + HR module** | ✅ Shipped (payroll runs, items) | 1C, Workzone, Next ERP, Erkhet, Ultimate | — | 🟢 Purchase trigger for SMEs |
| **Consumer mobile app** | ✅ Shipped (apps/zer-mobile, Expo) | Todu (Android/iOS), MASU (mobile) | — | 🟢 Table-stakes for modern POS |

## 🟡 Updated P1 Gaps

| Feature | Status | Notes |
|---------|--------|-------|
| **Offline-first hardening** | ✅ Shipped (2026-08-03) | IndexedDB mutation queue + SW v4 + query-cache persistence; sales queue offline and auto-replay on reconnect; replay is idempotent — the queue's dedupe key is threaded through to the server actions, which return the original sale for a repeated key |
| **Social commerce (Facebook/Telegram)** | ⚠️ Partial | Telegram + Messenger agent links/webhooks exist; no "sell via Facebook post" catalog-to-chat flow |
| **AI features (Mongolian-language)** | ✅ Shipped | Dashboard Q&A assistant + poster/enhance/logo/naming generators |
| **Online storefront** | ✅ Shipped | Catalog/product/blog + buyer accounts + public checkout RPC; web storefront cart/checkout UI still staff-side, consumer buying lives in apps/zer-mobile. Public RPC protected: per-org/per-phone pending-order rate limits (SQL) + idempotent replay via `p_idempotency_key` |

## Updated Comparison Matrix (vs Mongolian ERP)

| Feature | Zer | Workzone | Ultimate/Masu | Todu | 1C Mongolia |
|---------|-----|----------|---------------|------|-------------|
| Inventory | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sales/CRM | ✅ | ✅ | ✅ | ✅ | ✅ |
| POS | ⚠️ Cash register + offline sales form (no touch POS register) | ✅ | ✅ Masu POS | ✅ Web/Mobile | ✅ 1C Retail |
| Payroll/HR | ✅ (payroll runs) | ✅ | ✅ | ❓ Unknown | ✅ |
| e-Barimt | ⚠️ ebarimt_id stored only — no API | ✅ | ✅ | ✅ | ✅ |
| QPay | ❌ Missing | ❓ Unknown | ✅ | ✅ | ❓ Unknown |
| Offline-first | ✅ (queue + SW) | ❌ | ✅ POS offline | ✅ POS offline | ❌ Desktop |
| AI | ✅ (/ai-assistant) | ❓ Unknown | ✅ Ultimate AI | ❓ Unknown | ❌ |
| Mobile App | ✅ apps/zer-mobile (consumer) | ❓ Unknown | ✅ Masu Mobile | ✅ Android/iOS | ❌ |
| Buyer accounts | ✅ store accounts + orders | — | — | — | — |
| Pricing | MNT-market | Contact | Contact/Free start | Contact | Per-user RUB |
| Modern UX | ✅ Best | ⚠️ Legacy | ⚠️ Legacy | ⚠️ Mixed | ❌ Legacy |

## Strategic Recommendation: "Offline-First POS + E-commerce for Mongolian Retail"

Zer should **NOT** compete as "another ERP" — the local market is saturated. Instead:

1. **POS module** reuses existing product/inventory data (well-scoped, 4-6 weeks)
2. **Online storefront** (already planned in gaps doc — P0 MVP in 7-10 days)
3. **QPay + e-Barimt + SocialPay** = complete Mongolian payment stack
4. **Offline-first** = genuine differentiator — "works without internet"
5. **Price at MNT 50-200K/mo** — Mongolian market rates, not international SaaS pricing

**Skip payroll/HR**, full accounting, manufacturing — 1C, Workzone, and ОЧ 7.7 dominate these. Partner instead.
