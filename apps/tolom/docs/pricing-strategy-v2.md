# TOLOM Pricing Strategy v2

*Evidence-based revision — August 2026. Based on deep research: 46 sources, 6 workers (competitor pricing verified on vendor primary pages 2026-08-07, SaaS pricing-strategy literature, Mongolian market benchmarks). Companion research: `~/.omp/research/2026-08-07-tolom-pricing-competitors/` (synthesis.md, claims.md, sources.md).*

> **Rate reference**: 1 USD = ₮3,598 (2026-08-07, Xe mid-market; 90-day range ₮3,576–₮3,598).
> **Status**: no paying customers yet (2026-08-07) — strategy targets first-customer acquisition, not protecting existing revenue.

---

## 1. What the research established

### 1.1 The category standard (6 international vendors, prices verified today)

| Vendor | Entry | Mid | Top | Model |
|---|---|---|---|---|
| ShopMonkey | $239 ($215 annual) | Clever $399 | Genius $499 | flat/shop, +$20/user |
| Tekmetric | $199 ($179) | Grow $349 | Scale $439 | flat/shop, unlimited users/ROs |
| AutoLeap | $179 | Pro $309 | Elite $409 | flat/shop, unlimited ROs |
| Fullbay | $188 (+$89/user) | Pro $258 | Elite $318 | flat + per-user |
| RepairDesk | $99 ($79 annual) | Growth $149 | Advanced quote | per-store, 5/8/unlimited users |
| Wrenchy | $114.99 | $239.99 | $399.99 | flat/shop |

**Category norms:**
- Flat monthly **per location**, tiered by features. Never per work order. Per-user only as tier boundary or overage.
- "Unlimited work orders / users" is the marketing headline — Tekmetric: "We don't charge by user or by repair order."
- Tier ladder: base = work orders, inventory, CRM, DVI → mid = 2-way texting, reports, time clocks → top = analytics, labor guides, AI → enterprise = multi-location + API.
- Multi-location is the most consistent premium item. 2-way texting is the most common mid-tier gate.
- Annual discount 10–20% (16.7% = 10× monthly standard).

### 1.2 Mongolian market reality

| Benchmark | Price | Note |
|---|---|---|
| Playpass | ₮13.7k / ₮28.8k / ₮149.9k /mo | MNT-native SaaS; ≈42% of its USD prices |
| MASU POS | Free / ₮50k / ₮100k; big-business ₮500k–₮1M | freemium entry |
| QPay merchant | 1% domestic / 3% intl card | SMBs pay via transaction %, not subscription |
| 1C:Альфа-Авто | ~₮11–15M one-time (RU, [INFERENCE]) | the only auto-repair "competitor", legacy desktop |
| Tolom today | ₮299k / ₮699k / ₮1.79M /mo = $83/$194/$497 | 6–22× above local SMB SaaS |

**Central tension**: Tolom is priced like a US vendor with a Mongolian address. The evidence says this is *defensible* (category creator, premium quality signal, ROI framing) — but only with a believable entry tier, no implementation wall, and local payment/tax integration.

### 1.3 Pricing-strategy evidence (decision-grade)

1. Median SaaS underpriced ~30%; value-based pricing lifts revenue 15–30% (ProfitWell, 8,000+ cos).
2. Middle tier captures 60–70% of customers (decoy/compromise effect). 3 tiers > 2 or 5.
3. Flat/location-based with 3 tiers beats per-seat for SMB vertical SaaS (aligned metrics → 40% higher NDR).
4. Implementation fees likely suppress emerging-market adoption (upfront cost = #1 adoption barrier for EM SMBs). Fold into monthly; charge only as optional migration/training; waive on annual prepay.
5. Annual discount: keep 10–20%. 20–30% discounts buy no retention (annual GDR 85% vs monthly 90%).
6. Price increases: new customers first (10% cohort test), grandfather existing on fixed 6–12-month window, announce 30–60 days ahead, value-first founder email. 20–30% increase → <5% churn.
7. Discount one-time fees, never MRR. Time-boxed launch pricing for first customers is the one exception (it buys references and urgency).
8. Keep tier math simple — ~60% of SaaS call pricing "overly complex."

---

## 2. Proposed plan structure v2

### 2.1 The four tiers

| | **Core** | **Pro** ★ Most Popular | **Business** | **Enterprise** |
|---|---|---|---|---|
| **Monthly** | ₮199,000 | ₮499,000 | ₮999,000 | Custom |
| **Annual (10×)** | ₮1,990,000 | ₮4,990,000 | ₮9,990,000 | Custom |
| **USD ≈** | $55 | $139 | $278 | — |
| Branches | 1 | 1 | 3+ | Unlimited |
| Users | 3 | 8 | 25+ | Custom |
| Work orders | **Unlimited** | **Unlimited** | **Unlimited** | Unlimited |
| Support | Email | Priority | Priority | SLA |
| Onboarding | Self-serve (included) | Guided (included) | Dedicated | Full custom |
| Implementation (optional, one-time) | ₮0 | ₮0–₮2M | ₮5M+ | Custom |

### 2.2 Complete feature → tier matrix (every Tolom feature)

✅ built and shipped today · 🔜 roadmap. Gates = **built features only** (never price-lock a roadmap promise).

| Feature | Core | Pro | Business | Enterprise | Gate rationale (evidence) |
|---|---|---|---|---|---|
| **Operations** | | | | | |
| Tablet-first workflow & dashboard ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Work orders (full lifecycle) ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Estimates / quotes ✅ | ✅ | ✅ | ✅ | ✅ | base (industry: estimates in entry tier) — **moved down from Pro** |
| Appointments ✅ | ✅ | ✅ | ✅ | ✅ | base (scheduling is entry-tier in industry) — **moved down from Pro** |
| Bay view (Kanban) ✅ | ✅ | ✅ | ✅ | ✅ | base + headline differentiator |
| Workshop display (TV) ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Mechanic mode & reports ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Diagnosis labels ✅ | ✅ | ✅ | ✅ | ✅ | base |
| QR clock-in / time tracking ✅ | ✅ | ✅ | ✅ | ✅ | base ops — **moved down from Pro** |
| **CRM** | | | | | |
| Customers / CRM + notes ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Vehicles & service history ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Service catalog + pricing memory ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Service reminders ✅ | — | ✅ | ✅ | ✅ | mid gate (retention) — **moved down from Pro stays Pro** |
| Vehicle models catalog ✅ | — | ✅ | ✅ | ✅ | config, Pro |
| **Finance** | | | | | |
| Finance dashboard ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Invoices ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Expenses + categories ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Cash register ✅ | ✅ | ✅ | ✅ | ✅ | base |
| End-of-day close ✅ | ✅ | ✅ | ✅ | ✅ | base ops — **moved down from Business** |
| Payroll ✅ | — | ✅ | ✅ | ✅ | Pro (mechanic compensation = control tier) |
| Reports + Excel export ✅ | ✅ | ✅ | ✅ | ✅ | base |
| Tax report ✅ | ✅ | ✅ | ✅ | ✅ | base |
| **Inventory** | | | | | |
| Inventory management (parts, movements, stock counts) ✅ | — | ✅ | ✅ | ✅ | **the Pro gate** (AutoLeap also gates inventory at Pro; loss-prevention hook) |
| Purchase orders ✅ | — | — | ✅ | ✅ | scale (procurement workflow) |
| Suppliers ✅ | — | — | ✅ | ✅ | scale |
| Inventory alerts / reorder ✅ | — | — | ✅ | ✅ | scale |
| Inventory valuation ✅ | — | — | ✅ | ✅ | scale |
| Parts-cars (parts car catalog) ✅ | — | — | ✅ | ✅ | scale |
| **Differentiators** | | | | | |
| Pricing rules (vehicle-class pricing) ✅ | — | ✅ | ✅ | ✅ | **moved down from Business** — Tolom's unique feature; sells Pro |
| Commission rules ✅ | — | — | ✅ | ✅ | scale |
| **Growth / engagement** | | | | | |
| Messaging — Telegram ✅ | — | ✅ | ✅ | ✅ | **moved down from Business** — the industry mid-tier gate |
| Messaging — SMS reminders 🔜 | — | ✅ | ✅ | ✅ | same gate as Telegram |
| Mechanic performance & accountability ✅ | — | ✅ | ✅ | ✅ | Pro (control tier) |
| Dashboard analytics ✅ | Basic | ✅ | ✅ | ✅ | mid gate |
| **Scale** | | | | | |
| Advanced BI / custom reports 🔜 | — | — | ✅ | ✅ | top gate (industry: analytics = top tier) |
| API access 🔜 | — | — | ✅ | ✅ | top gate (industry: API = enterprise/top) |
| Multi-branch dashboard + transfers 🔜 | — | — | ✅ | ✅ | top gate (multi-location = most consistent premium item) |
| Approval workflows 🔜 | — | — | ✅ | ✅ | scale |
| AI assistant ✅ (early) | — | — | ✅ | ✅ | top gate (AutoLeap AIR = $99 add-on; Fullbay AI = Pro+) |
| Data sharing / export ✅ | — | — | ✅ | ✅ | scale |
| **Compliance / Mongolia** | | | | | |
| e-Barimt 🔜 | ✅ (all plans) | ✅ | ✅ | ✅ | legal — never gate |
| QPay payments 🔜 | ✅ (all plans) | ✅ | ✅ | ✅ | revenue — never gate |
| ITP inspection tracking 🔜 | ✅ (all plans) | ✅ | ✅ | ✅ | legal — never gate |
| **Enterprise** | | | | | |
| Fleet management 🔜 | — | — | — | ✅ | enterprise |
| Custom integrations 🔜 | — | — | — | ✅ | enterprise |
| Dedicated infra 🔜 | — | — | — | ✅ | enterprise |
| SLA ✅/🔜 | — | — | — | ✅ | enterprise |

**Principle**: operations, CRM, and finance basics are the entry tier (industry base). The **Pro gate is inventory + messaging + accountability** (the "control" story: stop leakage, keep customers, know your mechanics). The **Business gate is scale**: advanced inventory, multi-branch, API, BI, AI. Compliance features (e-Barimt, QPay, ITP) are **never gated** — they are legal requirements and the strongest reason to buy.

### 2.3 What changed vs today and why

| Change | Old | New | Evidence |
|---|---|---|---|
| Entry price | ₮299k | ₮199k | Cheap tier must be *believable* as cheap for the compromise effect; ₮299k = 21.8× Playpass Plus reads as expensive. |
| Pro price | ₮699k | ₮499k | $139/mo between local norms and intl SaaS; premium-but-approachable. Path to ₮599–699k after e-Barimt/QPay/SMS ship (§5). |
| Business price | ₮1.79M | ₮999k | Keeps premium without a 5× jump from Pro; 2× ratio is the industry norm. |
| Work order caps | 300 / 1,500 / 5,000 | Unlimited | Category norm is "unlimited ROs" as headline. Caps invite comparison against vendors without them. |
| Implementation fee | ₮2M / ₮8M / ₮20M+ | ₮0 / ₮0–2M / ₮5M+ | Upfront implementation cost = #1 EM adoption barrier. Fold onboarding into monthly. |
| Estimates, appointments, EOD close, QR clock-in | Pro/Business in code | Core | Basic operations — industry base tier. |
| Telegram messaging | Business (code) | Pro | The industry's mid-tier gate; matches Tolom's own public page ("Telegram messaging" at Complete). |
| Pricing rules | Business (code) | Pro | Tolom's unique differentiator sells the conversion tier. |
| Advanced inventory (POs, suppliers, alerts, valuation) | Pro/Business mixed | Business | Clean scale-tier story: basic inventory at Pro, procurement at Business. |

### 2.4 Code enforcement rebalance (`src/lib/plan-features.ts`)

The plan→feature gate already exists in code and is wired to `feature_flags`. Rebalance the arrays:

- **STARTER** add: `ESTIMATES`, `APPOINTMENTS`, `EOD_CLOSE` (and QR clock-in if/when it becomes a flag). Keep: work_orders, bay_view, mechanic, customers, vehicles, finance, expenses, reports, diagnosis_labels, settings.
- **PRO** add: `TELEGRAM`, `PRICE_RULES`. Keep: mechanic_performance, service_reminders, inventory, payroll, vehicle_models.
- **BUSINESS** remove: `EOD_CLOSE`, `PRICE_RULES`, `TELEGRAM`. Keep: purchase_orders, suppliers, parts_cars, inventory_valuation, inventory_alerts, commission_rules, data_sharing.
- **ENTERPRISE**: all (unchanged).
- Re-seed `feature_flags` rows + org feature assignments accordingly.

### 2.5 Public pricing page + messages

- `src/app/[locale]/pricing/page.tsx` — PLAN_DATA (prices, feature lists), COMPARISON_ROWS (fix stale rows: reports "—" at Core is wrong; work orders become "Unlimited"; messaging moves to Pro; add estimates/appointments/EOD/price-rules rows).
- `src/messages/en.json` + `mn.json` — all pricing keys, feature labels, FAQ (update: "unlimited work orders", add-ons, no implementation fee on Core/Pro).
- `src/app/[locale]/_landing-sections.tsx` — MONTHLY_PRICES = [199000, 499000, 999000].

---

## 3. Add-on ladder (matches industry structure)

| Add-on | Monthly | Notes |
|---|---|---|
| Extra users (per user) | ₮30k (Core/Pro), ₮25k (Business) | ShopMonkey +$20, Fullbay +$89–119 |
| Extra branch (per branch) | ₮200k | Tekmetric multi-shop +$70/shop |
| SMS credits | cost + 20% margin | Fullbay model: allowance + per-text |
| API access (solo) | ₮200k | lets Business-feature shops buy API without full upgrade |
| AI assistant (solo) | ₮150k | AutoLeap AIR = $99/mo flat |
| Data migration (one-time) | ₮500k–₮2M | optional service, not a barrier |
| Custom report / workflow (one-time) | ₮500k–₮3M | |

---

## 4. First-customer strategy (no sales yet — this is the actual play)

The goal is not MRR maximization — it is **10–20 paying reference shops within 3–6 months**. Every strategy choice below serves that.

1. **Founding-member pricing (time-boxed)**: first 20 shops get launch prices locked for 12 months (₮199k/₮499k/₮999k, then standard prices apply). Creates urgency, rewards early adopters, and the lock expires — no lifetime discount.
2. **Annual prepay is the cash-flow tool**: 10× monthly stays; offer founding members 2 extra months (pay 8, get 12) on annual only.
3. **Sell what is built, not the roadmap**: the gates above use shipped features only. Demo = tablet workflow, bay view, inventory, finance, pricing rules, Telegram.
4. **Implementation fee = ₮0 at Core/Pro** for the first 20 shops; paid onboarding only for Business+. Removes the #1 adoption barrier while the product is unproven in market.
5. **ROI framing stays loss-prevention** (from v1, keep): "stop inventory leakage / never lose a work order / see missing revenue" — priced against ₮3–15M/month estimated losses, not against Playpass.
6. **Validate WTP early**: run 20–30 UB shop interviews (Van Westendorp: "too cheap / cheap / expensive / too expensive" at ₮199k/₮499k/₮999k) before the public launch. Current price points are [RECOMMENDATION], not market-verified.
7. **When prices rise later** (after e-Barimt/QPay/SMS ship): raise new customers first (10% cohort test), grandfather the founding cohort on their locked rate until the lock ends, announce 30–60 days ahead, value-first founder email. 20–30% increase → <5% churn.

## 5. What must ship to defend the premium

1. **e-Barimt + QPay** — legal + revenue; no international competitor has them; justifies premium vs 1C and local entrants.
2. **ITP inspection tracking + reminders** — local requirement no international vendor has.
3. **Messaging (Telegram now, SMS next)** — the mid-tier gate we now sell on.
4. **Customer portal + mechanic mobile app** — table-stakes internationally.
5. **Bay View marketed as the headline** — "The Garage OS"; reframe the moat as bay-as-column Kanban + Mongolian context (AutoLeap does market bay scheduling).

## 6. Risk notes

- **Segment sizing**: 2018 official census (755 UB repair entities, ~1,585 national floor); fleet grew 40% since (1.34M vehicles, 81% ≥10 yrs) — TAM is a floor. [INFERENCE]
- **WTP inferred from pricing practice**, not surveys — validate (§4.6) before finalizing.
- **A Mongolian competitor could undercut at Playpass levels** — the premium strategy assumes nobody ships a credible product within 6–12 months. AutoSync (MASPA-backed) is the watch item.
- **No customers yet = no feedback loop**: the first 5 shops' objections should be logged and fed back into both product and pricing within weeks, not quarters.

## 7. Implementation status (2026-08-07 — code changes shipped)

- [x] `src/lib/plan-features.ts` — STARTER/PRO/BUSINESS rebalanced (§2.4) + tier-boundary tests
- [x] `src/app/[locale]/pricing/page.tsx` — PLAN_DATA prices/features, COMPARISON_ROWS (unlimited WOs, new rows), VALUE_KEYS (+Self-serve/Guided)
- [x] `src/app/[locale]/_landing-sections.tsx` — MONTHLY_PRICES = [199000, 499000, 999000]
- [x] `src/messages/en.json` + `mn.json` — prices, feature labels, comparison labels, ROI amounts
- [x] `docs/pricing-overview.md` — public pricing, hybrid implementation, gross margins synced
- [x] Orphaned `src/app/[locale]/pricing/current/page.tsx` — prices synced (page is unreachable; recommend deletion)
- [ ] Validate WTP with 20–30 shops before public launch (user action)
- [ ] Announce founding-member cohort — first 20 shops (user action)
- [ ] Re-seed `feature_flags` — NOT needed: absence = ON and all orgs are free-enterprise (2026-07-21 migration)

Verified: `tsc --noEmit` clean · biome clean on changed files · `plan-features.test.ts` 14/14 · `pnpm i18n:check` exit 0 (no pricing-key warnings). Full monorepo `npm run verify` is the CI gate — run before release.

---

*Sources: 46 (25+ primary/vendor). Verification: all competitor prices read from vendor pages 2026-08-07; FX from xe.com; Mongolia benchmarks from playpass.com, masu.mn, tdbm.mn. Full claim-level detail: `~/.omp/research/2026-08-07-tolom-pricing-competitors/claims.md`.*
