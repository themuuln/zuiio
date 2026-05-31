Master Plan: Auto Repair ERP / Garage OS called TOLOM

Development Plan + Pricing Plan Only

> **Phase Status Summary** — *Last updated: 2026-06-01*
> | Phase | Status |
> |-------|--------|
> | Phase 0 — Foundation | ✅ 100% LIVE |
> | Phase 1 — Tablet CRM | ✅ ~95% LIVE |
> | Phase 2 — Inventory + Staff | ✅ ~90% LIVE |
> | Phase 3 — Payments + Reminders + Reports | 🟡 ~75% LIVE |
> | Phase 4 — Multi-Branch + Accounting | 🟡 ~40% LIVE |
> | Phase 5 — Mechanic Mobile App | 🔴 NOT STARTED |
> | Phase 6 — Platform Expansion | 🟡 ~15% LIVE |
> | **Built beyond plan** | Expense mgmt, Customer portal, Telegram, Price rules, Parts-cars, Diagnosis labels, Time tracking, Global catalog, Day-close streaks |

⎸

## Хөгжүүлэлтийн Замын Зураг (Монгол)

> Дараах хүснэгтэд TOLOM системийн бүх үе шат, тухайн үе шатанд хийгдсэн / хийгдээгүй боломжуудыг харуулав.

### 🟢 Үе 0 — Суурь (✅ 100%)

| Боломж | Төлөв |
|--------|-------|
| Мульти-tenant бүртгэл (org, branch, user) | ✅ Ажиллаж байна |
| Эрх, үүргийн систем (RBAC) | ✅ Ажиллаж байна |
| Нэвтрэх систем (Supabase SSR) | ✅ Ажиллаж байна |
| Мэдээллийн аюулгүй байдал (RLS) | ✅ Ажиллаж байна |
| Аудитын бүртгэл (audit_logs) | ✅ Ажиллаж байна |
| Захиалгын систем (төлөвлөгөө, туршилт, сунгалт) | ✅ Ажиллаж байна |
| Org бренд/theme тохируулга | ✅ Ажиллаж байна |
| Sentry алдаа бүртгэл | ✅ Ажиллаж байна |

---

### 🟢 Үе 1 — Планшет CRM (✅ ~95%)

| Боломж | Төлөв |
|--------|-------|
| Хэрэглэгчийн бүртгэл (import/export, shared, тэмдэглэл) | ✅ Ажиллаж байна |
| Тээврийн хэрэгслийн бүртгэл (VIN/smartcar хайлт) | ✅ Ажиллаж байна |
| Улсын дугаараар хурдан хайх | ✅ Ажиллаж байна |
| Захиалга үүсгэх (wizard) | ✅ Ажиллаж байна |
| Захиалгын төлөв (төлөв ледгэр) | ✅ Ажиллаж байна |
| Механик хуваарилалт | ✅ Ажиллаж байна |
| Үйлчилгээний каталог (үнэ, ангилал, хайлт) | ✅ Ажиллаж байна |
| Үний санах ой (үйлчилгээ, сэлбэгийн түүх) | ✅ Ажиллаж байна |
| Хөнгөлөлт (төгрөгөөр, хувиар) | ✅ Ажиллаж байна |
| Bay View (drag-and-drop kanban самбар) | ✅ Ажиллаж байна |
| Механикийн тайлан (өдөр/долоо/сар) | ✅ Ажиллаж байна |
| Өдөр хаах (EOD close — streak tracking) | ✅ Ажиллаж байна |
| Dashboard (KPI, график, экспорт) | ✅ Ажиллаж байна |
| 📅 Цаг товлох | 🔴 Хийгдээгүй |

---

### 🟢 Үе 2 — Бараа Material + Ажилтны Хяналт (✅ ~90%)

| Боломж | Төлөв |
|--------|-------|
| Сэлбэгийн каталог (дэлхийн каталогтой интеграци) | ✅ Ажиллаж байна |
| Барааны хөдөлгөөний дэвтэр (inventory_movements — immutable ledger) | ✅ Ажиллаж байна |
| Нийлүүлэгчдийн бүртгэл | ✅ Ажиллаж байна |
| Худалдан авах захиалга (purchase orders) | ✅ Ажиллаж байна |
| Нөөц дууссан/дутагдалтай анхааруулга | ✅ Ажиллаж байна |
| Механикийн гүйцэтгэлийн үнэлгээ (leaderboard, комисс) | ✅ Ажиллаж байна |
| Ажлын цагийн бүртгэл (clock in/out) | ✅ Ажиллаж байна |
| Ашиг/алдагдал захиалга бүрээр | ✅ Ажиллаж байна |
| Тээврийн хэрэгсэл задлах (parts-cars disassembly) | ✅ Ажиллаж байна (төлөвлөгөөнөөс гадуур) |

---

### 🟡 Үе 3 — Төлбөр + Сануулга + Тайлан (✅ ~75%)

| Боломж | Төлөв |
|--------|-------|
| Төлбөрийн баталгаажуулалт (бэлэн, карт, шилжүүлэг) | ✅ Ажиллаж байна |
| Нэхэмжлэх (invoice, PDF, public view, email) | ✅ Ажиллаж байна |
| Үйлчилгээний сануулга (vehicle_service_schedules + cron) | ✅ Ажиллаж байна |
| Авто-синк: захиалга дууссан → сануулга шинэчлэгдэх | ✅ Ажиллаж байна |
| Түүхээс сануулга үүсгэх (Sync from History) | ✅ Ажиллаж байна |
| Харилцагчийн мэдэгдэл (Telegram/бот) | 🟡 Telegram бэлэн, WhatsApp/Facebook бот хийгдээгүй |
| Орлогын тайлан (revenue dashboard) | ✅ Ажиллаж байна |
| Ашгийн тайлан (P&L) | ✅ Ажиллаж байна |
| Өдөр хаах тайлан (EOD close) | ✅ Ажиллаж байна |
| Зарлагын бүртгэл (expense management) | ✅ Ажиллаж байна (төлөвлөгөөнөөс гадуур) |
| Хэрэглэгчийн портал (customer portal) | ✅ Ажиллаж байна (төлөвлөгөөнөөс гадуур) |
| Telegram мэдэгдэл | ✅ Ажиллаж байна (төлөвлөгөөнөөс гадуур) |
| Тооцоо/Quote | 🔴 Хийгдээгүй |
| Хэрэглэгчийн дараах холбоо барих (follow-up) | 🔴 Хийгдээгүй |
| Буцаан төлбөр (refund) | 🔴 Хийгдээгүй |
| Татварын тооцоо (tax rules) | 🔴 Хийгдээгүй |
| Кассын бүртгэл (cash register session) | 🔴 Хийгдээгүй |

---

### 🟡 Үе 4 — Олон Салбар + Нягтлан (✅ ~40%)

| Боломж | Төлөв |
|--------|-------|
| Салбарын түвшний эрх (branch_user_permissions) | ✅ Ажиллаж байна |
| Салбар хооронд бараа шилжүүлэх (stock transfer) | ✅ Ажиллаж байна |
| Нэгдсэн хэрэглэгчийн сан (shared customers) | ✅ Ажиллаж байна |
| Олон салбарын dashboard | 🔴 Хийгдээгүй |
| Олон салбарын тайлан | 🔴 Хийгдээгүй |
| Нягтлан бодох экспорт | 🔴 Хийгдээгүй |
| Баталгаажуулалтын workflow (approval) | 🔴 Хийгдээгүй |
| Цалингийн экспорт | 🔴 Хийгдээгүй |

---

### 🔴 Үе 5 — Механик Мобайл Апп (✅ 0% — Эхлээгүй)

| Боломж | Төлөв |
|--------|-------|
| Механик нэвтрэх | 🔴 |
| Даалгавар харах | 🔴 |
| Тэмдэглэл, зураг нэмэх | 🔴 |
| Төлөв шинэчлэх | 🔴 |
| Сэлбэг нэмэх | 🔴 |
| Цаг бүртгэх | 🔴 |
| Офлайн ажиллагаа | 🔴 |

> Түр хугацаанд: /dashboard/mechanic хуудас PWA-р ажиллаж байна (clock in/out, захиалга харах, төлөв шинэчлэх)

---

### 🔴 Үе 6 — Платформ Өргөтгөл (✅ ~15%)

| Боломж | Төлөв |
|--------|-------|
| Хэрэглэгчийн портал | ✅ Ажиллаж байна (төлөвлөгөөнөөс түрүүлж хийгдсэн) |
| RBAC эрхийн систем | ✅ Ажиллаж байна |
| Аудитын бүртгэл | ✅ Ажиллаж байна |
| Fleet/парк удирдлага | 🔴 Хийгдээгүй |
| Сэлбэгийн зах зээл (marketplace) | 🔴 Хийгдээгүй |
| API / webhook | 🔴 Хийгдээгүй |
| AI үнэлгээ туслах | 🔴 Хийгдээгүй |
| Гуравдагч этгээдийн интеграци (нягтлан, WhatsApp, payment gateway) | 🔴 Хийгдээгүй |
| Даатгал, warranty workflow | 🔴 Хийгдээгүй |

---

### 📌 Төлөвлөгөөнөөс Гадуур Хийгдсэн (Built Beyond Plan)

Дараах боломжууд анхны төлөвлөгөөнд ороогүй боловч хийгдсэн:

- **Зарлагын бүртгэл** (expenses, expense_categories) — бүрэн CRUD
- **Хэрэглэгчийн портал** — хэрэглэгч өөрийн захиалга, нэхэмжлэх харах
- **Telegram мэдэгдэл** — өдөр/долоо/сар бүрийн тайлан Telegram-аар
- **Үний дүримийн Engine** (price_rules) — тохируулж болох үнэ тогтоох дүрэм
- **Тээврийн хэрэгсэл задлах (parts-cars)** — задласан машинаас сэлбэгийн каталог
- **Оношлогооны шошго (diagnosis_labels)** — тохируулж болох шошго
- **Механикийн цагийн бүртгэл** (mechanic_time_logs) — clock in/out
- **Дэлхийн каталог** (car_brands, car_models, global_parts, global_services)
- **Өдөр хаах streak** — өдөр бүр хаах үйлдлийн үргэлжлсэн тэмдэглэл
- **Үйлчилгээний зөвлөмж** (service_recommendations)
- **Алдагдлын шалтгаан** (loss_reason) — ашиггүй захиалгад шалтгаан заавал бөглөх

---

### 🔑 Дараагийн Алхамууд (Next Steps)

| Эрэмбэ | Юу хийх | Яагаад |
|--------|---------|--------|
| 1 | Telegram/WhatsApp chatbot мэдэгдлийн интеграци хийх | Сануулгын модуль бэлэн, гэхдээ Telegram бот зөвхөн эзэмшигчид мэдэгдэл явуулдаг. Харилцагчийн chatbot (WhatsApp/Facebook) хэрэгтэй |
| 2 | Тооцоо/Quote workflow нэмэх | Авто засварын бизнесийн гол процесс — захиалгын өмнөх үнийн санал |
| 3 | Олон салбарын dashboard + тайлан | Том засварын төвүүдэд шаардлагатай |
| 4 | API key, webhook infrastructure | Гуравдагч этгээдийн интеграци хийх боломжгүй |
| 5 | Буцаан төлбөр (refund), кассын бүртгэл | Санхүүгийн бүрэн бүтэн байдалд чухал |

The correct direction is not “garage CRM.” The scalable direction is:

A vertical operating system for auto service businesses
Work orders + vehicle history + inventory + payments + staff + reporting + integrations + later marketplace/data layers.

A unicorn outcome is not possible from Mongolia-only garage subscriptions. The product/pricing architecture must be designed so it can expand into regional SaaS, parts procurement, fleet maintenance, payments, AI estimates, and data/API layers later.

I’ll keep this strictly to development and pricing.

⸻

1. Core Product Strategy

Product Name Internally

Use a simple internal name:

TOLOM

External name can change later.

Product Category

Do not build it as a generic ERP.

Build it as:

Auto Repair Operating System

Go-to-market can start narrower:

Tablet-first auto service CRM for startup garages

This is not a different product.

It is the first sellable wedge of the same Garage OS:

- tablet-primary workflow
- car CRM with strong vehicle history
- fast service entry
- mechanic-focused reporting
- pricing memory for inconsistent real-world service and part prices

That means every feature should support one of these workflows:

1. Customer comes in.
2. Vehicle is identified.
3. Issue is recorded.
4. Work order is created.
5. Mechanic is assigned.
6. Parts/services are added.
7. Inventory changes.
8. Invoice is generated.
9. Payment is recorded.
10. Customer gets reminder.
11. Owner sees performance.

If a feature does not support that chain, delay it.

⸻

2. Recommended Stack

V1 Stack

Frontend: Next.js
Backend: Supabase
Database: PostgreSQL
Auth: Supabase Auth
Storage: Supabase Storage
Security: Supabase RLS
Hosting: Vercel
Primary device: Tablet web app / PWA
Mobile: PWA first
Flutter: V2 or V3

Supabase is still a strong fit because it gives you Postgres, Auth, Storage, Realtime, Edge Functions, and a managed platform. Current Supabase pricing starts with a free tier, with Pro shown at $25/month plus compute scaling options, so early infrastructure cost can stay low.  ￼

Vercel is suitable for the Next.js dashboard, but you should watch usage-based cost as the product scales. Vercel’s pricing page shows Hobby, Pro, and Enterprise plans, and Pro includes usage credit across resources.  ￼

Use Next.js server-side logic for sensitive operations. Next.js API routes are server-side bundles and do not increase the client-side bundle size.  ￼

Use Supabase Row Level Security from day one. Supabase’s own documentation says RLS should always be enabled on tables in exposed schemas, especially when browser clients access the database.  ￼

Use Flutter later only for offline-heavy mechanic workflows. Flutter’s official offline-first guidance says offline apps need local and remote data sources, with repositories acting as the single source of truth.  ￼

For price calculations below, I’ll use approximately $1 = ₮3,576, based on the Bank of Mongolia’s May 10, 2026 USD/MNT daily rate.  ￼

⸻

3. Development Philosophy

The Most Important Rule

Do not build a custom app for each garage.

Build:

One core product
+ settings
+ feature flags
+ add-ons
+ plan limits
+ integration modules

Bad path:

Garage A wants custom invoice.
Garage B wants custom inventory.
Garage C wants custom mechanic flow.
You hard-code everything.
You become an agency.

Correct path:

Invoice templates
Configurable service categories
Configurable workflow statuses
Role permissions
Branch settings
Optional add-ons

This is what makes it scalable.

Startup Execution Mode Right Now

For the first version, package the system as a startup-friendly tablet product without breaking the long-term architecture.

That means:

- keep the same multi-tenant foundation
- keep the same RLS rules
- keep the same ledger mindset
- simplify the first sellable workflow to admin + mechanic
- optimize the first UI for tablet usage at the front desk and in the garage
- prioritize car CRM, service pricing memory, and mechanic performance reports before wider ERP depth

⸻

4. Product Architecture

Core Architecture

Garage OS
│
├── Core Platform  ✅ ALL LIVE
│   ├── Organizations
│   ├── Branches
│   ├── Users / Profiles
│   ├── Roles
│   ├── Permissions (RBAC seeded)
│   ├── Audit logs (immutable ledger)
│   ├── Billing / Subscription plans
│   └── Org branding & theme system
│
├── Garage Operations  ✅ ALL LIVE
│   ├── Customers (full CRM with import/export, shared, notes)
│   ├── Vehicles (with VIN/smartcar lookup, plate normalization)
│   ├── Car CRM
│   ├── Appointments 🔴
│   ├── Work orders (wizard + detail + status ledger)
│   ├── Services catalog (with pricing memory)
│   ├── Mechanics (dashboard, time tracking, performance)
│   └── Service history (per-vehicle from completed WOs)
│
├── Startup Operating Layer  ✅ ALL LIVE
│   ├── Bay View (drag-and-drop kanban board)
│   ├── Service catalog with default pricing
│   ├── Service and part price memory (price_history tables)
│   ├── Mechanic selector + workload view
│   ├── Daily timeline panel
│   └── EOD closing summary (with streak tracking)
│
├── Inventory  ✅ ALL LIVE
│   ├── Parts catalog (with global catalog integration)
│   ├── Stock (immutable movement ledger)
│   ├── Suppliers
│   ├── Purchase orders
│   ├── Stock movements (purchase/sale/adjustment/transfer)
│   ├── Low-stock alerts (thresholds with severity)
│   └── Parts-cars disassembly 🆕
│
├── Finance  🟡 PARTIAL
│   ├── Estimates / Quotes 🔴
│   ├── Invoices ✅ (full management, PDF, public view)
│   ├── Payments ✅ (with split payments)
│   ├── Discounts ✅ (per-line and per-order)
│   ├── Taxes 🔴
│   ├── Revenue reports ✅
│   ├── Expense management ✅ 🆕
│   └── Refunds 🔴
│
├── Customer Retention  🟡 PARTIAL
│   ├── Service interval reminders ✅ (vehicle_service_schedules + cron + logs)
│   ├── Service due dates ✅
│   ├── Customer messaging (Telegram/chatbot) 🟡 (Telegram owner notifications done; customer chatbot unwired)
│   ├── Customer portal ✅ 🆕
│   ├── Telegram notifications ✅ 🆕
│   ├── Follow-ups 🔴
│   └── Customer return tracking ✅ (via reports: retention card)
│
├── Integrations  🟡 PARTIAL
│   ├── Telegram bot ✅ 🆕 (webhook + scheduled notifications)
│   ├── Resend (email) ✅ (invoices, communications)
│   ├── Smartcar (VIN lookup) ✅
│   ├── Messenger chatbot (WhatsApp/Facebook) 🔴
│   ├── Accounting export 🔴
│   ├── API keys / webhooks 🔴
│   └── Messenger (WhatsApp etc.) 🔴
│
└── Advanced Platform  🔴 NOT STARTED
    ├── Mobile mechanic app (Flutter)
    ├── Fleet management
    ├── Parts marketplace
    ├── AI estimate assistant
    ├── Predictive maintenance
    └── BI / analytics

⸻

5. Database Foundation

Every major table must support multi-tenancy.

Required Columns

id
organization_id
branch_id
created_by
updated_by
created_at
updated_at
deleted_at

Core Tables

organizations
branches
users
roles
permissions
organization_users
subscription_plans
feature_flags
audit_logs

Customer + Vehicle Tables

customers  ✅
vehicles  ✅
vehicle_owners  ✅
vehicle_service_history  ✅ (reconstructed from work_orders + service_schedules)
vehicle_service_schedules  ✅ 🆕
vehicle_photos  🔴 (workaround: work_order_attachments)
vehicle_documents  🔴 (workaround: work_order_attachments)

Vehicle Data Rules For The Startup CRM Layer

Must-have vehicle fields:

- plate_number (example: 9999 UNA)
- make / mark
- model
- year
- VIN / chassis number when available
- color
- engine
- fuel_type
- transmission
- odometer
- customer phone number

Good-to-have vehicle fields:

- trim / series (example: Lexus RX)
- drivetrain
- body type
- license expiry or inspection notes
- last visit date
- next recommended service date
- internal notes / tags

Work Order Tables

work_orders  ✅
work_order_services  ✅
work_order_parts  ✅
work_order_attachments  ✅ 🆕 (replaces work_order_photos)
work_order_notes  ✅
work_order_status_history  ✅ (immutable status ledger)
work_order_commissions  ✅ 🆕
mechanic_assignments  ✅
service_catalog  ✅
service_price_history  ✅
part_price_history  ✅
mechanic_daily_reports  ✅
mechanic_time_logs  ✅ 🆕
mechanic_period_reports  🟡 (generated on-the-fly)

Inventory Tables

parts_catalog  ✅ (named parts_catalog, not parts)
part_categories  🟡 (stored as text column on parts_catalog, no dedicated table)
suppliers  ✅
stock_thresholds  ✅ (replaces stock_locations)
inventory_balances  ✅ (materialized view)
inventory_movements  ✅ (immutable ledger)
purchase_orders  ✅
purchase_order_items  ✅
stock_adjustments  ✅ (via inventory_movements with adjustment type)
stock_transfers  ✅ 🆕 (multi-branch)
parts_cars  ✅ 🆕 (disassembly catalog)

Finance Tables

estimates  🔴
estimate_items  🔴
invoices  ✅
invoice_items  ✅
payments  ✅
invoice_payments  ✅ 🆕
refunds  🔴
discounts  🟡 (columns on work_orders / invoice_items, no dedicated table)
tax_rules  🔴
cash_register_sessions  🔴
day_close_logs  ✅ 🆕
expenses  ✅ 🆕
expense_categories  ✅ 🆕

Retention Tables  ✅ 3 of 7 LIVE

vehicle_service_schedules  ✅ — per-vehicle service interval tracking with auto-sync from completed work orders
reminder_logs              ✅ — audit trail for sent/pending reminders (populated by cron edge function)
reminders              🔴
reminder_templates     🔴
notification_logs      🔴
service_intervals      🟡 (interval_months/interval_km columns on service_catalog instead)
customer_followups     🔴

Integration Tables  🔴 Not started (plus extras)

integration_accounts  🔴

webhook_events  🔴
api_keys  🔴
external_sync_logs  🔴
telegram_links  ✅ 🆕
telegram_link_tokens  ✅ 🆕

⸻

6. Critical Backend Design

Do Not Store Inventory as a Simple Quantity

Bad:

parts.quantity = 15

Good:

inventory_movements
- part_id
- movement_type
- quantity
- source_type
- source_id
- created_by

Then calculate balance from movements or maintain a derived balance table.

Why?

Because you need to know:

* who used the part
* for which work order
* when it was used
* whether it was sold, wasted, adjusted, returned, or transferred

This has been implemented — inventory_movements is the source of truth, and inventory_balances is a materialized view derived from it.

⸻

Use Ledgers

You need at least 4 ledgers:

1. Work order status ledger
2. Inventory movement ledger
3. Payment ledger
4. Audit ledger

This protects the system from messy real-world garage behavior.

Pricing Memory Rules

The startup CRM version must still save as much pricing history as possible.

Store at least:

- base service cost
- discount_amount_mnt
- discount_percent
- quantity
- final sold price
- last sold price
- vehicle make / model context
- part last sold price
- work order and mechanic reference

Why?

Because many mechanics do not know the correct price, prices are inconsistent, and Lexus RX work can be priced differently from another vehicle even for the same service.

The system should auto-suggest values from recent history, but always allow admin override.

⸻

Business Logic Placement

Use this structure:

Supabase Postgres:
- source of truth
- relational integrity
- RLS
- triggers only for unavoidable database-side rules
Next.js server:
- invoice calculation
- work order mutations
- payment verification
- inventory deduction
- report aggregation
- permission checks beyond RLS
Supabase Edge Functions:
- webhooks
- [LIVE] check-service-reminders — daily cron that scans upcoming vehicle_service_schedules and creates reminder_logs
- lightweight external API callbacks
Frontend:
- UI only
- no trusted business logic

Supabase Edge Functions are appropriate for webhooks, authenticated/public HTTP endpoints, transactional emails, and similar integration tasks.  ￼

⸻

7. Development Roadmap

Phase 0 — Foundation  ✅ COMPLETE — 100% LIVE

Duration

2 weeks (exceeded — scope grew with extras)

Goal

Build the base platform correctly before product features.

Features

- ✅ Supabase project setup
- ✅ Next.js app setup
- ✅ Auth (Supabase SSR with cookies)
- ✅ Organizations
- ✅ Branches
- ✅ Users / Profiles
- ✅ Roles + seeded permissions (owner, admin, manager, mechanic, guest)
- ✅ RLS policies on all 67 tables
- ✅ Audit logs (immutable, append-only)
- ✅ File storage buckets (org logos, attachments)
- ✅ Dashboard shell (real data, KPI aggregation, charts)
- ✅ Error logging (Sentry)
- ✅ Subscription/plan system (with expiry cron + enforcement)
- ✅ Org branding & theme system
- ✅ Rate limiting on API mutations
- ✅ RBAC middleware on all API routes

Output

A secure multi-tenant skeleton.

Do Not Build Yet (still deferred as planned)

- Flutter
- AI
- Advanced analytics
- Messenger
- Marketplace

Completion Gate  ✅ PASSED

You should be able to create:

Organization A
Organization B
Users in both
Branch in each
Separate data access

No user from Organization A should ever see Organization B’s data.

⸻

Phase 1 — Tablet-First Startup CRM  ✅ ~95% LIVE

Duration

6–8 weeks (exceeded — delivered Phase 2/3 overlap features too)

Goal

A startup garage can run its core car CRM and service-entry workflow on a tablet with minimal typing.

Features

- ✅ Tablet-first interface for front desk and garage use (responsive, touch-friendly)
- ✅ Customer records (full CRM with import/export, shared customers, notes, communications)
- ✅ Vehicle records (full fields + VIN/smartcar lookup + plate normalization)
- ✅ Plate number field
- ✅ VIN/chassis field
- ✅ Car make / model / year / odometer / engine / transmission fields
- ✅ Fast plate-number search and duplicate detection (pg_trgm indexed)
- ✅ Work order creation (multi-step wizard)
- ✅ Work order status (full status ledger)
- ✅ Assign mechanic
- ✅ Add services (from catalog with search)
- ✅ Service catalog with default price
- ✅ Service line quantity
- ✅ Discount in tugrik
- ✅ Discount in percentage
- ✅ Last sold price column
- ✅ Vehicle-specific price memory
- ✅ Add parts manually (from catalog with search)
- ✅ Part last sold price column
- ✅ Vehicle service history
- ✅ Dashboard (real KPI aggregation, charts, export)
- ✅ Mechanic selector for report and dashboard filtering
- ✅ Timeline panel on the right side for service progress and daily activity
- ✅ Daily report per mechanic
- ✅ Weekly report per mechanic
- ✅ Monthly report per mechanic
- ✅ End-of-day closing summary (with streak tracking)
- ✅ Smart default values and auto-fill from recent work
- ✅ Touch-friendly UX for tablet use

Roles For The Startup Version  ✅ LIVE

Admin (now "Org Owner") + Manager + Mechanic + Guest — all seeded with RBAC permissions

Startup UX / QoL Rules  ✅ ALL IMPLEMENTED

- large touch targets
- auto-fill customer and vehicle data from prior visits
- default service prices from service catalog
- show last sold price beside editable current price
- remember recent values by vehicle make / model and service type
- minimize typing for mechanics
- keep important filters visible without deep navigation
- use defaults first, then manual override

Do Not Build In Phase 1 (built anyway — ahead of schedule)

- ✅ invoice workflow (built — invoices, payments, PDF, public view)
- ✅ payment flow (built — payments, split payments)
- ✅ Service reminders (built — vehicle_service_schedules + cron + logs)
- ✅ advanced inventory control (built — movement ledger, thresholds, alerts)
- ✅ supplier management (built)
- ✅ purchase orders (built)
- ❌ accounting export (still deferred)
- ✅ multi-branch operations (schema + stock transfers built; dashboard thin)
- ❌ approval workflows (still deferred)
- ❌ Flutter app (still deferred)
- ❌ AI features (still deferred)

Phase 1 Delivery Order  ✅ ALL DELIVERED

1. Tablet shell + admin/mechanic roles ✅
2. Customer and vehicle CRM ✅
3. Plate-number search + duplicate prevention ✅
4. Work order flow + mechanic assignment ✅
5. Service catalog + service/part pricing memory ✅
6. Auto-fill, defaults, and touch-first UX polish ✅
7. Mechanic reports + right-side timeline + end-of-day summary ✅

Plus extras: Drag-and-drop Bay View (kanban), full wizard with parts/services search, photo upload, mechanic time tracking, diagnosis labels

MVP Statuses

New ✅
Diagnosing ✅
In Progress ✅
Ready for Pickup ✅
Completed ✅
Cancelled ✅

Output ✅ DELIVERED

A focused Phase 1 product that handles car CRM, service entry, mechanic assignment, pricing memory, and mechanic reporting on tablet.

Completion Gate  ✅ PASSED

A garage should be able to complete this flow:

Customer arrives
→ vehicle registered
→ work order created
→ mechanic assigned
→ service added
→ suggested prices appear from history
→ service totals reviewed
→ mechanic report updates
→ service history saved

Suggested Sellable Price

Implementation: ₮2M
Monthly: ₮299k

⸻

Phase 2 — Inventory + Staff Control  ✅ ~90% LIVE

Duration

8–10 weeks (delivered with extras)

Goal

Move from "record keeping" to "business control."

Features

- ✅ Parts catalog (with global catalog integration, vehicle model mapping)
- ✅ Inventory movement ledger (immutable — purchase/sale/adjustment/transfer/waste)
- ✅ Stock in / stock out (via movement ledger)
- ✅ Low stock alerts (thresholds with severity, dashboard card)
- ✅ Supplier records
- ✅ Purchase orders
- ✅ Stock adjustments (via movement type)
- ✅ Mechanic performance (cross-mechanic leaderboard, period selectors)
- ✅ Mechanic commission rules (configurable per mechanic/service type)
- ✅ Labor / time tracking (clock in/out + mechanic_time_logs)
- ✅ Parts used per mechanic
- ✅ Profit per work order
- ✅ Revenue by service category
- ✅ Parts-cars disassembly catalog 🆕

Output ✅ DELIVERED

Now the product solves owner-level pain, not just admin work.

Completion Gate  ✅ PASSED

Owner can answer:

- Which parts are missing? ✅ (low stock alerts page + dashboard card)
- Which mechanic completed the most work? ✅ (mechanic performance page)
- Which service makes the most profit? ✅ (reports: service breakdown chart)
- Which work orders lost money? ✅ (loss reason required on negative profit)
- How much stock was used this week? ✅ (inventory reports)

Suggested Sellable Price

Implementation: ₮8M
Monthly: ₮699k

⸻

Phase 3 — Payments + Reminders + Reports  🟡 ~75% LIVE

Duration

6–8 weeks (mostly delivered)

Goal

Turn the system into a revenue engine.

Features

- ✅ Payment confirmation (with payment methods: cash/card/transfer, split payments)
- 🟡 Service reminder delivery (Telegram owner notifications done; customer-facing chatbot pending)
- ✅ Service interval reminders — vehicle_service_schedules table with per-vehicle config, reminder_logs audit trail, cron-driven check-service-reminders edge function
- ✅ Oil change reminder — generic interval system supports all service types (oil, tires, brakes, etc.)
- ✅ Auto-sync from work order completion — when a work order status changes to "Completed", services are auto-created/updated in vehicle_service_schedules
- ✅ Service catalog interval columns — interval_months and interval_km added to service_catalog for automatic next-due-date calculation
- ✅ Backfill from history — "Sync from history" button scans all completed work orders and creates schedules
- 🔴 Customer follow-up schedule
- ✅ Revenue dashboard (KPI cards, charts, trends, period selectors)
- ✅ Inventory valuation (valuation page with category filtering, export)
- ✅ Profit reports (P&L card in reports, per-work-order profit, loss reason tracking)
- ✅ Daily closing report (EOD close page with streak tracking)
- 🔴 Cash register session
- ✅ Export to Excel (on all major list pages)
- ✅ Customer portal 🆕
- ✅ Expense management 🆕 (full CRUD with categories, vendors, recurring)
- ✅ Telegram notifications 🆕 (daily/weekly/monthly owner reports via Telegram)
- ✅ Price rules engine 🆕
- ✅ Service recommendations 🆕
- ✅ Diagnosis labels 🆕

Output ✅ PARTIALLY DELIVERED

The software now helps increase repeat customers and reduce leakage.

Completion Gate  🟡 MOSTLY PASSED

Owner can see:

- ✅ Daily revenue (dashboard + reports)
- ✅ Unpaid invoices (finance page)
- ✅ Low stock (dashboard + alerts page)
- ✅ Upcoming reminders (service-reminders page)
- ✅ Completed work (dashboard + reports)
- ✅ Mechanic output (mechanic performance page)
- ✅ Repeat customer activity (retention card in reports)

⚠️ Remaining gaps before full Phase 3 delivery:
- Customer-facing messaging (WhatsApp/Facebook chatbot) unwired
- No customer follow-up scheduling
- No cash register session tracking

Suggested Sellable Price (still valid)

Implementation: ₮10M–₮15M
Monthly: ₮899k–₮1.2M

⸻

Phase 4 — Multi-Branch + Accounting Layer  🟡 ~40% LIVE

Duration

3–4 months (partially started)

Goal

Serve larger service centers.

Features

- 🔴 Multi-branch dashboard (schema exists, branch selector works, consolidated dashboard thin)
- ✅ Branch-level permissions (branch_user_permissions table)
- ✅ Branch inventory (via org_id + branch_id on all tables)
- ✅ Stock transfer between branches (stock_transfers + stock_transfer_items)
- ✅ Centralized customer database (shared customers toggle)
- 🔴 Multi-branch reports
- 🔴 Approval workflows
- ✅ Expense tracking (but not branch-gated)
- 🔴 Accounting export
- 🔴 Payroll/commission export
- 🔴 Manager approval for discounts
- 🔴 Manager approval for stock adjustments

Output  🟡 PARTIALLY DELIVERED

The foundation is laid (schema, RLS, stock transfers) but the consolidated UI and most workflow features are not built.

Completion Gate  🔴 NOT PASSED

A business with 2–5 branches CANNOT yet operate from one dashboard:
- Organization switching exists
- Branch-level data isolation works
- Stock transfers work
- But no consolidated multi-branch dashboard or reports

Suggested Sellable Price (still valid)

Implementation: ₮20M+
Monthly: From ₮1.5M

⸻

Phase 5 — Mechanic Mobile App  🔴 NOT STARTED

Duration

3–5 months (not started)

Goal

Make mechanics use the system without touching the admin dashboard.

Build With

Flutter
Local database
Sync queue
Photo compression
Push notifications
Offline drafts

Mechanic App Features (all 🔴)

- Mechanic login
- Assigned jobs
- Job details
- Add notes
- Add photos
- Update job status
- Add parts used
- Add time spent
- Offline draft updates
- Sync when online

Workaround: The web dashboard has a dedicated mechanic page (/dashboard/mechanic) with clock in/out, today's KPIs, assigned work order list, inline status changes. This serves as a PWA-based mechanic tool until the Flutter app ships.

Offline Rules (N/A — not started)

- View assigned jobs cached earlier
- Add photos
- Add notes
- Update status
- Add used parts
- Create local draft

Offline should not support:

- Final invoice
- Payment confirmation
- Stock transfer approval
- Discount approval
- User permission changes

Suggested Add-On Price (still valid)

Implementation: ₮15M–₮40M
Monthly: +₮500k–₮1.5M

⸻

Phase 6 — Platform Expansion  🟡 ~15% LIVE

Duration

6–12 months (ahead on some items, behind on others)

Goal

Move from SaaS to platform economics.

Modules

- 🔴 Parts supplier portal
- 🔴 Fleet maintenance portal
- ✅ Customer self-service portal 🆕
- 🔴 Estimate / quote approval
- ✅ Invoicing + payment capture (built ahead of schedule)
- 🔴 Appointment booking
- 🟡 Customer notifications (Telegram owner done; customer chatbot pending)
- 🔴 Photo / video inspection
- 🔴 Warranty / repeat repair tracking
- ✅ Role-based permissions (seeded RBAC: owner, admin, manager, mechanic, guest)
- ✅ Audit log
- 🟡 Backup / restore (Supabase managed; no custom backup UI)
- 🔴 Warranty claim workflow
- 🔴 Insurance repair workflow
- 🔴 API access (no api_keys or integration_accounts)
- 🔴 Webhooks
- 🔴 Third-party integrations (accounting, WhatsApp, payment gateways)
- 🔴 Offline mode + sync queue
- 🟡 Advanced BI (reports page has 10+ chart types, forecasts, targets — good but not full BI)
- 🔴 AI estimate assistant
- 🔴 Predictive maintenance engine

Missing High-Value Features to Add

These are the main gaps I would explicitly include in the master plan, even if they are delivered in later phases.

Phase 3 candidates

- 🔴 Estimate / quote approval (still missing)
- ✅ Invoicing and payment recording (LIVE)
- 🟡 Customer messaging (Telegram done; WhatsApp/Facebook chatbot pending)
- 🔴 Appointment booking (still missing)
- ✅ Customer self-service portal (LIVE — added beyond plan)
- 🔴 Photo / video inspection (still missing)
- 🔴 Warranty and repeat repair tracking (still missing)

Phase 4 candidates

- ✅ Role-based permissions (LIVE — RBAC seeded: owner, admin, manager, mechanic, guest)
- ✅ Audit log (LIVE — immutable, append-only)
- 🔴 Backup / restore (managed by Supabase; no custom backup UI)

Phase 5 candidates

- 🔴 Offline mode for weak internet environments (not started)

Phase 6 candidates

- 🔴 API / webhooks (not started)
- 🔴 Third-party integrations (not started)
- 🔴 Advanced warranty workflows (not started)

Why This Matters

Garage SaaS alone has a ceiling.

Platform modules create bigger revenue streams:

Subscription revenue
+ transaction revenue
+ API revenue
+ fleet revenue
+ supplier revenue
+ AI usage revenue

Suggested Enterprise Price

Implementation: ₮50M–₮150M+
Monthly: ₮3M–₮10M+
Transaction fees: optional

⸻

8. Development Gap Matrix

Gap	Why It Matters	Product Solution	Phase	Status
Messy customer records	Garages lose repeat customers	Customer + vehicle history	Phase 1	✅ LIVE
No repair history	Hard to upsell or diagnose	Service history per vehicle	Phase 1	✅ LIVE
No work order discipline	Jobs get forgotten	Work order workflow	Phase 1	✅ LIVE
Inventory leakage	Parts disappear or get misused	Inventory movement ledger	Phase 2	✅ LIVE
Mechanic accountability	Owner cannot measure staff	Mechanic assignment + performance	Phase 2	✅ LIVE
No repeat reminders	Customers do not return	Service interval reminders	Phase 3	🟠 WIP (engine ready, customer-facing chatbot unwired)
Payment confusion	Unpaid invoices get lost	Payment status	Phase 3	✅ LIVE
Multi-branch chaos	Larger shops need control	Branch system + transfer	Phase 4	🟠 PARTIAL (schema + stock transfer built, dashboard thin)
Poor mechanic adoption	Mechanics hate admin dashboards	Flutter mechanic app	Phase 5	🔴 TODO
Internet instability	Shops may lose access	Offline mechanic mode	Phase 5	🔴 TODO
Limited Mongolia revenue	Local market alone is small	Platform modules	Phase 6	🔴 TODO
Customization trap	Kills scalability	Settings + feature flags	All phases	✅ LIVE
Low pricing ceiling	SaaS alone caps growth	Add-ons + usage + enterprise	All phases	🟠 ONGOING

⸻

9. Feature Priority System

Every feature should be scored before building.

Score Formula

Feature Score =
Revenue Impact
+ Retention Impact
+ Operational Pain
+ Reusability
- Development Complexity
- Support Complexity

Build First

High revenue impact
High reuse across garages
Low support complexity

Delay

One customer wants it
Hard to maintain
Not reusable
Requires manual support

⸻

10. Must-Have Technical Rules

Rule 1: Multi-Tenant From Day One

Every table:

organization_id
branch_id

Rule 2: RLS From Day One

No RLS = no SaaS.

Rule 3: Audit Everything Important

Audit:

invoice edits
payment edits
stock adjustments
discounts
deleted records
user permission changes

Rule 4: Never Delete Financial Records

Use:

cancelled
voided
refunded
deleted_at

Do not hard-delete.

Rule 5: Inventory Must Be Ledger-Based

Never just update stock quantity directly.

Rule 6: Reports Must Come From Clean Events

Do not calculate reports from messy frontend state.

Rule 7: Custom Work Must Become a Module

If one customer pays for a custom feature, build it as reusable.

⸻

11. Recommended Development Team

Lean Team

1 full-stack developer
1 product/operator person
1 part-time designer
1 part-time QA/tester

Better Team

1 backend/full-stack lead
1 frontend developer
1 product designer
1 QA/support person
1 part-time mobile developer later

Do Not Hire Early

AI engineer
DevOps engineer
Flutter developer full-time
Data scientist

Not needed until later.

⸻

12. Development Cost Estimate

If You Build Yourself

Cash cost can stay low.

Approximate monthly infrastructure early:

Supabase: low-cost paid tier
Vercel: low-cost paid tier
Domain/email/tools
No external messaging costs until chatbot integration

Real cost is your time.

If Outsourced Locally

Approximate build cost:

Product Stage	Estimated Dev Cost
MVP	₮20M–₮50M
Inventory + reports	₮40M–₮90M
Multi-branch ERP	₮80M–₮200M
Flutter mechanic app	₮40M–₮120M
Full platform	₮250M+

If you are capable of building, do not outsource the core. Outsource only small isolated parts.

⸻

13. Pricing Strategy

You should support three pricing models, but push one as the default.

Best Default

Hybrid = implementation + monthly subscription

Why?

Because Mongolian customers often want “implementation,” but you need recurring revenue.

Psychological Foundation

TOLOM pricing is designed around how Mongolian garage owners actually make decisions:

1. Anchoring Effect — Enterprise pricing exists to make Pro feel reasonable
2. Compromise Effect — Pro is the psychological target (middle = safe)
3. Loss Aversion — Market “stop losing money” not “better dashboard”
4. Price = Quality Signal — Cheap software creates distrust in Mongolia
5. Setup Fees Increase Trust — Call it “Implementation & Onboarding”
6. Endowment Effect — Deep onboarding creates psychological ownership
7. Cognitive Load — Public website shows ONLY 4 plans

The highest-performing SaaS companies win because they understand buyer fear, status signaling, loss aversion, trust, risk reduction, identity, and decision psychology.

The strongest pricing question is not “How much is the software worth?” but “How expensive is the customer’s chaos?”

⸻

14. SaaS Pricing Plans

SaaS Tier 1 — Core

Target

Small garages just starting out.

Price

₮299,000 / month

Included

1 branch
3 users
Tablet-primary workflow
Customer records
Vehicle records
Car CRM with plate-number search
Work orders
Service history
Service catalog with default pricing
Service and part last sold price memory
Admin + mechanic roles
Mechanic daily / weekly / monthly reports
Service summary and totals review
Basic reports
Email support

Limits

Up to 300 work orders/month
Up to 1,000 customers
Up to 1GB storage
No inventory
No chatbot/customer messaging
No advanced reports

Purpose

This plan should be useful, but intentionally limited.

It should push serious garages toward Pro.

For go-to-market, this can be sold as the startup tablet CRM package without changing the core platform direction.

⸻

SaaS Tier 2 — Pro

Target

Most garages.

Price

₮699,000 / month

Included

1 branch
10 users
Everything in Core
Inventory management
Parts tracking
Supplier records
Low-stock alerts
Mechanic assignment
Mechanic performance
Advanced reports
Customer messaging (Telegram)
Payment history
Dashboard analytics
Priority support

Limits

Up to 1,500 work orders/month
Up to 10,000 customers
Up to 10GB storage
1 branch only

Purpose

This should be your main plan.

Make this the best value.

⸻

SaaS Tier 3 — Business

Target

Multi-branch or serious service center.

Price

₮1,590,000 / month

Included

Up to 3 branches
25 users
Everything in Pro
Multi-branch dashboard
Branch inventory
Stock transfer
Advanced permissions
Accounting export
Approval workflows
API access
BI dashboard
Custom invoice templates
Dedicated onboarding

Limits

Up to 5,000 work orders/month
Up to 50,000 customers
Up to 50GB storage

Purpose

This plan anchors value and captures bigger customers.

⸻

SaaS Tier 4 — Enterprise

Target

Large chains, dealerships, fleets.

Price

₮3M–₮10M+ / month

Included

Unlimited or negotiated branches
Custom user limits
Dedicated database option
Advanced API
Accounting integration
Fleet management
SLA
Custom reporting
Security review
Dedicated support
Custom workflows

Setup

₮30M–₮150M+

⸻

15. Hybrid Pricing Plans

This should be your main pricing model.

Hybrid Core

Implementation: ₮2M
Monthly: ₮299k

Includes

Deployment
Tablet-first onboarding
Basic customization
Service catalog and pricing setup
Staff training
Data import template
Core SaaS features

⸻

Hybrid Pro

Implementation: ₮8M
Monthly: ₮699k

Includes

Everything in Core
Inventory setup
Service category setup
Mechanic workflow setup
Messaging (Telegram) setup
Report configuration
Initial data migration

⸻

Hybrid Business

Implementation: ₮20M+
Monthly: From ₮1.59M

Includes

Everything in Pro
Multi-branch setup
Branch inventory
Approval workflows
Advanced permissions
Accounting export
BI dashboard
Custom invoice templates
Dedicated onboarding

⸻

Hybrid Enterprise

Implementation: Custom
Monthly: Custom

Includes

Custom implementation
Custom integrations
Fleet module
Dedicated environment option
Advanced analytics
API access
Priority SLA
Custom reporting
Dedicated support

⸻

16. One-Time License Pricing

Use this only when customers hate SaaS.

But protect yourself.

One-Time Basic

₮12M
Support: ₮250k/month

Includes

1 branch
Customer records
Vehicle records
Work orders
Service summary and totals review
Mechanic and daily closing reports
Installation
Basic training

⸻

One-Time Pro

₮28M
Support: ₮700k/month

Includes

Everything in Basic
Inventory
Mechanic tracking
Advanced reports
Customer messaging (Telegram)
Payment history
Up to 3 branches

⸻

One-Time Enterprise

₮60M–₮200M+
Support: ₮1.5M–₮5M/month

Includes

Multi-branch
Accounting integration
Approval workflows
Custom reports
Custom integrations
Dedicated support

⸻

Source Code Rule

Do not include source code by default.

If they want source code:

3x–5x project price

Example:

₮28M Pro license
Source code buyout: ₮84M–₮140M

Otherwise you destroy your own product business.

⸻

17. Add-On Pricing

Add-ons are where profit grows.

Customer Messaging (Telegram/WhatsApp/Facebook)  🔴 NOT STARTED — chatbot integration pending

₮80k–₮200k/month
+ platform messaging costs

Includes:

Service reminder delivery via chat
Appointment reminders
Pickup reminders
Follow-up messages

⸻

Accounting Integration

Implementation: ₮5M–₮20M
Monthly: ₮300k–₮1M

Depends on the accounting system.

⸻

Mechanic Mobile App

Implementation: ₮15M–₮40M
Monthly: ₮500k–₮1.5M

⸻

Advanced BI Dashboard

Implementation: ₮5M–₮15M
Monthly: ₮300k–₮800k

⸻

Fleet Management Module

Implementation: ₮10M–₮30M
Monthly: ₮500k–₮2M

Or price per vehicle:

₮5k–₮20k / vehicle / month

⸻

AI Estimate Assistant

Implementation: ₮20M–₮60M
Monthly: ₮1M+
Usage fee per estimate

Example:

₮500–₮2,000 per AI estimate

⸻

API Access

₮300k–₮1M/month

For:

fleet companies
parts suppliers
insurance partners
accounting systems
custom dashboards

⸻

Dedicated Deployment

Implementation: ₮10M–₮30M
Monthly: ₮1M–₮3M

Only for large customers.

⸻

Data Migration

Small: ₮500k–₮1.5M
Medium: ₮2M–₮5M
Large: ₮5M–₮20M

⸻

Custom Report

₮500k–₮3M per report

⸻

Custom Workflow

₮3M–₮15M

Only accept this if it can become reusable.

⸻

18. Pricing Psychology Without Being Cringy

Use Three Main Plans

Core
Pro
Business

Pro should be the default choice.

Structure Value Like This

Core = record keeping
Pro = control and profit
Business = scale and management

Do Not Make Core Too Cheap

If Core is ₮99k, weak customers will consume support and kill margins.

Better:

Core: ₮299k
Pro: ₮699k
Business: ₮1.59M

Use Setup Fees to Filter Serious Buyers

Implementation protects you from customers who are not committed.

Use Annual Plans

Pay 10 months, get 12 months

Example:

Pro monthly: ₮699k
Pro annual: ₮6.99M/year

That improves cash flow.

Setup Discount Rule

Never discount monthly heavily.

Discount setup instead.

Good:

Implementation ₮8M → ₮5M
Monthly stays ₮699k

Bad:

Monthly ₮699k → ₮399k forever

Recurring revenue is the asset.

⸻

19. Gross Margin Planning

Target Long-Term Gross Margin

75%–85%

Estimated Monthly Cost to Serve

These are internal planning estimates.

Plan	Monthly Price	Infra + Support Cost	Gross Margin
Core	₮299k	₮60k–₮90k	70%–80%
Pro	₮699k	₮120k–₮200k	71%–83%
Business	₮1.59M	₮300k–₮500k	68%–81%
Enterprise	₮3M+	variable	70%+ target

If support cost gets too high, your product is too complicated.

⸻

20. Plan Limits

Limits should be tied to business value, not just users.

Use these levers:

Branches
Users
Work orders/month
Storage
Messaging volume
API calls
Advanced reports
Inventory locations
Approval workflows
Integrations
Support SLA

Recommended Limits

Limit	Core	Pro	Business
Branches	1	1	3
Users	3	10	25
Work orders/month	300	1,500	5,000
Customers	1,000	10,000	50,000
Storage	1GB	10GB	50GB
Inventory	No	Yes	Yes
Messaging (Telegram/chatbot)	No	Yes	Yes
API	No	No	Yes
Multi-branch	No	No	Yes
BI	No	Basic	Advanced

⸻

21. Revenue Expansion Plan

This is pricing/product only.

Stage 1 — SaaS Revenue

Garage pays monthly.

Example:

100 garages × ₮699k = ₮69.9M/month
≈ ₮838.8M/year
≈ $234k ARR

Good business, not unicorn.

⸻

Stage 2 — Enterprise Revenue

Larger service centers pay setup + monthly.

Example:

20 business clients × ₮1.59M/month = ₮31.8M/month
10 enterprise clients × ₮5M/month = ₮50M/month

Total:

₮81.8M/month
≈ ₮981.6M/year
≈ $275k ARR

Still not unicorn.

⸻

Stage 3 — Regional SaaS

To become venture-scale, the same product must work outside Mongolia.

Example:

10,000 garages × $149/month = $1.49M MRR
= $17.88M ARR

Bigger, but still likely not unicorn by itself.

⸻

Stage 4 — Platform Revenue

This is where the upside appears.

Add:

Parts marketplace
Fleet management
Payments
AI estimates
API/data layer
Insurance/warranty workflows

Example pricing model:

SaaS: $20M ARR
Parts/platform fees: $30M ARR
Fleet/data/API: $20M ARR
AI/automation: $10M ARR
Enterprise: $20M ARR

Total:

$100M ARR

That is the type of scale needed for a unicorn-style outcome.

⸻

22. Product Expansion Pricing

Parts Marketplace Module

Product

Garages order parts from suppliers inside the system.

Pricing

Supplier monthly fee: ₮300k–₮2M
Transaction fee: 1%–3%
Premium supplier placement: monthly fee

Development Needed

Supplier portal
Catalog
Part availability
Garage order flow
Purchase order sync
Delivery status
Supplier invoice

⸻

Fleet Maintenance Module

Product

Companies manage fleets and assign vehicles to service centers.

Pricing

₮5k–₮20k per vehicle/month
or
₮1M–₮10M/month per fleet customer

Development Needed

Fleet company dashboard
Vehicle groups
Maintenance schedules
Service approvals
Budget limits
Repair history
Branch/vendor assignment

⸻

Insurance / Warranty Workflow

Product

Repair approvals, photos, estimate, claim documentation.

Pricing

Implementation: ₮20M–₮100M
Monthly: ₮2M–₮10M
Per claim fee: optional

Development Needed

Claim file
Photo evidence
Estimate approval
Repair authorization
Status tracking
Document export
API

⸻

AI Estimate Assistant

Product

Image + damage notes → suggested labor/parts estimate.

Pricing

Monthly platform fee: ₮1M+
Per estimate: ₮500–₮2,000
Enterprise custom model: ₮20M+ setup

Development Needed

Image upload
Damage annotation
Estimate suggestion
Parts/service suggestion
Confidence score
Human approval
Model feedback loop

⸻

API/Data Layer

Product

External systems integrate with your garage/fleet data.

Pricing

Basic API: ₮300k/month
Pro API: ₮1M/month
Enterprise API: custom

Development Needed

API keys
Scopes
Rate limits
Webhook events
API logs
Developer documentation
Sandbox environment

⸻

23. Final Recommended Pricing Table

Primary Hybrid Pricing (Psychologically Optimized)

Plan	Implementation	Monthly	Best For	Psychological Role
Core	₮2M	₮299k	Small garage	Safe entry anchor
Pro	₮8M	₮699k	Serious garage	Main conversion target
Business	₮20M+	From ₮1.59M	Multi-branch shop	Premium anchor
Enterprise	Custom	Custom	Chains, fleets, dealerships	Value ceiling anchor

Public Website Rules:
- Show ONLY these 4 plans
- Display order: Enterprise → Business → Pro → Core (left to right)
- Pro must be visually dominant (bigger, brighter, centered)
- Never show one-time pricing or add-ons publicly
- All add-ons and custom work are internal sales only

SaaS-Only Pricing

Plan	Monthly	Annual
Core	₮299k	₮2.99M
Pro	₮699k	₮6.99M
Business	₮1.59M	₮15.9M
Enterprise	Custom	Custom

One-Time Pricing

Plan	One-Time	Support
Basic	₮12M	₮250k/month
Pro	₮28M	₮700k/month
Enterprise	₮60M–₮200M+	₮1.5M–₮5M/month

⸻

24. What To Build First

Build this exact order:

1. ✅ Multi-tenant foundation — DONE
2. ✅ Auth + roles + branches — DONE (RBAC seeded, 5 roles)
3. ✅ Tablet-first dashboard shell — DONE (real data, KPI, charts, period bar)
4. ✅ Customers — DONE (full CRM with import/export)
5. ✅ Vehicles + plate-number lookup — DONE (with VIN/smartcar)
6. ✅ Work orders — DONE (wizard + detail + status ledger + bay view)
7. ✅ Services + pricing memory — DONE (catalog + price_history)
8. ✅ Service totals review — DONE (work order summary screen)
9. ✅ Service history — DONE (per-vehicle from completed WOs)
10. ✅ Mechanic daily / weekly / monthly reports — DONE
11. ✅ Inventory ledger — DONE (immutable movements + materialized balances)
12. ✅ Mechanic tracking — DONE (time logs, performance, commissions)
13. ✅ Payments — DONE (with split payments, invoice management)
14. ✅ Service interval reminders — LIVE (vehicle_service_schedules + reminder_logs + cron + auto-sync)
15. ✅ Advanced reports — DONE (10+ chart types, forecast, targets, P&L, retention)
16. 🟠 Multi-branch — PARTIAL (schema + stock transfers; dashboard/reports thin)
17. 🔴 Accounting export — TODO
18. 🔴 Flutter mechanic app — TODO (web PWA mechanic page as workaround)
19. 🔴 Fleet module — TODO
20. ✅ Supplier/parts module — DONE (built ahead of schedule in Phase 2)
21. 🔴 AI estimate module — TODO

Note: Order was intentionally changed during development — several Phase 1 items were built ahead of schedule (invoices, payments, inventory, suppliers) and Phase 3 items like expenses and customer portal were added beyond scope. The overall sequence has been respected but accelerated.

⸻

25. The Clean “Unicorn-Compatible” Version

Product Development Path

Tablet-first Car CRM
→
Garage OS
→ Garage ERP
→ Multi-branch Auto Service Platform
→ Fleet Maintenance Platform
→ Parts Procurement Network
→ Insurance/Warranty Workflow Layer
→ AI Maintenance Intelligence Platform

Pricing Path

₮299k/month SaaS
→ ₮699k/month Pro
→ ₮1.59M/month Business
→ ₮3M–₮10M/month Enterprise
→ transaction fees
→ per-vehicle pricing
→ API pricing
→ AI usage pricing
→ supplier marketplace pricing

That is the path from small software product to scalable vertical platform.
