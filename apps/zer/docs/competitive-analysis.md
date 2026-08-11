---
title: Zer Storefront Competitive Analysis
desc: Дэлгүүрийн нийтийн хуудас — бүрэн захиалгын урсгалын өрсөлдөөний шинжилгээ (products → cart → checkout → delivery)
date: 2026-08-10
---

# Zer Storefront Competitive Analysis

> Review date: 2026-08-10
> Scope: The public org page (`/[slug]`) and its complete buyer flow —
> products list → product detail → add to cart → checkout → delivery location →
> post-order. Seeded from `docs/gaps.md` (2026-07-18/07-31) and
> `docs/features/ecommerce-gap-plan.md`; this brief supersedes their
> storefront-flow sections and adds the 2026-08-10 codebase audit + research.
> Companion plan: `docs/features/ecommerce-gap-plan.md`.

---

## 1. Market Overview & Definition

**Market:** Mongolian SMB e-commerce — shop owners who need a public storefront
that sells without an ERP-grade back office. Zer's buyer-facing surface is
`zuiio.mn/<slug>` (or a custom domain), rendered from Zer's product/inventory
data.

**Key facts (see Verified Data §7 for sources):**
- E-commerce revenue estimates conflict: ECDB claims **US$921M (2025)**;
  PayAtlas reports **~US$150M (2023)** with ~25% YoY growth. Both agree the
  online share of total retail is **still <5%** and the 2026 forecast is
  **+30–35% growth** — a small, fast-growing market. [Contradiction documented]
- **Mobile-first buyers:** >80% smartphone penetration, >60% of e-commerce on
  mobile, QR/instant-transfer payments dominant.
- **Platform landscape (aftership 2026):** WooCommerce 534 stores (34.8%),
  Custom carts 404 (26.3%), Magento 319 (20.8%) — the market is DIY/fragmented;
  no single platform owns SMB storefronts.
- **Payment norms:** QPay (QR) dominant; SocialPay (Golomt) interoperable with
  QPay QR; bank transfer; cards; cash-on-delivery still essential for rural.

**Key success factors for a storefront in this market:**
1. Mobile-first checkout that collects a **delivery location** (Mongolian
   addresses are descriptive: "СБД, 1-р хороо, ..." — not postal-code based).
2. **QR/instant payment** (QPay/SocialPay) or a clear pay-later flow; COD as fallback.
3. Delivery vs pickup choice with visible fees / free-shipping threshold.
4. Order status visibility after purchase (paid → ready → out for delivery → delivered).
5. Promo mechanics buyers already know: coupon codes, gift cards, 1+1-style promotions.

---

## 2. Zer Storefront Current State (verified codebase audit, 2026-08-10)

| Flow step | Route / file | Status | Notes (verified) |
|---|---|---|---|
| Store home | `src/app/[slug]/page.tsx` | ✅ | Banner, logo, description, contact (email/phone/address), website, social links, business hours, policies, JSON-LD Organization, full catalog inline (paged 100) via ProductDetailDrawer |
| Products list | `src/app/[slug]/products/` + `products-page-client.tsx` | ✅ | Debounced search (`q`), category filter, pagination, mobile filter drawer, cart badge |
| Product detail | `src/app/[slug]/products/[id]/page.tsx` + `buy-panel.tsx` | ✅ | Single image, price, URL-driven variant selector, attributes, description, SKU/barcode/unit/category, **ProductReviews**, JSON-LD Product, canonical/OG. **No image gallery, no related products** |
| Cart | `src/app/[slug]/cart/cart-client.tsx` + `cart-context.tsx` | ✅ | localStorage cart, qty +/- , subtotal, idempotency key per session |
| Checkout (embedded in cart page — no `/checkout` route) | `cart-client.tsx` | ⚠️ | Fields: **name, phone, payment method (cash/card only)**. No address, no coupon, no delivery choice, no branch picker, no online payment |
| Order submission | `submit_shop_order` RPC (`20260803130000_idempotency_and_rate_limit.sql`) | ✅ | Server-side pricing, `FOR UPDATE` stock locks, per-org/per-phone flood limits, `dedupe_key` idempotent replay, creates `pending` sale + stock decrement + contact upsert. **Signature has NO address/coupon/shipping params** (8 params: slug, items, payment, currency, name, phone, branch_slug, idempotency_key) |
| Order success | `cart-client.tsx` | ✅ | Order id, total, status; links to order history |
| Buyer account + orders | `src/app/[slug]/account/` + `orders/orders-client.tsx` | ⚠️ | Signup/login, order list with status badge + line items. **No order detail page, no status timeline, no tracking/delivery ETA** |
| Reviews | `src/components/shop/product-reviews.tsx` | ✅ | Shown on product detail |
| Blog | `[slug]/blog/` | ✅ | List + detail |
| Analytics | `[slug]/layout.tsx` | ✅ | GA4 + Meta Pixel script injection per org |
| SEO | `generateMetadata`, `sitemap.ts` | ✅ | meta_title/description/OG, canonical (custom-domain aware), dynamic sitemap |
| **Staff delivery module** | `20260731000001_add_delivery_management.sql` + `src/app/(dashboard)/deliveries/` | ✅ | **Full staff-side system**: `deliveries`, `delivery_zones`, `delivery_providers`; address, address_note, delivery_fee, status flow pending→assigned→in_transit→delivered, courier assignment, external tracking id, provider integrations. **Nothing in the public flow connects to it** |
| Coupons / gift cards / promotions | Admin CRUD (`plans/ecommerce-coupon-system.md`, migrations 20260730+) | ⚠️ | Admin-side only. Promotions engine even has a `free_shipping` reward type. **Web checkout has no coupon field; mobile has a cosmetic field the RPC ignores** ("coupon validation is not public", `apps/zer-mobile/src/lib/checkout.ts`) |

**Bottom line:** every admin-side capability shipped in the 2026-07-30/08-03
push (coupons, gift cards, promotions, delivery module, analytics) stops at the
dashboard. The public checkout still takes only name + phone + cash/card and
never collects a **delivery location** — the one field the user's complete
flow depends on. Staff must phone the buyer to get an address and manually
create a `deliveries` row.

---

## 3. Competitive Set Summary

| Competitor | Type | Position | Relevance |
|---|---|---|---|
| **shop.mn** | Store builder (SaaS) | **Leader** — the established MN storefront benchmark; Zer was previously compared against it | Direct (feature benchmark) |
| **shoppy.mn** | Marketplace | Challenger (marketplace model, 700+ partners) | Indirect (buyer expectations) |
| **easyshop.mn (Greensoft)** | Store builder | Niche (SMS-order / phone-first retail) | Direct |
| **nomnom.mn / ugs.mn** | Marketplaces | Challenger (demand platforms) | Indirect (delivery/payment norms) |
| **Shopify (+ MN localizers like cartdna)** | Global store builder | Adjacent/global benchmark | UX benchmark (checkout) |

**Adjacent:** Facebook/Instagram Messenger commerce (the default MN SMB sales
channel — photos + DMs + delivery by hand), Telegram, DIY WooCommerce/Magento
(34.8% + 20.8% of MN stores), Pando-style courier services, **market.shop**
(another MN storefront system: website + order management + inventory +
delivery + payments — surfaced 2026-08-10, profile UNVERIFIED).

---

## 4. Competitor Profiles

### 4.1 shop.mn — Leader (store builder)

- **What it is:** AI-positioned MN e-commerce platform (Datacom Cloud LLC).
  Store creation, product/category/inventory, design/banner, custom domain,
  plan billing, 14-day free trial.
- **Verified plan features (shop.mn/pricing, 2026-08-10):** unlimited orders,
  0% commission, product caps (Standard 100 / Ultimate 1000), staff caps
  (2 / 10), **QPay auto-payment**, product promotions, **coupons**, **gift
  cards**, custom domain, reports/finance, AI poster, AI chatbot (FB chat).
  AI Basic = **199,000₮/mo** (verified); other plan prices are number-obfuscated
  on the page → UNVERIFIED.
- **Checkout/delivery:** bank-account transfer payments (help.shop.mn); SMS
  notifications at each order status ("paid, ready for pickup, out for
  delivery, delivered") with brand-voice placeholders. shop.mn's **own
  delivery service is "coming soon"** (shop.mn/delivery) — shops self-manage
  delivery, which is the norm.
- **Strengths:** full marketing stack buyers expect (coupons, gift cards,
  promotions), QPay built in, status-driven SMS, AI features.
- **Weaknesses (for Zer's purposes):** no ERP behind the storefront — orders
  don't touch inventory/accounting automatically at the same depth; delivery
  is not yet platform-managed; no offline-first.
- **Threat:** it is the default "make my store" choice and now adds AI + chat
  commerce (pay inside the chat).
- **Differentiation opportunity for Zer:** Zer already ships the full
  marketing stack + a *staff delivery module* + offline-first + ERP
  integration. The gap is purely **public-flow wiring** — connect checkout →
  delivery → inventory/accounting and Zer out-executes shop.mn on the
  complete loop.

### 4.2 shoppy.mn — Challenger (marketplace)

- **What it is:** national marketplace (CODY LLC), "global brands in one
  place"; 700+ partner orgs; app (updated 2026-02-10); working-capital loans
  against platform sales (tdbm.mn); buy-now-pay-later/credit (shoppy credit,
  since 2021).
- **Strengths:** demand aggregation, financing (BNPL), app.
- **Weaknesses:** marketplace model — merchants don't own the channel or
  customer relationship; no ERP/back office.
- **Threat:** BNPL + marketplace demand pulls SMBs onto the platform instead
  of their own storefront.
- **Opportunity:** Zer storefronts are merchant-owned channels; adding a
  simple **installment/BNPL or payment-link option** would close the financing
  gap without marketplace dependency.

### 4.3 easyshop.mn (Greensoft) — Niche (phone-first store builder)

- **What it is:** Greensoft's brand-store builder (shop.greensoft.mn) with
  phone-order acceptance and SMS-payment invoicing; omni-channel retail
  positioning; standard packages + custom builds (2–5 days for small shops).
- **Pricing (UNVERIFIED amounts):** custom-quoted via sales@greensoft.mn — no
  published storefront prices; agency site quotes domains only
  (.MN 165,000₮ / .COM 62,500₮ / .NET 94,600₮, greensoft.mn, 2026-08-10).
- **Strengths:** SMS-first ordering suits phone-heavy MN retail; low-friction;
  agency hands-on setup.
- **Weaknesses:** narrow self-serve feature set, no ERP, quote-based pricing
  (vs Zer's self-serve SaaS).
- **Threat:** low, but validates **SMS/phone-order + payment-link** as a flow
  Zer should consider (its public checkout currently has no SMS step).

### 4.4 nomnom.mn / ugs.mn — Marketplaces (delivery/payment norms)

- **nomnom/ugs specifics: UNVERIFIED (2026-08-10)** — searches surfaced
  other MN stores, not these two marketplaces directly. Their market
  relevance is as demand platforms; treat this profile as the general MN
  storefront norm instead.
- **MN storefront delivery norms (observed on primary sources, 2026-08-10):**
  - synergetic.mn: UB delivery within 48h of order; rural 3–5 days;
    **free delivery over 100,000₮, else flat 7,000₮**; fee independent of
    weight/size; delivery 10:00–22:00; limited zones; COD with signed receipt.
  - nandindiy.com: ships 24–48h after confirmation; **free over 30,000₮;
    fee 6,500–10,000₮ by region**; rural via Mongol Post; **100% prepayment
    required** (no COD).
  - bestcomputers.mn: delivery 8–48h after payment.
  - goodpricemarket.mn: payment by all-bank cards, internet/mobile banking,
    **QPay QR**, cash; ships after payment.
  - prouve.mn: delivery zones, 24–72h, "order today" framing.
- **Pattern:** MN stores converge on **free-delivery threshold (30k–100k₮) +
  flat fee (6.5k–10k₮) + delivery window + zone limits**, with either COD or
  prepayment depending on the store. No universal standard — each shop
  publishes its own terms.
- **Implication for Zer:** the platform should let each org configure its own
  delivery fee / zone / free-shipping threshold and show it at checkout, not
  invent a national standard. The free-shipping threshold is the single most
  common mechanic — and Zer's promotions engine already has a `free_shipping`
  reward to drive it.

### 4.5 Shopify (global) — Adjacent benchmark (checkout UX)

- **2026 checkout best practices (shopify.com, cartylabs):** one-page checkout;
  collect email → name → address → shipping → payment in buyer order; dynamic
  totals as promo/address/option changes; **explicit delivery options with
  concrete windows** ("Order today for delivery May 22–24"); free-shipping
  threshold banners; wallets/express payment above the fold; bottom-fixed CTA
  on mobile; only ask fields needed to complete.
- **Relevant for Zer:** the current cart page is already one-page checkout
  (good) but lacks: address collection, delivery options, dynamic totals
  (no shipping/promo lines), free-shipping messaging, express/QR payment,
  and concrete delivery ETA.

---

## 5. Strategic Gaps (numbered, evidence-backed)

**G1 — Delivery location is not collected at checkout (P0).**
Public checkout (web + mobile) collects only name/phone. `submit_shop_order`
has no address/notes params. The staff `deliveries` module requires
`contact_name`, `contact_phone`, `address` — staff must call the buyer after
every order. Evidence: `cart-client.tsx` (fields), `20260803130000` RPC
signature, `deliveries/actions.ts createDelivery`.

**G2 — Delivery fee / shipping cost absent from the flow (P0).**
`deliveries.delivery_fee` exists staff-side; promotions engine has a
`free_shipping` reward — but the checkout total is item-sum only, no fee, no
free-shipping threshold, no zone. Evidence: `cart-client.tsx` total =
`computeTotalAmount(items)`; `shop-cart.ts` has discount math only.

**G3 — No delivery vs pickup choice; branch picker unused (P0/P1).**
`submit_shop_order` accepts `p_branch_slug` but the web client never sends it
and no UI exposes branches. Buyer cannot choose pickup location or delivery.
Evidence: RPC param exists; `cart-client.tsx` omits it.

**G4 — No online/QR payment (QPay/SocialPay/bank transfer) (P0).**
Only `cash`/`card`; orders are created `pending` and paid after staff confirm.
shop.mn sells QPay as a plan feature; QPay is the dominant MN payment channel;
`free_shipping`-style automation needs a paid state. Evidence: PAYMENT_METHODS
in `cart-client.tsx`; shop.mn/pricing; qr.qpay.mn.

**G5 — Coupon codes cannot be redeemed (P1).**
Coupons shipped admin-side (2026-07-30 push) but checkout has no field;
zer-mobile has a field the RPC ignores ("coupon validation is not public").
A buyer entering a valid code gets a silent no-op. Evidence: `apps/zer-mobile/src/lib/checkout.ts:39`; RPC signature.

**G6 — Gift cards cannot be redeemed (P1).**
Same as G5 — `gift_cards` admin CRUD exists; no public redemption.

**G7 — Promotions (1+1, free_shipping) not evaluated at checkout (P1).**
Promotions engine + `free_shipping` reward exist; web cart totals ignore
promotions entirely.

**G8 — No buyer-facing order tracking (P1).**
Orders list shows a static status badge; no status history, no delivery
ETA/tracking number, no SMS/email on status change (shop.mn SMSes 6 statuses;
MN marketplaces show delivery windows). Staff `deliveries.status` exists but
is never exposed to buyers.

**G9 — No order detail page for buyers (P2).**
Guest success screen shows the order id once; signed-in history is a flat
list. No re-view of a past order's full details.

**G10 — No product image gallery / related products (P2).**
Single `image_url` per product; detail page renders one image. The 2026-07-18
gap plan listed "Зураг галерей" as the goal.

**G11 — No stock/sold-out signal (deliberate; revisit).**
"Public storefront exposes no stock — never block on stock data"
(`buy-panel.tsx`) is a privacy decision. Buyers cannot see "only 3 left" or
"out of stock"; out-of-stock items still show buy buttons and fail at submit.
Recommend a per-org opt-in (`show_stock` / `show_sold_out` flag).

**Non-gaps (already shipped, do not re-plan):** GA4/Meta Pixel injection,
SEO meta + sitemap + custom domains, reviews, blog, buyer accounts, idempotent
rate-limited checkout RPC, offline-first.

---

## 6. Requirements Derived from Competition

Priority: P0 = blocks a complete flow / revenue; P1 = high conversion value;
P2 = polish.

| # | Requirement | Priority | Source insight | Acceptance signal |
|---|---|---|---|---|
| R1 | Checkout collects delivery address + notes | P0 | G1; Shopify address collection; MN descriptive addresses | Buyer enters address at checkout → `submit_shop_order` persists it → staff `deliveries` row pre-created with address |
| R2 | Delivery vs pickup choice at checkout | P0 | G3; shop.mn statuses include pickup; MN norm | Checkout shows pickup (branch list) / delivery toggle; branch selection persists to sale |
| R3 | Per-org delivery fee + free-shipping threshold config | P0 | G2; MN norm = free-delivery threshold (30k–100k₮) + flat fee (6.5k–10k₮) [synergetic.mn, nandindiy.com, 2026-08-10]; Shopify free-shipping banners | Org settings define fee/threshold → checkout shows "Хүргэлт: X₮ / Үнэгүй" + free-shipping progress hint (reuse promotions `free_shipping` reward) |
| R4 | QPay (or SocialPay/bank transfer) payment option | P0 | G4; shop.mn QPay; QPay dominance; payatlas | Buyer can choose QPay → payment link/QR generated → order flips to paid on webhook |
| R5 | Coupon redemption at checkout | P1 | G5; shop.mn coupons on every plan | Code field → server-side validation in RPC → discount line in totals; invalid/expired code shows error |
| R6 | Gift card redemption at checkout | P1 | G6; shop.mn gift cards | Code field → balance applied → partial redemption tracked |
| R7 | Promotion evaluation in cart totals | P1 | G7; shop.mn promotions; `free_shipping` reward exists | 1+1 / threshold discounts / free shipping applied and itemized in cart |
| R8 | Buyer order status timeline + delivery ETA/tracking | P1 | G8; shop.mn 6-status SMS; marketplace ETA | Buyer account shows status history; staff `deliveries.status` + external_tracking_id visible |
| R9 | Order confirmation notification (SMS/email) | P1 | G8; shop.mn SMS at each status; easyshop SMS-first | Buyer gets confirmation + status-change notification (reuse existing SMTP/Telegram infra) |
| R10 | Buyer order detail page | P2 | G9 | Click order → full detail incl. address, items, status, payment |
| R11 | Multi-image product gallery | P2 | G10; 2026-07-18 gap plan | Product supports multiple images; detail page renders gallery |
| R12 | Opt-in stock/sold-out visibility | P2 | G11; MN stores show availability | Org toggle → detail/list shows "Нөөцөд байгаа / Дууссан"; out-of-stock disables add-to-cart |

**Implementation constraint (from existing architecture):** all mutations are
Server Actions / public RPCs; buyer checkout is anon-facing → new params must
go through `submit_shop_order` (or a v2 RPC) with server-side validation,
never client pricing. Keep the flood-limit + idempotency guarantees intact.
Follow `docs/features/ecommerce-gap-plan.md` patterns (migration →
actions/checkout integration → UI → tests).

---

## 7. Competitive Positioning Statement

Zer is not "another store builder" and not "another marketplace". It is the
only Mongolian platform that pairs a public storefront with a real ERP behind
it: the same products, stock, customers, accounting, and now a staff delivery
module. The 2026-08-03 push already matched shop.mn's marketing stack
admin-side; the remaining move is to **complete the buyer loop** — collect a
delivery location, offer QR payment, honor coupons/gift cards/promotions at
checkout, and surface order tracking. Done end-to-end, Zer's storefront beats
shop.mn on the full sell→fulfill→account loop and beats Shopify-style DIY on
Mongolian context (descriptive addresses, QPay/SocialPay, MN phone rules,
Mongolian-first UX).

---

## 8. Verified Data

| Claim | Value | Source | Confidence |
|---|---|---|---|
| shop.mn AI Basic plan | 199,000₮/mo (verified visually) | shop.mn/pricing (2026-08-10) | High |
| shop.mn plans include coupons, gift cards, promotions, QPay, custom domain | Verified feature list | shop.mn/pricing (2026-08-10) | High |
| shop.mn other plan prices | Number-obfuscated in HTML → **UNVERIFIED (2026-08-10)** | shop.mn/pricing | Low |
| shop.mn own delivery service | "Coming soon" — stores self-manage delivery | shop.mn/delivery (2026-08-10) | Medium (vendor-stated) |
| shop.mn order status SMS flow (paid/pickup/out-for-delivery/delivered) | Vendor claim | shop.mn homepage (2026-08-10) | Medium (vendor-stated) |
| QPay merchant fees | 1% domestic cards; 300,000₮ one-time registration | tdbm.mn QPay merchant page (2026-08-10) | High |
| SocialPay ↔ QPay QR interoperability | Both read each other's QR | golomtbank.com/news/36338 (2023) | High |
| MN e-commerce revenue | **Contradiction:** ECDB US$921M (2025) vs PayAtlas ~US$150M (2023, ~25% YoY) | ecdb.com; payatlas.com | Medium — methodologies differ; both show <5% online retail share |
| MN e-commerce growth forecast 2026 | +30–35% (ECDB) | ecdb.com | Medium |
| MN store platform share | WooCommerce 34.8%, Custom 26.3%, Magento 20.8% | aftership.com (2026) | Medium |
| MN delivery norm — free threshold + flat fee | synergetic.mn: free >100,000₮ else 7,000₮; nandindiy.com: free >30,000₮, fee 6,500–10,000₮ by region; prepayment vs COD varies | synergetic.mn/delivery, nandindiy.com (2026-08-10) | High (primary storefronts) |
| easyshop.mn pricing model | Quote-based (no published storefront prices); domains .MN 165,000₮ | shop.greensoft.mn, greensoft.mn (2026-08-10) | Medium |
| nomnom.mn / ugs.mn checkout specifics | **UNVERIFIED (2026-08-10)** — not directly reached | — | Low |
| Shopify one-page checkout best practices (dynamic totals, address autofill, delivery ETA, free-shipping thresholds) | 2026 guides | shopify.com, cartylabs.com | High |
| Zer web checkout fields | name, phone, cash/card only | `cart-client.tsx` (verified 2026-08-10) | High (code) |
| `submit_shop_order` params | 8 params; no address/coupon/shipping | `20260803130000` migration (verified) | High (code) |
| Staff delivery module exists | `deliveries`, `delivery_zones`, `delivery_providers`, fee, statuses, tracking | `20260731000001` migration + `src/app/(dashboard)/deliveries/` (verified) | High (code) |
| Coupon/gift-card/promotion admin CRUD shipped | 2026-07-30 push | `plans/ecommerce-coupon-system.md`, migrations (verified) | High (code) |
| Mobile coupon field is cosmetic | "coupon validation is not public" | `apps/zer-mobile/src/lib/checkout.ts:39` (verified) | High (code) |

**Contradictions:** (1) MN market size $921M vs $150M — different scopes
(ECDB total digital commerce vs PayAtlas online retail); resolved by quoting
both and relying on the agreed <5% online share + growth trajectory.
(2) shop.mn delivery "coming soon" vs shops already offering delivery —
shop.mn the platform does not ship orders; individual stores do. Not a
true contradiction once scoped.

---

## 9. Research Backlog

| Open question | Method | Timing |
|---|---|---|
| Exact shop.mn Standard/Ultimate/AI PRO prices | Signup/login or archive capture of `/pricing` with JS-rendered prices | Before pricing comparisons |
| shop.mn checkout UX (fields, delivery options) — live store walkthrough | Register a test store or browse a public shop.mn storefront; record checkout form fields | Before R1–R4 build |
| Nomnom/ugs delivery-fee models (per-shop config vs platform standard) | Visit 3–5 public storefronts on each; screenshot checkout | Before R3 config design |
| Pando / courier API integration feasibility for automatic delivery creation | Pando partner docs | Before R2/R8 build |
| BNPL demand for Zer storefronts | Interview 5–10 existing Zer retail customers | After P0 flow ships |
| **Automatic payment webhook confirmation (R4)** — `submit_shop_order` now accepts `qpay`/`bank_transfer`, stores the method and returns the org's bank/QPay payment instructions (`payment_instructions`), but confirmation is still manual by staff. Ship QPay invoice creation (QPay merchant API invoice + `payment_link`) at submit and a webhook that flips `pending → completed` on payment. No QPay client exists in the monorepo yet (apps/sms-pay is an unchecked-out submodule); needs credentials config + a webhook route with checksum verification. | QPay merchant API docs + monorepo payment-gateway pattern (bonum in zatly/black-yak as reference) | After P0 flow ships |
| **Buyer confirmation email (R9)** — `submitStoreOrder` server action + `sendOrderConfirmationEmail` (src/lib/order-email.ts, Mongolian HTML via SMTP) are implemented and unit-tested, but the web (`cart-client.tsx`) and mobile checkouts still call `submit_shop_order` RPC directly from clients, so the email never fires. Route both checkouts through `submitStoreOrder` (or a pg_net/edge-function hook) to activate it. | Wire UI checkout → server action; verify SMTP delivery | After P0 flow ships |

---

## 10. Next Actions (immediate, from this brief)

1. **R1+R2 (delivery location + pickup/delivery choice):** extend
   `submit_shop_order` with address/address_note/delivery_type params
   (preserving idempotency + flood limits), persist on sale, auto-create the
   `deliveries` row (status pending) so staff confirm instead of re-typing.
2. **R3 (delivery fee config):** org settings for fee + free-shipping
   threshold; evaluate at checkout (reuse promotions `free_shipping`).
3. **R4 (QPay):** payment link/QR generation on order submit; webhook flips
   `pending → paid`. Largest effort, largest revenue impact.
4. **R5–R7 (coupons/gift cards/promotions):** server-side validation inside
   the RPC; remove or wire the mobile coupon field (a silent no-op field is
   worse than none).
5. **R8–R9 (tracking + notifications):** expose `deliveries.status` +
   `external_tracking_id` in `get_my_orders`; reuse SMTP/Telegram infra for
   confirmation messages.
6. Remove or fix the cosmetic mobile coupon field in the same change as R5.
