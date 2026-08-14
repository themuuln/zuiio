# Parts & Services — Feature Gaps

> Review date: 2026-07-17
> **Verified: 2026-07-31** — gaps checked against actual codebase
> **Updated: 2026-08-03** — offline background sync, ITP reminders, e-Barimt, customer portal shipped
> Scope: Parts inventory, suppliers, services, purchase orders, stock management

> Feature regression evidence (2026-07-31): 14 feature test files, 204 tests passing.


---

## 🔴 High Impact

- [x] **Barcode scanning on parts** — ✅ RESOLVED. `barcode` column on `parts_catalog`, scan input on part creation/PO receive/catalog combobox. PO receive-by-barcode API route.
- [x] **Quick Stock In** — ✅ RESOLVED. `QuickStockInDialog` component on part detail page with unit tests.
- [x] **Part-to-vehicle fitment on detail page** — ✅ RESOLVED. `VehicleFitment` component shows make/model, compatibility notes, specific price.
- [x] **Supplier price history per part** — ✅ RESOLVED. `SupplierPriceHistory` component showing supplier + date + qty + unit cost.
- [x] **Stock count / cycle counting** — ✅ RESOLVED. Full stock count feature: `stock_count_sessions` + `stock_count_items` tables, `count_adjustment` movement type with correct sign, reconciliation service creating adjustment movements on session completion, DetailDrawer-based multi-step UI (add items → review → reconcile), 69 passing tests.
- [x] **Returns / warranty tracking** — ✅ RESOLVED. `ReturnToSupplierDialog` with reasons (defective, wrong part, customer return).
- [x] **Minimum order quantity per supplier** — ✅ RESOLVED. `min_order_quantity` + `lead_time_days` columns added to `suppliers`.

## 🟡 Medium Impact

- [x] **Commonly paired services + parts** — ✅ RESOLVED. `service_part_suggestions` table, API, 19 passing tests.
- [x] **Bulk import for parts** — ✅ RESOLVED. CSV import page, PapaParse service, template download, 11 tests. Minor i18n fix applied.
- [x] **Multiple part images** — ✅ RESOLVED. `part_images` table, gallery component on part detail page, set-primary support, 22 tests.
- [x] **Automated reorder suggestions** — ✅ RESOLVED. `/inventory/reorder` page showing parts below threshold with suggested order qty, preferred supplier, Create PO link, API + hooks + nav item.
- [x] **Compatibility notes on vehicle-model fitment** — ✅ RESOLVED. `compatibility_notes` column added to `vehicle_model_parts`.
- [x] **Supplier performance tracking** — ✅ RESOLVED. `supplier_performance` DB view (total POs, completed rate, avg cost, last order date), organization-scoped service and API endpoint.

- [x] **Supplier-to-part mapping** — ✅ RESOLVED. `supplier_parts` junction table with `supplier_part_number`, `unit_cost`, `is_preferred`. Two API routes + drawer UI for assigning parts to suppliers. 20 tests.
- [x] **Service cost in catalog** — ✅ RESOLVED. `default_cost` column added to `service_catalog`.

## 🟢 Low Impact / Future

- [x] **Expiry date tracking** — ✅ RESOLVED. `part_batches` table with `expiry_date` tracking, RLS, indexes.
- [x] **Parts warranty tracking** — ✅ RESOLVED. `warranty_months`, `warranty_expires_at`, `warranty_notes` columns on `work_order_parts` + `default_warranty_months` on `parts_catalog`.
- [x] **Print labels / shelf tags** — ✅ RESOLVED. "Print Label" button on part detail page with @media print styles showing name, number, category, price.
- [x] **Multi-unit support** — ✅ RESOLVED. `alt_unit`, `alt_unit_conversion`, `alt_unit_label` columns on `parts_catalog`.
- [x] **Cost center allocation** — ✅ RESOLVED. `cost_center` column on `expenses` with index.

---

## Code-Level Issues

- [x] **`inventory_movements` has no `reference_id`** — ✅ RESOLVED. `reference_id` (UUID) + `reference_type` (TEXT) added. Index created.
- [x] **`service_catalog` has no cost field** — ✅ RESOLVED. `default_cost` (NUMERIC) column added.
- [x] **`getPart` doesn't filter by `organization_id`** — ⚠️ CLAIM INCORRECT. `getPart()` in `inventory-service.ts:95-120` already filters by `organization_id`, `id`, and `deleted_at IS NULL`.
- [x] **No supplier-to-part mapping** — ✅ RESOLVED. `supplier_parts` junction table with `supplier_part_number`, `unit_cost`, `is_preferred`. Two API routes + drawer UI. 20 tests.

---

## Recommended Build Order (Small Shop Focus)

1. **Barcode on `parts_catalog` + scan UI** — ✅ DONE
2. **Quick Stock In + Stock Count** — ✅ DONE

INS.POST 141:

**Updated status:** The KDS foundation is shipped. Next work is operational hardening: realtime invalidation, wall-display authentication, and kiosk-mode deployment.
3. **Vehicle fitment on part detail page** — ✅ DONE

---

---

# Competitive Gap Analysis (vs. Top POS Systems)

> Review date: 2026-07-18
> **Verified: 2026-07-31** — each gap checked against codebase
> Source: Competitive analysis of Square, Toast, Clover, Shopify POS
> Scope: UX patterns, feature gaps, differentiation opportunities

---

## 🔴 P0 — Critical Gaps

### 1. Offline Mode (✅ Resolved)

**Current state:** `OfflineQueueIndicator`, `OfflineBanner`, `MutationQueueProvider` exist. Background sync shipped 2026-08-03: `@zuiio/offline` `requestMutationBackgroundSync` (via `navigator.serviceWorker.getRegistration()`) + SW `sync-mutations` tag in the Serwist service worker; replay on focus/pageshow/visibilitychange; SW message invalidates query keys. SW now actually registers on Turbopack builds (Serwist, `/serwist/sw.js` — the previous next-pwa/@serwist/next plugins never ran under Turbopack, leaving a placeholder SW).

**Verdict:** ✅ **RESOLVED** — background sync + registered service worker + offline mutation queue.

---

### 2. Workshop Display / KDS (✅ Resolved)

**Current state:** Full-screen `/dashboard/display` route showing active work orders in dark-themed CSS Grid cards with color-coded status badges, elapsed timers, vehicle/customer/mechanic info, live clock, and auto-polling every 10s.

**Verdict:** ✅ **RESOLVED.** Full-screen KDS with 10s polling, elapsed timers, and color-coded WO cards.

---

## 🟡 P1 — Competitive Gaps

### 3. AI Assistant (✅ Resolved)

**Verdict:** ✅ **RESOLVED.** Full AI Assistant with 5 Tolom-specific agent tools (work orders, parts, customers, inventory, appointments), DetailDrawer-based chat UI with floating button, streaming responses via `@zuiio/ai-agent`, and 19 passing tests.

---

### 4. Industry Presets / Templates (✅ Resolved)

**Verdict:** ✅ **RESOLVED.** 6 business types with preset configs (services, diagnosis labels, thresholds). 2-step onboarding wizard (type selection → org name). Business type stored in settings JSON, seeds catalog on signup. Settings section to change later.

---

### 5. Real-Time Notifications (✅ Resolved)

**Verdict:** ✅ **RESOLVED.** Full push notification infrastructure (`push-service.ts`, `web-push.ts`, `use-push-subscription.ts`). Telegram bot integration. Push on work order assignment and invoice sent.

---

## 🟢 P2 — Differentiation Opportunities

### 6. Onboarding Wizard (✅ Resolved)

**Verdict:** ✅ **RESOLVED.** Combined with Industry Presets. 2-step wizard: select garage type → enter org name.

---

### 7. Hardware Integration (⚠️ Partial)

**Verdict:** 🟡 **PARTIALLY RESOLVED.** QR scanner for mechanic clock-in/out. Barcode scanning in PO receive. No dedicated hardware (card reader, receipt printer, scanner gun).

---

### 8. Multi-Location Support (✅ Resolved)

**Verdict:** ✅ **RESOLVED.** `branches` table, `useSelectedBranchId()` Zustand store, `stock_transfers` for cross-location transfers, approval workflow, BranchIndicator.

---

## Comparison Matrix (Updated 2026-07-31)

| Feature | Tolom | Square | Toast | Clover |
|---------|-------|--------|-------|--------|
| Offline mode | 🟡 Partial | ✅ Full | ✅ Full | ✅ Full |
| Workshop display | ✅ Full-screen KDS | ❌ | ✅ KDS | ❌ |
| AI assistant | ✅ AI chat + tools | ❌ | ✅ Toast IQ | ❌ |
| Industry presets | ✅ 6 business types | ✅ Mode selector | ✅ Restaurant focus | ❌ |
| Real-time alerts | ✅ Push + Telegram | ✅ | ✅ | ✅ |
| Onboarding wizard | ✅ 2-step wizard | ✅ | ✅ | ✅ |
| Hardware | 🟡 Scanner only | ✅ Full line | ✅ Toast Go | ✅ Full line |
| Multi-location | ✅ Branches + transfers | ✅ | ✅ | ✅ |

---

## Key Insight

**Updated status:** The KDS foundation is shipped. Next work is operational hardening: realtime invalidation, wall-display authentication, and kiosk-mode deployment.

The remaining opportunity is to turn the shipped display into an operational moat:
1. Wall-mounted tablet showing the work queue
2. Realtime status updates (car enters bay → work starts → parts added → payment → done)
3. Time tracking per job
4. Mechanic assignment visibility

This maps 1:1 to Toast's KDS pattern but is adapted for auto repair.

---

---

# Competitor Research Update (2026-07-31)

> Source: Deep research run — 5 parallel workers, 63 sources (54 T1). Full report at `~/.omp/research/2026-07-31-tolom-zer-onoo-competitor-research/synthesis.md`

---

## 🛑 Critical Findings

### 1. Mongolian auto repair has ZERO local SaaS competitors

1C:Альфа-Авто (legacy desktop 1C Enterprise 8 config) is the only local option. A 2023 UFE thesis confirms most shops still use phone calls and messaging. **Tolom has a clear first-mover window of ~6-12 months.**

### 2. ITP vehicle inspection tracking is a legal requirement (missing)

APP Service (BRYO) already has automatic ITP expiration tracking + SMS reminders before expiry. This is a compliance feature, not optional. **Tolom cannot enter the Mongolian market without it.**

### 3. e-Barimt (tax receipt) is mandatory (missing)

All sales in Mongolia require e-Barimt integration. Tolom currently has none.

---

## 🔴 New P0 Gaps (From Competitor Research)

| Feature | Status | Competitor benchmark | Effort | Priority |
|---------|--------|---------------------|--------|----------|
| **QPay payment integration** | ❌ Missing (deliberately removed in migration `20260519000001`; re-add as follow-up) | APP Service, all local POS | 2-3 weeks | 🔴 Blocks revenue |
| **e-Barimt tax receipt** | ✅ Shipped — `ebarimt-integration-service.ts`, submit actions, settings | All local competitors | — | ✅ Legal requirement |
| **ITP tracking + reminders** | ✅ Shipped — expiry tracking + reminder cron (`itp-reminders` edge fn, daily 04:00 UTC) with email delivery (Resend); **SMS not implemented** | APP Service (BRYO) | — | ✅ Legal requirement |
| **Customer portal (branded)** | ✅ Shipped — token-based portal (`/portal`, `/estimate/[token]`) with portal auth | Tekmetric, ShopMonkey, AutoLeap, Repairius | — | 🟢 Table-stakes |
| **Consumer mobile app** | ❌ Missing | AutoSync (car owner app) | 4-6 weeks | 🟢 Needed for 2-sided network |
| **Mechanic mobile app** | ❌ Missing | All 6 international competitors | 3-4 weeks | 🟢 Table-stakes |

## 🟡 Updated P1 Gaps

| Feature | Status | Benchmark | Notes |
|---------|--------|-----------|-------|
| **Social/Telegram commerce** | 🟡 Partial — Telegram bot (notify owners, webhook, service-reminder channel) works; Facebook Messenger booking missing | 75%+ Mongolians use Facebook | Facebook Messenger booking, Telegram bot for service updates |
| **AI features (Mongolian-language)** | ❌ Missing | Fullbay AI, AutoLeap AIR | Not urgent but trend is clear |
| **Offline-first hardening** | ✅ Shipped — background sync + Serwist SW (2026-08-03) | No competitor has it | This is Tolom's unique moat — now production-ready |

## 🟢 Updated Differentiation Opportunities

1. **Bay view scheduling** → Market as "Mongolia's first Garage OS" — no competitor has dedicated bay visualization
2. **Multi-location** — ✅ Already done. This puts Tolom ahead of most international competitors (who charge extra for multi-shop)
3. **Offline-first** — Hardening this creates a moat no competitor can match for the Mongolian market

## Updated Comparison Matrix (International Auto Repair SaaS)

| Feature | Tolom | ShopMonkey | Tekmetric | Fullbay | AutoLeap |
|---------|-------|------------|-----------|---------|----------|
| Starting price/mo | Mongolian-market | $215/yr | $179/yr | $188 | $179/yr |
| Work Orders | ✅ | ✅ | ✅ | ✅ | ✅ |
| Parts Inventory | ✅ | ✅ | ✅ | ✅ | ✅ |
| DVI | ✅ (dv-inspections) | ✅ Basic+ | ✅ All tiers | ✅ | ✅ All tiers |
| Bay View | ✅ | ⚠️ Column view | ⚠️ Tech board | ⚠️ Basic | ⚠️ Work board |
| Customer Portal | ✅ Token-based portal | ✅ | ✅ | ✅ | ✅ |
| Consumer Mobile App | ❌ Missing | ✅ iOS/Android | ✅ iOS/Android | ✅ iOS/Android | ✅ iOS/Android |
| Offline-first | ✅ Background sync + SW | ❌ | ❌ | ❌ | ❌ |
| e-Barimt | ✅ Shipped | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A |
| QPay | ❌ Missing | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A |
| Mongolian Language | ✅ Native | ❌ | ❌ | ❌ | ❌ (EN/FR) |
| Multi-location | ✅ Free | ⚠️ Multi-Shop plan | ⚠️ +$70/mo | ✅ | ⚠️ Enterprise |

## Recommended Build Order

Based on competitive analysis:

1. **✅ e-Barimt** — shipped (`ebarimt-integration-service.ts`)
2. **✅ ITP tracking + reminders** — shipped (expiry tracking + daily reminder cron; email delivery; SMS pending)
3. **✅ Customer portal** — shipped (token-based portal)
4. **✅ Offline-first hardening** — shipped (background sync + Serwist SW)
5. **🟢 QPay** (removed in `20260519000001`; re-add when payment partner is chosen)
6. **🟢 Mechanic mobile app** (required for shop adoption)
7. **🟢 Consumer mobile app** (2-sided network)
8. **🟢 Market "Bay View" as differentiator** (already built — marketing only)
