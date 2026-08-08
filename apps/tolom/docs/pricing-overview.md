# TOLOM Pricing Overview

*Psychologically optimized for Mongolian B2B SaaS — May 2026*


> **Тэмдэглэл:** Энэхүү баримт бичигт "Core" гэж нэрлэгдсэн төлөвлөгөө нь системийн админ самбарт **"Starter"** нэртэй харагдана. Доорх хүснэгтэд үүнийг тусгасан болно.
**Exchange rate reference**: ~₮3,576 = $1 USD (Bank of Mongolia, May 2026)

> **UPDATE (2026-08-07) — v2 pricing is live in the app.** Public prices moved to
> Core ₮199k / Complete ₮499k / Business ₮999k per month (annual = 10×), work
> orders are unlimited on every plan, and implementation fees were cut
> (Core/Pro ₮0, Business ₮5M+ optional). Plan/feature gates were rebalanced per
> the research in `docs/pricing-strategy-v2.md` — read that doc for the full
> feature→tier matrix, evidence, and the first-customer launch plan. The
> psychology sections below still apply. Sections 2 and 3 below show the v2
> numbers; the one-time license and add-on tables (section 4) are unchanged.

---

## Contents

1. [The Psychology Behind TOLOM Pricing](#1-the-psychology-behind-tolom-pricing)
2. [Public Pricing — What Buyers See](#2-public-pricing--what-buyers-see)
3. [Hybrid Pricing (Implementation + Monthly)](#3-hybrid-pricing-implementation--monthly)
4. [Internal Sales Pricing](#4-internal-sales-pricing)
5. [Key Strategy Notes](#5-key-strategy-notes)

---

## 1. The Psychology Behind TOLOM Pricing

TOLOM pricing is designed around how Mongolian garage owners actually make decisions — not spreadsheets.

### The 7 Core Psychological Forces

#### 1. Anchoring Effect (Most Important)

Humans judge prices **relatively**, not absolutely.

- If the first number seen is ₮10M+, then ₮499k feels cheap
- If the first number seen is ₮99k, then ₮499k feels expensive

**Application**: Enterprise pricing exists psychologically to make Pro feel reasonable.

#### 2. The Compromise Effect

Humans avoid extremes. Most people choose the **middle** option.

**Application**: Pro is not "another plan" — it is the psychological target. Everything else exists to support Pro.

| Plan | Psychological Role |
|------|-------------------|
| Core | "Cheap/safe" anchor |
| Pro | **Main conversion target** |
| Business | Premium anchor |
| Enterprise | Value ceiling anchor |

#### 3. Loss Aversion (HUGE in Mongolia)

Garage owners do NOT think: *"How much profit will I gain?"*

They think: *"How much money am I losing?"*

**Application**: Market loss prevention, not features.

- ✅ "Stop inventory leakage"
- ✅ "Stop forgotten customer payments"
- ✅ "Stop mechanic underreporting"
- ❌ "Better dashboard"

#### 4. Price = Quality Signal

In Mongolia, cheap software creates distrust. Many believe:
- cheap = temporary, unstable, student-made, risky

**Application**: TOLOM is correctly expensive. Never become budget software.

#### 5. Setup Fees Increase Trust

Mongolian businesses prefer **implementation** over instant self-service.

**Application**: Call it "Deployment & Onboarding" — not "Setup fee."

#### 6. The Endowment Effect

Once a garage imports data, trains staff, and configures workflows, they psychologically feel: *"This is OUR system."*

**Application**: Increase onboarding depth intentionally. This reduces churn.

#### 7. Cognitive Load & Decision Fatigue

Too many choices reduce conversions.

**Application**: Public website shows ONLY 4 plans. Everything else is internal sales.

---

## 2. Public Pricing — What Buyers See

### Website Layout (Psychologically Optimized)

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Enterprise │  Business   │  Complete ★ │    Core     │
│  Custom     │  ₮999k/mo   │  ₮499k/mo   │  ₮199k/mo   │
│             │             │  MOST       │             │
│             │             │  POPULAR    │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Rules:**
- Pro is visually dominant (bigger, brighter, centered)
- Enterprise is shown first (anchor effect)
- Core is last (not first)
- Only 4 plans visible

### The Emotional Value Ladder

| Feature | Emotional Meaning |
|---------|------------------|
| Dashboard | "I finally know what's happening" |
| Inventory | "Employees can't steal easily" |
| Reports | "I can control the business" |
| CRM | "Customers stop disappearing" |
| Work orders | "Nothing gets forgotten" |
| Tablet workflow | "We became modern" |

### Plan Comparison

| | **Core** | **Complete** ★ | **Business** | **Enterprise** |
|---|---|---|---|---|
| **Monthly** | ₮199,000 | ₮499,000 | ₮999,000 | Custom |
| **Annual** | ₮1,990,000 | ₮4,990,000 | ₮9,990,000 | Custom |
| **Branches** | 1 | 1 | 3+ | Unlimited |
| **Users** | 3 | 10 | 25+ | Custom |
| **Work orders/mo** | Unlimited | Unlimited | Unlimited | Unlimited |
| **Customers** | 2,000 | 20,000 | 100,000 | Unlimited |
| **Storage** | 1 GB | 10 GB | 50 GB+ | Custom |

### What Each Plan Actually Means

**Core — ₮199k/month**
*For small garages just starting out.*

- 1 branch, 3 users, unlimited work orders
- Tablet workflow, CRM, work orders, service history
- Estimates & appointments, mechanic reports, basic finance & reports
- Email support, self-serve onboarding
- **Psychological role**: Safe entry point. Believable "cheap" that makes Complete the compromise choice.

**Complete — ₮499k/month (MOST POPULAR)**
*For growing shops that want control.*

Everything in Core, plus:
- 10 users, unlimited work orders
- Inventory management & stock control
- Telegram & SMS messaging, service reminders
- Mechanic accountability, payroll, vehicle-class pricing rules
- Dashboard analytics & priority support, guided onboarding
- **Psychological role**: The compromise choice. Most buyers land here.

**Business — ₮999k/month**
*For multi-branch service centers.*

Everything in Complete, plus:
- 3+ branches, 25+ users
- Multi-branch dashboard & inventory transfer
- Advanced inventory (purchase orders, suppliers, stock alerts, valuation)
- Advanced BI, API access, approval workflows, AI assistant
- Dedicated onboarding
- **Psychological role**: Premium anchor. Makes Complete feel reasonable.

**Enterprise — Custom**
*For chains, dealerships, fleets.*

- Unlimited/negotiated branches and users
- Dedicated database option, advanced API
- Fleet management, SLA, custom workflows
- Custom implementation & reporting
- **Psychological role**: Value ceiling anchor. Makes Complete feel reasonable.

---

## 3. Hybrid Pricing (Implementation + Monthly)

**Launch model (2026-08-07):** implementation is folded into the monthly price for Core/Complete — no upfront barrier. Implementation is an *optional* paid service for Business+ and for large migrations.

| Plan | Implementation (optional) | Monthly |
|------|---------------|---------|
| **Core** | ₮0 | ₮199k |
| **Complete** | ₮0–₮2M (migration/training only) | ₮499k |
| **Business** | ₮5M+ | ₮999k |
| **Enterprise** | Custom | Custom |

First-20-shops founding cohort: implementation ₮0 on all plans, launch prices locked 12 months.

### What Implementation Includes (optional paid)

**Complete (₮0–₮2M)**:
- Data migration (customer, vehicle, service history)
- Service catalog & pricing setup
- Staff training sessions
- Report configuration

**Business (₮5M+)**:
- Everything in Complete
- Multi-branch setup & configuration
- Branch inventory & transfer workflows
- Advanced permissions & approval workflows
…
- Custom invoice templates
- Dedicated onboarding specialist

**Enterprise (Custom)**:
- Full custom implementation
- Custom integrations & API setup
- Fleet module configuration
- Dedicated environment (optional)
- Advanced analytics & custom reporting
- Priority SLA & dedicated support

### Why "Implementation" Not "Setup Fee"

| Term | Psychology |
|------|-----------|
| "Setup fee" | Sounds like a tax, extra cost |
| "Implementation" | Sounds like a project, real work |
| "Onboarding" | Sounds like partnership, support |
| "Deployment" | Sounds enterprise-grade |
| "System configuration" | Sounds customized, professional |

---

## 4. Internal Sales Pricing

These are NOT shown on the public website. They are presented during sales conversations.

### One-Time License (When Customers Refuse SaaS)

| Plan | One-Time | Monthly Support |
|------|----------|----------------|
| Basic | ₮12M | ₮250k |
| Pro | ₮28M | ₮700k |
| Enterprise | ₮60M–₮200M+ | ₮1.5M–₮5M |

**Source Code Rule**: 3x–5x project price for source code buyout.

### Add-Ons (Where Profit Scales)

| Add-On | Implementation | Monthly | Notes |
|--------|---------------|---------|-------|
| SMS Reminders | — | ₮80k–₮200k | + actual SMS cost |
| Accounting Integration | ₮5M–₮20M | ₮300k–₮1M | Depends on system |
| Mechanic Mobile App | ₮15M–₮40M | ₮500k–₮1.5M | Flutter, offline-first |
| Advanced BI | ₮5M–₮15M | ₮300k–₮800k | |
| Fleet Management | ₮10M–₮30M | ₮500k–₮2M | Or ₮5k–₮20k/vehicle/mo |
| AI Estimate Assistant | ₮20M–₮60M | ₮1M+ | +₮500–₮2,000/estimate |
| API Access | — | ₮300k–₮1M | |
| Dedicated Deployment | ₮10M–₮30M | ₮1M–₮3M | |
| Data Migration (small) | ₮500k–₮1.5M | — | |
| Data Migration (medium) | ₮2M–₮5M | — | |
| Data Migration (large) | ₮5M–₮20M | — | |
| Custom Report | ₮500k–₮3M | — | Per report |
| Custom Workflow | ₮3M–₮15M | — | Must be reusable |

---

## 5. Key Strategy Notes

### Messaging Rules

**DO:**
- "Stop losing money from inventory leakage"
- "See missing revenue instantly"
- "Control your garage like a professional"
- "Never lose another work order"

**DON'T:**
- "Better dashboard"
- "Feature-rich platform"
- "Cloud-based solution"
- "Digital transformation"

### ROI-Based Sales Framing

**Before TOLOM:**
- Lost work orders
- Inventory leakage
- No reporting
- Owner confusion
- Manual chaos
- **Estimated loss: ₮3M–₮15M/month**

**After TOLOM (Pro):**
- Real-time visibility
- Mechanic accountability
- Inventory control
- Better throughput
- Structured operations
- **Cost: ₮499k/month**

This framing changes "software expense" into "profit protection."

### Gross Margin Targets

| Plan | Monthly | Est. Cost | Gross Margin |
|------|---------|-----------|:------------:|
| Core | ₮199k | ₮40k–₮70k | 65–80% |
| Complete | ₮499k | ₮90k–₮150k | 70–82% |
| Business | ₮999k | ₮200k–₮350k | 65–80% |
| Enterprise | Custom | Variable | 70%+ |

### Revenue Scaling Path

1. **SaaS**: 100 garages × ₮499k = ₮49.9M/mo → ₮598.8M/yr (~$166k ARR)
2. **Enterprise**: 20 business × ₮999k + 10 enterprise × ₮5M = ₮69.9M/mo → ~$233k ARR
3. **Regional SaaS**: 10,000 garages × $149/mo = ~$17.88M ARR
4. **Platform**: SaaS + parts marketplace + fleet + API + AI → $100M ARR target

### Customer Quality Filter

Cheap customers:
- Complain most, churn most, demand most
- Refer least, delay payments, resist process changes

High-quality customers:
- Already feel operational pain
- Already know chaos is expensive

**Pricing should FILTER bad customers, not maximize signup count.**

### Discount Rules

- **Never discount monthly heavily** — protect recurring revenue
- **Discount implementation instead** (e.g., ₮2M migration → ₮1M, monthly stays ₮499k)
- Annual = pay 10 months, get 12 (~17% savings)
- Recurring revenue is the asset

### What's Actually Built (as of May 2026)

**Fully built and shipping:**
- Multi-tenant foundation (orgs, branches, users, roles, RLS)
- Tablet-first dashboard with KPI analytics & revenue charts
- Customer CRM, vehicle management, work orders (full lifecycle)
- Service catalog with pricing memory
- Mechanic daily/weekly/monthly reports
- Bay view (Kanban board)
- Inventory management (parts, movements ledger, suppliers, POs)
- Finance dashboard, reports with Excel export
- Vehicle models catalog, organization settings & roles
- Theme toggle, multi-locale (Mongolian, English)
- Invoice generation, daily revenue goal tracking
- Expense tracking with categories, payment status, and tax support
- CRM with customer notes, type-based categorization, and referral source tracking
- Service reminders with configurable intervals (months/km) and notification channels
- Service intervals in catalog with auto-seed for common services

**Not yet built (roadmap):**
- SMS reminders
- API access
- Multi-branch dashboard
- Advanced BI
- Mechanic mobile app (Flutter)
- Fleet management module
- AI estimate assistant
- Parts marketplace

---

*Generated from: `MASTER_PLAN.md` and psychological pricing framework*
*Exchange rate source: Bank of Mongolia May 2026 rate (~₮3,576/$1)*
