# TOLOM — Project Status Tracker

> Last updated: 2026-05-14
> Source of truth: MASTER_PLAN.md
> This file tracks what's built, what's missing, and current work in progress.

---

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Complete |
| ⚠️ | Partial / needs polish |
| 🔄 | In progress |
| ❌ | Not started |
| 🚫 | Deliberately deferred |

---

## Phase 0 — Foundation (✅ Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Supabase project setup | ✅ | |
| Next.js app setup | ✅ | |
| Auth (Supabase Auth) | ✅ | |
| Organizations | ✅ | |
| Branches | ✅ | Main Branch auto-created |
| Users / Profiles | ✅ | |
| Roles (Admin, Mechanic) | ✅ | System roles |
| Permissions | ✅ | role_permissions junction |
| RLS policies | ✅ | All tables |
| Audit logs | ✅ | Immutable append-only |
| File storage buckets | ✅ | Supabase Storage |
| Basic dashboard shell | ✅ | |
| Error logging | ✅ | error.tsx + api-handler |
| Backup/export structure | ✅ | Export API |
| Subscription & billing | ✅ | Trial, grace, renew, expiry cron |

---

## Phase 1 — Tablet-First Startup CRM

### Database Schema (✅ Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Customers table | ✅ | |
| Vehicles table | ✅ | Plate, VIN, make/model, etc. |
| vehicle_owners junction | ✅ | |
| Service catalog | ✅ | |
| Work orders | ✅ | With status ledger |
| Work order services | ✅ | Line items |
| Work order parts | ✅ | Manual entry |
| Status history ledger | ✅ | Immutable |
| Service price history | ✅ | Price memory |
| Part price history | ✅ | Price memory |
| Mechanic assignments | ✅ | |
| Work order notes | ✅ | |
| Mechanic daily reports | ✅ | |

### Frontend & UX (⚠️ Partial)

| Feature | Status | Notes |
|---------|--------|-------|
| Customer records (list/new/[id]) | ✅ | |
| Vehicle records (list/new/[id]) | ✅ | |
| Plate-number search | ✅ | Index + query exist |
| Work order creation | ✅ | |
| Work order status flow | ✅ | |
| Mechanic assignment | ✅ | |
| Add services to WO | ✅ | |
| Add parts to WO | ✅ | |
| Service catalog page | ✅ | |
| Basic dashboard | ✅ | KPI cards, charts |
| Mechanic reports | ✅ | Daily/weekly/monthly |
| End-of-day summary | ✅ | Mechanic page |
| Daily timeline panel | ✅ | `_daily-timeline.tsx` |
| Service history | ✅ | Per vehicle |
| **Tablet-first UI (touch targets, large buttons)** | 🔄 | **Wave 1A** |
| **Auto-fill customer/vehicle from prior visits** | 🔄 | **Wave 1A** |
| **Last-sold price column on WO entry** | 🔄 | **Wave 1A** |
| **Smart defaults from price history** | 🔄 | **Wave 1A** |

---

## Phase 2 — Inventory + Staff Control

### Database Schema (✅ Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Parts catalog | ✅ | |
| Vehicle models | ✅ | |
| vehicle_model_parts | ✅ | Vehicle-specific pricing |
| Inventory movements (ledger) | ✅ | |
| Suppliers | ✅ | |
| Purchase orders | ✅ | |
| Purchase order items | ✅ | |
| Stock thresholds | ✅ | Low-stock alerts |
| Payments table | ✅ | cash/card/internet_bank |

### Frontend & UX (⚠️ Partial)

| Feature | Status | Notes |
|---------|--------|-------|
| Parts catalog page | ✅ | |
| Vehicle models page | ✅ | |
| Inventory list page | ✅ | |
| **Purchase Orders CRUD (list/new/[id])** | 🔄 | **Wave 1B** |
| **Suppliers CRUD (list/new/[id])** | 🔄 | **Wave 1B** |
| **Stock Movement UI (in/out/adjustment)** | 🔄 | **Wave 1B** |
| **Low Stock Alerts display** | 🔄 | **Wave 1B** |
| **Inventory Valuation page** | 🔄 | **Wave 1B** |
| Mechanic commission rules | ❌ | Schema + UI needed |
| Labor tracking | ❌ | |
| Parts used per mechanic | ❌ | |
| **Profit per work order** | 🔄 | **Wave 1C** |
| **Revenue by service category** | 🔄 | **Wave 1C** |
| **Mechanic performance dashboard** | 🔄 | **Wave 1C** |

---

## Phase 3 — Payments + Reminders + Reports

| Feature | Status | Notes |
|---------|--------|-------|
| Finance page (payment list) | ⚠️ | Basic list exists |
| Revenue dashboard | ✅ | Dashboard page |
| Daily closing report | ✅ | Mechanic page |
| Export to Excel | ✅ | Export API |
| Invoice share (public token) | ⚠️ | RPC exists, needs UI |
| **QPay integration** | ❌ | Wave 2D |
| **Payment confirmation in WO flow** | ❌ | Wave 2D |
| **Cash register session** | ❌ | Wave 2D |
| **SMS reminder module** | ❌ | Wave 2E |
| **Service interval reminders** | ❌ | Wave 2E |
| **Customer follow-up schedule** | ❌ | Wave 2E |
| **Reminder templates** | ❌ | Wave 2E |
| Inventory valuation | ❌ | |
| Profit reports | ❌ | |

---

## Phase 4 — Multi-Branch + Accounting Layer

| Feature | Status | Notes |
|---------|--------|-------|
| **Multi-branch dashboard** | ❌ | Wave 3F |
| **Branch-level permissions** | ❌ | Wave 3F |
| **Branch inventory** | ❌ | Wave 3F |
| **Stock transfer between branches** | ❌ | Wave 3F |
| **Multi-branch reports** | ❌ | Wave 3F |
| Approval workflows | ❌ | |
| Expense tracking | ❌ | |
| Accounting export | ❌ | |
| Payroll/commission export | ❌ | |

---

## Phase 5 — Mechanic Mobile App

| Feature | Status | Notes |
|---------|--------|-------|
| Flutter mechanic app | ❌ | Deferred |
| Offline support | ❌ | Deferred |

---

## Phase 6 — Platform Expansion

| Feature | Status | Notes |
|---------|--------|-------|
| Parts marketplace | ❌ | |
| Fleet management | ❌ | |
| AI estimate assistant | ❌ | |
| API access | ❌ | |
| Predictive maintenance | ❌ | |
| BI / analytics | ❌ | |

---

## Current Work — Wave 1 (In Progress)

| Group | Scope | Agent | Status |
|-------|-------|-------|--------|
| **1A** | Tablet-first UX, auto-fill, price memory, smart defaults | visual-engineering | 🔄 |
| **1B** | Purchase Orders, Suppliers, Stock Movements, Low Stock, Inventory Valuation | deep | 🔄 |
| **1C** | Profit per WO, Revenue by category, Mechanic perf, Parts used, Commissions | ultrabrain | 🔄 |

### Wave 2 (Queued)

| Group | Scope | Priority |
|-------|-------|----------|
| **2D** | QPay integration + payment flow | medium |
| **2E** | SMS reminders + customer retention | medium |

### Wave 3 (Queued)

| Group | Scope | Priority |
|-------|-------|----------|
| **3F** | Multi-branch operations | medium |
