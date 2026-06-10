# TOLOM — Feature Production Readiness Report

> Generated: 2026-06-01 · Based on full codebase audit (86 migrations, 223 tests, 67 tables)

## Overall Assessment

**TOLOM is remarkably advanced** — well beyond where the MASTER_PLAN suggests. It has ~80% of Phase 1-3 features fully implemented with production-quality code. The core (multi-tenant, RLS, auth) is solid. The main gaps are in integration endpoints and the later phases.

---

## Phase 0 — Foundation (✅ 100% Production-Ready)

| Feature | Status | Notes |
|---------|--------|-------|
| Supabase + Next.js setup | ✅ LIVE | 86 migrations, clean build |
| Multi-tenant auth | ✅ LIVE | Supabase SSR with cookies |
| Organizations | ✅ LIVE | Full CRUD with settings |
| Branches | ✅ LIVE | CRUD + permissions |
| Users / Profiles | ✅ LIVE | Profiles, org_users, invites |
| Roles & Permissions | ✅ LIVE | Granular RBAC, seeded roles/perms |
| RLS on all tables | ✅ LIVE | All 67 tables have RLS + policies |
| Audit logs | ✅ LIVE | Append-only immutable ledger |
| Storage buckets | ✅ LIVE | Org logos, attachments |
| Subscriptions | ✅ LIVE | Plans (starter/pro/business/enterprise), trials, expiry cron, enforcement |
| Error logging (Sentry) | ✅ LIVE | @sentry/nextjs configured |

---

## Phase 1 — Tablet-First Startup CRM (✅ ~95% Production-Ready)

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard | ✅ LIVE | Real KPI aggregation, chart section, period bar, daily timeline, low stock card, recent work orders table, realtime multi-table subscription, export, trend arrows |
| Customer CRM | ✅ LIVE | Full CRUD, search, shared customers, inactive detection (3+ months), import (CSV/XLSX), export, notes, communications |
| Vehicle records | ✅ LIVE | Full fields: plate, VIN/chassis, make/model/year, engine, trans, fuel, odometer, color, photos via attachments. Plate number normalization. Trgm-indexed search |
| Plate-number search | ✅ LIVE | pg_trgm enabled, fuzzy search |
| Duplicate detection | ✅ LIVE | Via search and import validation |
| Work order creation | ✅ LIVE | Multi-step wizard (customer → vehicle → complaint → services → parts → mechanic → summary) |
| Work order status mgmt | ✅ LIVE | New → Diagnosing → In Progress → Ready for Pickup → Completed / Cancelled. Full status history ledger |
| Mechanic assignment | ✅ LIVE | Per work order, with workload view in bay view |
| Service catalog | ✅ LIVE | Full CRUD, inline editing, categories, service interval columns, fuzzy search, export |
| Service pricing memory | ✅ LIVE | `service_price_history` — price tracking per service per vehicle make/model context |
| Part pricing memory | ✅ LIVE | `part_price_history` — last sold price tracking |
| Service history | ✅ LIVE | Per-vehicle history from completed work orders |
| Daily/Weekly/Monthly reports | ✅ LIVE | Per-mechanic reports, period selectors |
| Bay View (kanban) | ✅ LIVE | Drag-and-drop work order board, mechanic panels, status pills, work order detail drawer, shift report dialog, vehicle/mechanic registration, PIN settings |
| End-of-day close | ✅ LIVE | Payment breakdown, best mechanic, biggest issue, streak tracking, print support, low stock card |
| Touch-friendly UX | ✅ LIVE | Large touch targets, responsive mobile cards, tablet-first layout |
| Admin + Mechanic roles | ✅ LIVE | RBAC enforced on all API routes |

**Minor gaps**: Vehicle photos (`vehicle_photos` table missing but attachments work), vehicle documents table (`vehicle_documents` missing; functional via attachments)

---

## Phase 2 — Inventory + Staff Control (✅ ~90% Production-Ready)

| Feature | Status | Notes |
|---------|--------|-------|
| Parts catalog | ✅ LIVE | Full CRUD, categories as text, global catalog integration (global_parts_catalog), vehicle model mapping |
| Inventory movement ledger | ✅ LIVE | Immutable ledger: purchase, sale, adjustment, transfer_in, transfer_out, return, waste, disassembly |
| Stock in/out | ✅ LIVE | Via movements ledger |
| Low stock alerts | ✅ LIVE | Stock thresholds with severity, alerts page, dashboard card |
| Supplier records | ✅ LIVE | Full CRUD |
| Purchase orders | ✅ LIVE | Full CRUD + items |
| Stock adjustments | ✅ LIVE | Via `adjustment` movement type |
| Mechanic performance | ✅ LIVE | Cross-mechanic comparison, leaderboard, period selector, revenue/commission data |
| Mechanic commission rules | ✅ LIVE | Configurable commission rates per mechanic/service type |
| Parts used per mechanic | ✅ LIVE | Via work order → mechanic assignment |
| Profit per work order | ✅ LIVE | Calculated with cost/revenue breakdown |
| Parts-cars (disassembly) | ✅ LIVE | **Beyond plan** — catalog of parts from disassembled vehicles |

**Minor gaps**: `part_categories` dedicated table (stored as text column), `stock_adjustments` dedicated table (via movements instead — arguably better), `mechanic_period_reports` table (calculated on-the-fly)

---

## Phase 3 — Payments + Reminders + Reports (✅ ~75% Production-Ready)

| Feature | Status | Notes |
|---------|--------|-------|
| Payment recording | ✅ LIVE | Payment tracking with payment methods (cash/card/transfer), invoice_payments |
| Invoice management | ✅ LIVE | Full invoices with items, PDF generation, public invoice view (by token), email sending (via Resend) |
| Invoice payments | ✅ LIVE | Payment splitting, partial payments |
| Service interval reminders | ✅ LIVE | `vehicle_service_schedules` table, per-vehicle config, auto-sync from completed work orders |
| Reminder audit trail | ✅ LIVE | `reminder_logs` — created by cron edge function |
| Auto-sync from WO complete | ✅ LIVE | Services auto-created in schedules when WO completed |
| Service catalog intervals | ✅ LIVE | interval_months, interval_km columns |
| Backfill from history | ✅ LIVE | "Sync from history" button |
| Revenue dashboard | ✅ LIVE | Dashboard with KPIs, charts, trends |
| Daily closing report | ✅ LIVE | End-of-day close page |
| Expense management | ✅ LIVE | **Beyond plan** — full expense CRUD with categories, vendors, recurring, stats |
| Customer portal | ✅ LIVE | **Beyond plan** — customers can view vehicles, work orders, invoices |
| Day close logs | ✅ LIVE | **Beyond plan** — streak tracking, best performer |
| Diagnosis labels | ✅ LIVE | **Beyond plan** — customizable labels for work order diagnosis |
| Service recommendations | ✅ LIVE | **Beyond plan** — post-service recommendations |
| Price rules engine | ✅ LIVE | **Beyond plan** — configurable pricing rules |
| Telegram notifications | ✅ LIVE | **Beyond plan** — owner Telegram notifications (daily/weekly/monthly), customer Telegram link |
| Reports (ERP-grade) | ✅ LIVE | **Beyond plan** — 10+ chart types: daily revenue, mechanic bar, service breakdown, forecast, targets, retention, P&L, insight alerts, mechanic table |
| Estimates / Quotes | ✅ LIVE | Full CRUD with line items (services/parts/custom), status workflow (draft→sent→approved→converted), convert-to-work-order. Gated to Pro+ plans |

**⚠️ Partial — Needs Work:**
| Feature | Status | Notes |
|---------|--------|-------|
| SMS/Email *sending* integration | 🟡 ENGINE READY | Service reminders create logs via cron, but actual SMS/email sending integration is pending (`reminder_logs` filled, Send/SMS step unwired). The add-on pricing assumes a working SMS channel |
| Customer follow-ups | 🔴 MISSING | No `customer_followups` table or scheduled follow-up flow |
| Refunds | 🔴 MISSING | No refund workflow or `refunds` table |
| Tax rules | 🔴 MISSING | No `tax_rules` table or tax calculation engine |

---

## Phase 4 — Multi-Branch + Accounting (🟡 ~40% Production-Ready)

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-branch schema | ✅ LIVE | `branches`, `branch_user_permissions`, stock transfers exist |
| Branch-level permissions | ✅ LIVE | `branch_user_permissions` table |
| Branch inventory | ✅ LIVE | Stock transfers implemented |
| Stock transfer | ✅ LIVE | `stock_transfers` + `stock_transfer_items` |

**🔴 Missing:**
| Feature | Notes |
|---------|-------|
| Multi-branch dashboard UI | Branch selector exists but consolidated dashboard thin |
| Multi-branch reports | Not built |
| Approval workflows | Not built |
| Accounting export | Not built |
| Payroll / commission export | Not built |
| Manager discount approval | Not built |
| Expense tracking (multi-branch) | Basic, but not branch-gated |

---

## Phase 5 — Mechanic Mobile App (🔴 Not Started)

| Feature | Status |
|---------|--------|
| Flutter mechanic login | ❌ |
| Assigned jobs view | ❌ |
| Job details / notes / photos | ❌ |
| Status updates | ❌ |
| Parts used tracking | ❌ |
| Time spent | ❌ |
| Offline drafts | ❌ |
| Sync queue | ❌ |

---

## Phase 6 — Platform Expansion (🔴 Not Started)

| Feature | Status |
|---------|--------|
| Fleet management | ❌ |
| Parts marketplace | ❌ |
| Customer self-service (portal) | ✅ Done (Phase 3 overlap) |
| AI estimate assistant | ❌ |
| API access / webhooks | ❌ (no api_keys or integration_accounts) |
| Insurance workflow | ❌ |
| Third-party integrations | ❌ |

---

## Code Health Summary

### Build & TypeScript
| Metric | Status |
|--------|--------|
| `npm run build` | ✅ PASSES (29.8s, 23 static pages + ~100 API routes) |
| `npx tsc --noEmit` | ✅ CLEAN — 0 errors |
| `npm run lint` (source) | ⚠️ 77 errors (mostly formatting), 175 warnings |
| `npm run lint` (e2e) | ⚠️ 10 errors (import ordering) |

### Tests
| Metric | Value |
|--------|-------|
| Unit/Integration tests | 223 tests, 222 ✅ pass, **1 ❌ fails** |
| Test files | 16 (9 service, 4 component, 2 store, 1 utility) |
| E2E test files | 9 Playwright specs (auth, login, registration, home, navigation, customers, vehicles, password-reset, i18n) |
| Coverage thresholds | Statements 40%, Branches 30%, Functions 50%, Lines 40% |
| **1 failing test** | `customer-service.test.ts > createCustomer > rejects duplicate phone numbers` — mock chain returns undefined instead of `{ data, error }` |

### Database
| Metric | Value |
|--------|-------|
| Migrations | 86 total |
| Tables | 67 total in public schema |
| RLS enabled | ✅ On ALL 67 tables with policies |
| Edge functions | 4 (check-service-reminders, expire-subscriptions, telegram-webhook, telegram-notify-owners) |
| Type safety | `src/lib/database.types.ts` covers all 67 tables + 29 RPCs + 5 enums. `src/lib/types/core.ts` exports 54 convenience aliases |

---

## Key Risks & Blockers Before Production Launch

### High Priority

1. **❌ SMS/Email sending integration is unwired** — `reminder_logs` are created by cron but the actual Send step is incomplete. Without this, the SMS add-on (₮80k–₮200k/month pricing) cannot be sold
2. **⚠️ 1 failing test** — customer-service duplicate phone rejection is broken. This is a schema/validation gap that could cause data integrity issues
3. **⚠️ No API keys/webhook infrastructure** — No integration accounts, API keys table, or webhook events. Zero external integrations possible without this
4. **⚠️ No cash register session tracking** — Day-end close works but without cash session management for branch-level accountability

### Medium Priority

5. **⚠️ No refund workflow** — If a payment is recorded, there's no formal refund path (just `cancelled` status)
6. **⚠️ 77 source lint errors** — Mostly formatting but ~10 genuine (unused imports, a11y, strict equality)
7. **⚠️ Some types hand-declared** — `composite.ts`, `inventory.ts`, `expense.ts` use static interfaces instead of `Tables<>` generics, can drift on regeneration
8. **⚠️ Large report service** — `report-service.ts` at ~3177 lines would benefit from decomposition
9. **⚠️ No test coverage for most UI components** — Only 4 component test files vs 170+ components

### Low Priority

10. **⏳ `vehicle_photos` / `vehicle_documents` tables missing** — Workaround: attachments work via `work_order_attachments`
11. **⏳ No CI/CD visible** — No GitHub Actions config found in codebase
12. **⏳ Coverage thresholds are low** (40-50%) — Acceptable for v0.1 but should improve

---

## Features Beyond the Original MASTER_PLAN Scope

These are already built but not explicitly called out in the plan:

- **Customer portal** — Full portal for customers (vehicles, work orders, invoices)
- **Expense management** — Full expense CRUD with categories, vendors, payment methods, recurring
- **Parts-cars disassembly** — Catalog parts from vehicle disassembly (recycling yard workflow)
- **Global reference catalogs** — `car_brands`, `car_models`, `global_parts_catalog`, `global_services_catalog` with seeding
- **Mechanic time tracking** — Clock in/out with `mechanic_time_logs`
- **Diagnosis labels** — Customizable diagnosis labeling system for work orders
- **Telegram integration** — WhatsApp-level notification via Telegram (not in original plan at all)
- **Price rules engine** — Configurable pricing rules beyond basic pricing memory
- **Service recommendations** — Auto-generated recommendations from completed services
- **Day close logs with streaks** — Gamified end-of-day tracking
- **Commission rules engine** — Configurable mechanic commission rules
- **Loss reason tracking** — Required reason when work order profit is negative

---

## Production Launch Checklist

### Must-Fix Before Launch
- [ ] Fix failing test: customer-service duplicate phone mock chain (`customer-service.test.ts`)
- [ ] Wire SMS/email sending integration for service reminders (or remove from pricing)
- [ ] Add API keys / integration accounts infrastructure if third-party integrations are needed at launch

### Should-Fix Before Launch
- [ ] Address ~10 genuine lint errors (unused imports, a11y, non-null assertions)
- [ ] Run `npx shadcn@latest fix` to ensure shadcn component safety
- [ ] Add auth rate-limit integration tests
- [ ] Audit all hand-declared types against current `database.types.ts`
- [ ] Run `npx react-doctor` for React-specific diagnostics

### Nice-to-Have Before Launch
- [ ] Add CI/CD pipeline (GitHub Actions for lint + test + build)
- [ ] Increase test coverage for critical flows (work order lifecycle, inventory movements, RLS isolation)
- [ ] Add RSET-driven API type exports to prevent schema drift
- [ ] Decompose `report-service.ts` (3177 lines → 3-4 files)
