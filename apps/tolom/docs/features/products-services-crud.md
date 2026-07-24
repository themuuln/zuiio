# Products/Services CRUD & Consumers — Feature Research

> **Date:** 2026-07-18
> **Scope:** Service catalog, parts catalog, inventory, work order integration, estimates, invoices, reports, and all downstream consumers

---

## 1. Current State — What Exists

### 1.1 Service Catalog

**Table:** `service_catalog`
**Route:** `/dashboard/services/`
**Service layer:** `service-catalog-service.ts`

| Capability | Status | Details |
|---|---|---|
| CRUD (list/create/update/delete) | ✅ Full | Factory-backed with backward-compatible wrappers |
| Categories | ✅ | Combinobox with create-new option |
| Bilingual names | ✅ | `name` + `name_mn`, locale-aware display |
| Default pricing | ✅ | `default_price` in MNT |
| Vehicle model-specific pricing | ✅ | `vehicle_model_services` — per-make/model price overrides |
| Price history (last sold) | ✅ | `service_price_history` tracks last price used on work orders |
| Service reminders | ✅ | `service_reminders` + `service_schedules` + `vehicle_service_schedules` |
| Global catalog (reference services) | ✅ | `global_services_catalog` — fork into local catalog |
| Work order integration | ✅ | `work_order_services.service_catalog_id` → `service_catalog.id` |
| Estimate integration | ✅ | `estimate_items.source_service_id` → `service_catalog.id` |
| Cost/margin tracking | ❌ | No `default_cost` or `labor_cost` — tracks revenue only, not margin |
| Bulk import | ❌ | No CSV/Excel import for services |
| Batch operations | ❌ | No multi-select delete, archive, or price update |

**UI Components:**
- `services/_services-client.tsx` — DataTable with category filter badges, sidebar tabs (Categories summary, Popular/most expensive)
- `services/_edit-service-drawer.tsx` — DetailSheet side panel
- `services/_columns.tsx` — Factory function for ColumnDef
- `components/services/service-form.tsx` — Reusable form
- `components/services/service-model-prices-drawer.tsx` — Per-vehicle-model pricing
- `components/services/variant-editor-drawer.tsx` — Variant management
- `components/services/variant-selection-dialog.tsx` — Variant picker

### 1.2 Parts/Inventory Catalog

**Table:** `parts_catalog`
**Route:** `/dashboard/inventory/` (hub with 4 tabs + sub-pages)
**Service layer:** `inventory-service.ts`

| Capability | Status | Details |
|---|---|---|
| CRUD (list/create/update/delete) | ✅ Full | Factory-backed |
| Categories | ✅ | `getPartCategories` + `createPartCategory` |
| Bilingual names | ✅ | `name` + `name_mn` |
| Default pricing | ✅ | `default_price` |
| Unit tracking | ✅ | `unit` field (text — no conversion logic) |
| Single image | ✅ | `image_url` on `parts_catalog` |
| Vehicle model-specific pricing | ✅ | `vehicle_model_parts` — per-make/model overrides |
| Global catalog (reference parts) | ✅ | `global_parts_catalog` — fork into local |
| Stock balances | ✅ | `inventory_balances` — per org+part+branch |
| Weighted average cost | ✅ | RPC `get_weighted_average_cost` |
| Stock movements (8 types) | ✅ | `inventory_movements` — purchase, sale, adjustment, transfer_in/out, return, waste, disassembly |
| Stock thresholds (min stock alerts) | ✅ | `stock_thresholds` with dashboard alerts |
| Suppliers | ✅ | Full CRUD (`suppliers` table) |
| Purchase orders | ✅ | Full PO workflow with line items (`purchase_order_items`) |
| Parts cars (disassembly) | ✅ | Track cars disassembled for parts |
| Stock transfers (multi-branch) | ✅ | `stock_transfers` + `stock_transfer_items` |
| Valuation report | ✅ | `/dashboard/inventory/valuation` |
| Barcode scanning | ❌ | `barcode` only on `catalog_item_variants`, not on `parts_catalog` directly |
| Quick stock in | ❌ | Requires full PO → Receive flow |
| Cycle counting | ❌ | No physical inventory count feature |
| Part-to-vehicle fitment UI | ⚠️ | `vehicle_model_parts` table exists but not surfaced on part detail page |
| Supplier price history | ❌ | Can't see "what did I pay Supplier X for Part Y over time?" |
| Returns/warranty | ❌ | `inventory_movement_type` includes `"return"` but no UI flow |
| Min order quantity | ❌ | No `min_order_quantity` or `lead_time_days` on suppliers |
| Multiple images | ❌ | Single `image_url` only |
| Automated reorder suggestions | ❌ | No computed reorder recommendations |
| Bulk import | ❌ | No CSV/Excel import for parts |

**UI Components:**
- `inventory/_components/parts-tab.tsx` — Dual sub-tabs: My Inventory + Global Catalog
- `inventory/_components/movements-tab.tsx` — Movement history + record form
- `inventory/_components/suppliers-tab.tsx` — Supplier CRUD (inline modal)
- `inventory/_components/purchase-orders-tab.tsx` — PO list + create + receive
- `inventory/parts/[partId]/` — Detail page with stock history, threshold, edit form
- `inventory/parts-cars/` — Disassembly car management
- `inventory/suppliers/` — Supplier list + new form
- `inventory/purchase-orders/` — PO list + new form
- `inventory/movements/` — Movement log
- `inventory/alerts/` — Stock shortage alerts
- `inventory/valuation/` — Valuation report
- `components/inventory/part-form.tsx` — Reusable part creation/editing form
- `components/inventory/supplier-form.tsx` — Supplier form
- `components/bay-view-v2/_catalog-picker-drawer.tsx` — Catalog picker for work orders

---

## 2. All Consumers — How Services & Parts Flow Through the System

### 2.1 Work Orders (Primary Consumer)

**Tables:** `work_order_services`, `work_order_parts`

Both are line items on work orders. When a mechanic adds a service or part to a work order:

| Field | work_order_services | work_order_parts |
|---|---|---|
| Catalog FK | `service_catalog_id` → `service_catalog` | `part_id` → `parts_catalog` |
| Denormalized name | `service_name` | `part_name` |
| Part number | — | `part_number` |
| Unit price | `unit_price` | `unit_price` |
| Unit cost | `unit_cost` | `unit_cost` |
| Quantity | `quantity` | `quantity` |
| Final price | `final_price` | `final_price` |
| Discount | `discount_amount` + `discount_percentage` | `discount_amount` + `discount_percentage` |
| Last sold price | `last_sold_price` | `last_sold_price` |
| Mechanic | `mechanic_id` | — |
| Variant | `catalog_item_variant_id` + `variant_label` | `catalog_item_variant_id` + `variant_label` |

**Hooks:**
- `useServiceLines(orgId, vehicleMake, vehicleModel)` — autocomplete + pricing for service lines
- `usePartLines(orgId, vehicleMake, vehicleModel)` — autocomplete + pricing for part lines

**Key behavior:** Line items denormalize the catalog name/price at time of creation. Subsequent catalog changes don't retroactively update work order line items — this is correct for historical integrity.

### 2.2 Estimates

**Table:** `estimate_items`

| Field | Type | Notes |
|---|---|---|
| `source_part_id` | FK → `parts_catalog` | Link to parts catalog |
| `source_service_id` | FK → `service_catalog` | Link to services catalog |
| `type` | `'part'` or `'service'` | Discriminator |
| `item_name` | text | Denormalized name |
| `quantity` | number | |
| `unit_price` | number | |
| `unit_cost` | number | |
| `tax_rate` | number | Per-item tax |
| `sort_order` | number | Display ordering |

Estimates can reference catalog items via FK but also store denormalized snapshots.

### 2.3 Invoices

**Table:** `invoice_items`

| Field | Notes |
|---|---|
| `description` | Free text (no FK to catalog) |
| `quantity` | |
| `unit_price` | |
| `tax_rate` | |

Invoices are **snapshots** — no FK back to service_catalog or parts_catalog. This is by design: invoices are legal documents that must not change if the catalog is edited later.

### 2.4 Service Reminders

**Tables:** `service_reminders`, `service_schedules`, `vehicle_service_schedules`

Services from `service_catalog` can be scheduled as recurring maintenance. `vehicle_service_schedules` ties a service to a specific vehicle with `recommended_interval_months`.

### 2.5 Reports

- **Revenue by service**: Aggregates `work_order_services.unit_price × quantity` grouped by `service_name`
- **Parts cost**: Aggregates `work_order_parts.unit_cost × quantity` for cost analysis
- **Finance tab**: Combined revenue/cost/expenses
- **Inventory valuation**: Current stock × weighted average cost per part

### 2.6 Bay View (Work Order Wizard)

The work order creation flow in bay-view-v2 uses:
- `components/bay-view-v2/_services-section.tsx` — Service line items
- `components/bay-view-v2/_parts-section.tsx` — Part line items
- `components/bay-view-v2/_catalog-picker-drawer.tsx` — Search + select from catalog

---

## 3. Database Schema — Key Tables

```
┌─────────────────────┐     ┌─────────────────────┐
│   service_catalog    │     │    parts_catalog      │
│─────────────────────│     │─────────────────────│
│ id                   │     │ id                   │
│ organization_id      │     │ organization_id      │
│ name                 │     │ name                 │
│ name_mn              │     │ name_mn              │
│ default_price        │     │ default_price        │
│ category             │     │ category             │
│ description          │     │ part_number          │
│ global_service_id FK │     │ unit                 │
│ branch_id FK         │     │ image_url            │
│                      │     │ global_part_id FK    │
│                      │     │ branch_id FK         │
│                      │     │ is_active            │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
     ┌─────┴───────────────────────────┴─────┐
     │                                        │
┌────┴──────────────────┐  ┌─────────────────┴─────┐
│ work_order_services    │  │   work_order_parts      │
│──────────────────────│  │───────────────────────│
│ work_order_id FK      │  │ work_order_id FK       │
│ service_catalog_id FK │  │ part_id FK             │
│ service_name (denorm) │  │ part_name (denorm)     │
│ unit_price            │  │ unit_price             │
│ unit_cost             │  │ unit_cost              │
│ quantity              │  │ quantity               │
│ final_price           │  │ final_price            │
│ discount_*            │  │ discount_*             │
│ mechanic_id           │  │                        │
└───────────────────────┘  └────────────────────────┘
           │                           │
     ┌─────┴───────────────────────────┴─────┐
     │                                        │
┌────┴──────────────────┐  ┌─────────────────┴─────┐
│ estimate_items          │  │   invoice_items         │
│──────────────────────│  │───────────────────────│
│ source_service_id FK  │  │ description (free)     │
│ source_part_id FK     │  │ NO FK to catalog       │
│ type (part/service)   │  │ (legal snapshot)       │
│ item_name, qty, price │  │ qty, unit_price, tax   │
└───────────────────────┘  └────────────────────────┘

┌──────────────────────┐
│ vehicle_model_services │ ← Per-vehicle-model price overrides
│ vehicle_model_parts    │ ← Per-vehicle-model price overrides
│──────────────────────│
│ service_catalog_id FK │
│ part_id FK            │
│ vehicle_model_id FK   │
│ specific_price        │
└──────────────────────┘

┌──────────────────────┐
│ service_price_history  │ ← Last sold prices
│ part_price_history     │ ← Last sold prices
│──────────────────────│
│ catalog item FK        │
│ unit_price             │
│ work_order_*_id FK     │
└──────────────────────┘
```

---

## 4. Competitor Landscape

### 4.1 Direct Competitors (Auto Repair POS)

| Feature | Tolom | Shop-Ware | Tekmetric | Mitchell 1 | AutoFluent |
|---|---|---|---|---|---|
| Service catalog CRUD | ✅ | ✅ | ✅ | ✅ | ✅ |
| Parts inventory | ✅ Full | ✅ Full | ✅ Full | ⚠️ Basic | ✅ Full |
| Multi-branch support | ✅ | ✅ | ✅ | ❌ | ✅ |
| Vehicle model pricing | ✅ Unique | ❌ | ❌ | ❌ | ❌ |
| Service reminders | ✅ | ✅ | ✅ | ✅ | ✅ |
| Barcode scanning | ❌ | ✅ | ✅ | ✅ | ✅ |
| Supplier management | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Purchase orders | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Cycle counting | ❌ | ✅ | ✅ | ❌ | ✅ |
| Mobile-first (tablets) | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ |
| Offline mode | ⚠️ Partial | ❌ | ❌ | ❌ | ❌ |
| AI features | ❌ | ✅ | ✅ | ⚠️ | ❌ |
| Pricing: per-vehicle-model | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mongolian localization | ✅ Unique | ❌ | ❌ | ❌ | ❌ |
| Disassembly/parts-car | ✅ Unique | ❌ | ❌ | ❌ | ❌ |

### 4.2 POS Systems (General)

| Feature | Tolom | Square | Toast | Clover |
|---|---|---|---|---|
| Offline mode | ⚠️ | ✅ | ✅ | ✅ |
| Workshop display | ⚠️ Bay view | ❌ | ✅ KDS | ❌ |
| AI assistant | ❌ | ❌ | ✅ | ❌ |
| Industry presets | ❌ | ✅ | ✅ | ❌ |

### 4.3 Tolom's Unique Differentiators

1. **Vehicle model-specific pricing** — No competitor does this. A "Brake Pad Replacement" costs differently for a Prius vs. a Land Cruiser, and Tolom captures that.
2. **Disassembly cars (Parts Cars)** — Track cars being stripped for parts. Unique to auto repair — no POS system has this.
3. **Bay view as workshop display** — Similar to Toast KDS but for garages.
4. **Offline-first** — Mechanics work in garages with bad WiFi. Partial offline exists; competitors have none in this vertical.
5. **Mongolian localization** — Bilingual UI, MNT currency, Mongolian bank integrations.

---

## 5. Gap Analysis — What's Missing

### 5.1 High Impact (Revenue & Daily Workflow)

| Gap | Impact | Effort | Notes |
|---|---|---|---|
| **Barcode scanning on parts** | 🔴 Daily workflow transform | Medium | `barcode` column exists on `catalog_item_variants` but not `parts_catalog`. Add scan input to: part creation, PO receive, work order part lookup. Mobile camera + USB scanner. |
| **Quick Stock In** | 🔴 Daily workflow | Low | Current flow: PO → Receive. Add "Quick Stock In" adjustment from parts list or detail for ad-hoc additions. Movement type `adjustment` already exists. |
| **Part-to-vehicle fitment on detail page** | 🔴 High-value, low-effort | Low | `vehicle_model_parts` table exists but `/dashboard/inventory/parts/[partId]` doesn't show which vehicles the part fits. Data exists, just needs UI. |
| **Service cost tracking** | 🔴 Can't measure margin | Low | `service_catalog` has no `default_cost` field. Can track revenue per service but not margin. Add `default_cost` for labor cost tracking. |
| **Supplier price history per part** | 🔴 Purchasing intelligence | Medium | No way to see "what did I pay Supplier X for this part over time?" Add purchase history view per part. |
| **Stock count / cycle counting** | 🔴 Inventory accuracy | High | No physical inventory count feature. Flow: scan parts → enter physical count → system calculates variance → creates adjustment movements. |
| **Returns / warranty tracking** | 🔴 Complete the return flow | Medium | `inventory_movement_type` includes `"return"` but no UI flow. Add "Return to Supplier" action from PO or part detail. |

### 5.2 Medium Impact (Efficiency & Intelligence)

| Gap | Impact | Effort | Notes |
|---|---|---|---|
| **Commonly paired services + parts** | 🟡 Cross-sell | Medium | When adding "Oil Change" as a service, suggest "oil filter" and "engine oil" as parts. Could use `service_parts_suggestions` mapping or embedding vector similarity (embedding field exists). |
| **Bulk import for parts** | 🟡 Onboarding speed | Medium | `customer-import-service.ts` exists but no equivalent for parts. Add CSV/Excel import. |
| **Multiple part images** | 🟡 Part identification | Low | Single `image_url`. Parts sometimes need multiple angles or diagrams. |
| **Automated reorder suggestions** | 🟡 Stock management | Medium | Combine `stock_thresholds`, recent usage rate, and supplier lead time into "Suggested Reorders" view. |
| **Service-to-part mapping** | 🟡 Efficiency | Medium | No table linking which parts are commonly used with which services. Would enable auto-suggestion when adding services to work orders. |
| **Supplier-to-part mapping** | 🟡 Purchasing | Low | No direct mapping. Can only discover "which suppliers supply Part X" through PO history. |
| **Bulk price update** | 🟡 Pricing maintenance | Low | No way to update prices across catalog in bulk (e.g., "increase all brake service prices by 10%"). |
| **Export services catalog** | 🟡 Reporting | Low | Parts tab has XLSX export but services page doesn't. |

### 5.3 Low Impact / Future

| Gap | Impact | Effort | Notes |
|---|---|---|---|
| **Expiry date tracking** | 🟢 | Low | Add `expiry_date` to `parts_catalog` for parts that degrade (gaskets, adhesives, chemicals). |
| **Parts warranty tracking** | 🟢 | Low | Track warranty period per part (e.g., "12 months from purchase"). |
| **Print labels / shelf tags** | 🟢 | Low | Print barcode labels for shelf organization. |
| **Multi-unit support** | 🟢 | High | Sell in boxes, stock in individual units. `unit` is text — no conversion logic. |
| **Cost center allocation** | 🟢 | High | Track which department/bay consumed which parts. |
| **Supplier performance tracking** | 🟢 | Medium | On-time delivery rate, defective rate, average lead time. |

### 5.4 Code-Level Issues

| Issue | Severity | Fix |
|---|---|---|
| `inventory_movements` has no `reference_id` | Medium | Can't trace a movement back to its source PO or work order. Add `reference_id` + `reference_type` columns. |
| `service_catalog` has no cost field | High | Can track revenue per service but not margin. Add `default_cost`. |
| `getPart` doesn't filter by `organization_id` | Medium | Relies on RLS alone (`inventory-service.ts:121`). Fragile — if RLS misconfigures, data leaks. |
| No supplier-to-part mapping | Low | Can't efficiently query "what parts does Supplier Y carry" without scanning PO history. |

---

## 6. Option Evaluation

### Option A: Build — Enhance Existing CRUD
**What:** Fill the high-impact gaps on top of the existing `service_catalog` + `parts_catalog` + `inventory_*` tables.
**Pros:** Data model is solid, most infrastructure exists, low risk.
**Cons:** Incremental — no new capabilities, just completing what's started.
**Verdict:** **RECOMMENDED** — this is the right move. The foundation is strong; the gaps are specific and solvable.

### Option B: Adopt — Use a Ready-Made Component Library
**What:** Import pre-built inventory/product management components from a library.
**Pros:** Faster for common patterns.
**Cons:** Tolom's domain model (disassembly cars, vehicle model pricing, Mongolian localization) is too custom. Components won't fit.
**Verdict:** Not viable for this domain.

### Option C: Buy — Integrate a Third-Party POS/Inventory System
**What:** Plug in a third-party inventory management API.
**Pros:** Feature-complete out of the box.
**Cons:** Data sovereignty issues (Mongolian regulations), cost, vendor lock-in, no vehicle-model pricing equivalent, no parts-car tracking.
**Verdict:** Not recommended — Tolom's differentiators are too specific.

### Option D: Spike — AI-Powered Part Suggestions
**What:** Use the existing `embedding` field on `parts_catalog` + `global_parts_catalog` to build vector-similarity part suggestions.
**Pros:** Leverages existing infrastructure, unique differentiator.
**Cons:** Requires embedding generation, similarity search, and UI. Medium effort.
**Verdict:** Worth pursuing as a Phase 2 after high-impact gaps are filled.

### Option E: Reduce — Focus on Quick Wins Only
**What:** Only do the 3 items from `gaps.md` recommended build order (barcode, quick stock in, vehicle fitment UI).
**Pros:** Fastest time to value.
**Cons:** Leaves the biggest gap (service cost/margin tracking) unfilled.
**Verdict:** Partially — start with these, but also include service cost tracking.

---

## 7. Recommended Build Order

### Phase 1 — Quick Wins (1-2 days each)
1. **Add `default_cost` to `service_catalog`** — Migration + UI. Enables margin tracking everywhere.
2. **Part-to-vehicle fitment on detail page** — Data exists in `vehicle_model_parts`, just needs UI section on `/inventory/parts/[partId]`.
3. **Quick Stock In** — Add "Stock In" button on parts list + part detail. Creates an `adjustment` movement directly.

### Phase 2 — Daily Workflow (2-3 days each)
4. **Barcode scanning** — Add `barcode` to `parts_catalog`. Scan input on: part creation, PO receive, work order part lookup.
5. **Supplier price history per part** — New tab/section on part detail showing purchase history from `purchase_order_items`.
6. **Returns/warranty flow** — "Return to Supplier" action from PO or part detail.

### Phase 3 — Intelligence (3-5 days)
7. **Commonly paired services + parts** — Add `service_parts_suggestions` table. When adding "Oil Change" service, auto-suggest related parts.
8. **Automated reorder suggestions** — Compute from `stock_thresholds` + usage rate + lead time.

### Phase 4 — Scale
9. **Stock count / cycle counting** — Full physical inventory count workflow.
10. **Bulk import** — CSV/Excel for both parts and services.

---

## 8. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Extend existing tables vs. new tables | Extend | `service_catalog` and `parts_catalog` have the right shape. Adding columns is lower risk than new tables. |
| Service cost tracking | Add `default_cost` column | Simple, backwards-compatible, enables margin calculations in reports. |
| Barcode on parts_catalog vs. catalog_item_variants | Add to `parts_catalog` directly | `catalog_item_variants` is for catalog-of-catalogs. Local parts need their own barcode. |
| Reference ID on movements | Add `reference_id` + `reference_type` | Enables traceability without breaking existing queries. Polymorphic FK pattern. |

---

## 9. What NOT to Build

- **Multi-unit conversion** — Too complex for the value. Mongolian garages use single units (pieces, sets, liters). Add later if requested.
- **Cost center allocation** — Only relevant for large multi-bay operations. Current bay-level tracking is sufficient.
- **Expiry date tracking** — Low demand. Most auto parts don't expire in a way that matters for a garage.
- **Print labels** — Niche. Garages use part numbers, not barcodes for shelf organization.
