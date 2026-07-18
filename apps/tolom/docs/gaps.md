# Parts & Services — Feature Gaps

> Review date: 2026-07-17
> Scope: Parts inventory, suppliers, services, purchase orders, stock management

---

## 🔴 High Impact

- [ ] **Barcode scanning on parts** — `barcode` only exists on `catalog_item_variants`, not `parts_catalog`. Add `barcode` column to `parts_catalog` directly. Add scan input to: part creation, PO receive, work order part lookup. Mobile camera + USB scanner support.
- [ ] **Quick Stock In** — Current flow requires PO → Receive. Add a "Quick Stock In" adjustment action from parts list or part detail for ad-hoc additions.
- [ ] **Part-to-vehicle fitment on detail page** — `vehicle_model_parts` table exists but `/dashboard/inventory/parts/[partId]` doesn't show which vehicles the part fits. High-value, low-effort.
- [ ] **Supplier price history per part** — No way to see "what did I pay Supplier X for this part over time?" Add purchase history view per part showing supplier + price + date.
- [ ] **Stock count / cycle counting** — No physical inventory count feature. Add flow: scan parts → enter physical count → system calculates variance → creates adjustment movements.
- [ ] **Returns / warranty tracking** — `inventory_movement_type` includes `"return"` but no UI flow. Add "Return to Supplier" action from PO or part detail. Track reason (defective, wrong part, customer return).
- [ ] **Minimum order quantity per supplier** — Add `min_order_quantity` and `lead_time_days` to `suppliers` table. Surface on PO creation.

## 🟡 Medium Impact

- [ ] **Commonly paired services + parts** — When adding "Oil Change" as a service, suggest "oil filter" and "engine oil" as parts. Add `service_parts_suggestions` mapping or use embedding vector similarity.
- [ ] **Bulk import for parts** — `customer-import-service.ts` exists but no equivalent for parts. Add CSV/Excel import (name, category, part_number, price, initial stock).
- [ ] **Multiple part images** — `image_url` stores one image. Parts sometimes need multiple angles or diagrams. Extend to multiple images.
- [ ] **Automated reorder suggestions** — Combine `stock_thresholds`, recent usage rate, and supplier lead time into a "Suggested Reorders" view.
- [ ] **Compatibility notes on vehicle-model fitment** — Add `compatibility_notes` field to `vehicle_model_parts` (e.g., "only fits 2015+ models").
- [ ] **Supplier performance tracking** — Track on-time delivery rate, defective rate, average lead time. Add delivery fields to POs, aggregate into supplier scorecard.
- [ ] **Service cost in catalog** — `service_catalog` has no cost field, only `default_price`. Add `default_cost` for labor cost/margin tracking.

## 🟢 Low Impact / Future

- [ ] **Expiry date tracking** — Add `expiry_date` to `parts_catalog` for parts that degrade (gaskets, adhesives, chemicals).
- [ ] **Parts warranty tracking** — Track warranty period per part (e.g., "12 months from purchase").
- [ ] **Print labels / shelf tags** — Print barcode labels for shelf organization.
- [ ] **Multi-unit support** — Sell in boxes, stock in individual units. `unit` is text — no conversion logic.
- [ ] **Cost center allocation** — Track which department/bay consumed which parts (for larger shops).

---

## Code-Level Issues

- [ ] **`inventory_movements` has no `reference_id`** — Can't trace a movement back to its source PO or work order. Movement says "purchase +5" but not "from which PO."
- [ ] **`service_catalog` has no cost field** — Can track revenue per service but not margin. No `default_cost` or `labor_cost`.
- [ ] **`getPart` doesn't filter by `organization_id`** — Relies on RLS alone (`service-catalog-service.ts:108`). Fragile — if RLS misconfigures, data leaks.
- [ ] **No supplier-to-part mapping** — Can't find "which suppliers supply Part X" or "what parts does Supplier Y carry" without querying PO history.

---

## Recommended Build Order (Small Shop Focus)

1. **Barcode on `parts_catalog` + scan UI** — Transforms daily workflow from typing to scanning
2. **Quick Stock In + Stock Count** — Daily adjustments without full PO flow
3. **Vehicle fitment on part detail page** — Data exists, just needs UI

---

---

# Competitive Gap Analysis (vs. Top POS Systems)

> Review date: 2026-07-18
> Source: Competitive analysis of Square, Toast, Clover, Shopify POS
> Scope: UX patterns, feature gaps, differentiation opportunities

---

## 🔴 P0 — Critical Gaps

### 1. Offline Mode (Incomplete)

**What competitors do:** Square's #1 feature is "keep selling without internet." Toast built their brand on "works during peak volume, even offline."

**Current state:** Has `offline-queue-indicator.tsx` but full offline sync is unclear.

**Why it matters:** Mechanics work in basements, garages, outdoor bays with bad WiFi. Offline mode is table stakes for auto repair POS.

**Action:** Full offline-first with background sync. When connection returns, sync queue to Supabase.

---

### 2. Workshop Display (Missing)

**What competitors do:** Toast's KDS (Kitchen Display System) is their killer feature. Every order from every channel in one place.

**Current state:** Has bay view but no dedicated full-screen mechanic display.

**Why it matters:** Mechanics need to see their queue, time elapsed, next steps — just like kitchen staff see orders. This is your Toast KDS equivalent.

**Action:** Build a full-screen "Mechanic Display" — shows assigned vehicles, status, time elapsed, next steps. Wall-mounted tablet in each bay.

---

## 🟡 P1 — Competitive Gaps

### 3. AI Assistant (Missing)

**What competitors do:** Datadog has Bits AI, Grafana has AI Assistant, Toast has Toast IQ, Square has AI-powered insights. Every top product in 2026 has AI.

**Current state:** No AI features visible.

**Opportunities:**
- "What's the most common repair this month?"
- "Suggest pricing based on parts cost"
- "Which mechanics are most efficient?"
- "What parts should I reorder?"

**Action:** Add AI chat assistant to dashboard that answers questions about garage performance.

---

### 4. Industry Presets / Templates (Missing)

**What competitors do:** Square lets you pick a "mode" (Restaurant/Retail/Services) and auto-generates a dashboard. Toast has industry-specific starter dashboards.

**Current state:** No garage type selector during onboarding.

**Opportunities:**
- Body shop vs. quick lube vs. full service vs. detailing
- Each type gets different default bay layout, service catalog, pricing rules

**Action:** Add "Garage Type" selector during onboarding → auto-configure bay view, service catalog, pricing.

---

### 5. Real-Time Notifications (Incomplete)

**What competitors do:** Square sends low-stock alerts. Toast sends real-time order notifications.

**Current state:** Has `notifications.ts` and Telegram integration but real-time push may not be complete.

**Action:** Push notifications via web-push + Telegram for: new work order, part low stock, payment received, bay status change.

---

## 🟢 P2 — Differentiation Opportunities

### 6. Onboarding Wizard (Incomplete)

**What competitors do:** Square: "Get up and running in minutes." Clover: "Set up and start taking payments same day."

**Current state:** Has `(onboarding)/onboarding/wizard-client.tsx` but unclear if complete.

**Action:** 3-step onboarding: (1) Garage type → (2) Add services & mechanics → (3) Register first vehicle

---

### 7. Hardware Integration (Missing)

**What competitors do:** Square sells dedicated hardware. Toast has Toast Go handheld. Clover has Station Duo.

**Action:** Tablet mounting for bay view + barcode scanner for parts lookup

---

### 8. Multi-Location Support (Missing)

**What competitors do:** Square supports "one location to one hundred." Toast has enterprise multi-location.

**Current state:** Has organization/roles/members but unclear on multi-location garage support.

**Action:** Location switching, cross-location inventory transfers, location-level reporting.

---

## Comparison Matrix

| Feature | Tolom | Square | Toast | Clover |
|---------|-------|--------|-------|--------|
| Offline mode | ⚠️ Partial | ✅ Full | ✅ Full | ✅ Full |
| Workshop display | ⚠️ Bay view | ❌ | ✅ KDS | ❌ |
| AI assistant | ❌ | ❌ | ✅ Toast IQ | ❌ |
| Industry presets | ❌ | ✅ Mode selector | ✅ Restaurant focus | ❌ |
| Real-time alerts | ⚠️ Partial | ✅ | ✅ | ✅ |
| Onboarding wizard | ⚠️ Partial | ✅ | ✅ | ✅ |
| Hardware | ❌ | ✅ Full line | ✅ Toast Go | ✅ Full line |
| Multi-location | ⚠️ Partial | ✅ | ✅ | ✅ |

---

## Key Insight

**Toast's KDS is their moat. You have bay view but no full-screen mechanic display. Build the "KDS for garages" — that's your killer feature.**

Every garage needs:
1. Wall-mounted tablet showing work queue
2. Real-time status updates (car enters bay → work starts → parts added → payment → done)
3. Time tracking per job
4. Mechanic assignment visibility

This maps 1:1 to Toast's KDS pattern but for auto repair.
