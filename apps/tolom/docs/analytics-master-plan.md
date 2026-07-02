# Dashboard, Analytics & Reporting — Master Plan

> Last updated: 2026-05-12 · Applies to Phase 1–6

---

## Table of Contents

1. [Executive Vision](#1-executive-vision)
2. [Research Foundation](#2-research-foundation)
   - 2.1 [Data Visualization Psychology](#21-data-visualization-psychology)
   - 2.2 [SaaS Analytics & Product Psychology](#22-saas-analytics--product-psychology)
   - 2.3 [Auto Repair Shop Metrics](#23-auto-repair-shop-metrics)
   - 2.4 [Plan Limits as a Lever](#24-plan-limits-as-a-lever)
3. [Current State Assessment](#3-current-state-assessment)
4. [Analytics Architecture](#4-analytics-architecture)
   - 4.1 [DB Layer: Materialized Views & Aggregations](#41-db-layer-materialized-views--aggregations)
   - 4.2 [Service Layer: Report Service](#42-service-layer-report-service)
   - 4.3 [API Layer: Cached Endpoints](#43-api-layer-cached-endpoints)
   - 4.4 [Frontend Layer: Progressive Disclosure](#44-frontend-layer-progressive-disclosure)
5. [Dashboard Tiers](#5-dashboard-tiers)
   - 5.1 [Role-Based Dashboards](#51-role-based-dashboards)
   - 5.2 [Global Owner Dashboard (Phase 1 MVP)](#52-global-owner-dashboard)
   - 5.3 [Mechanic Dashboard (Phase 1)](#53-mechanic-dashboard)
   - 5.4 [Admin Dashboard (Phase 2)](#54-admin-dashboard)
   - 5.5 [Multi-Branch Dashboard (Phase 4)](#55-multi-branch-dashboard)
6. [Report System Roadmap](#6-report-system-roadmap)
   - 6.1 [Phase 1 — Operational Reports](#61-phase-1--operational-reports)
   - 6.2 [Phase 2 — Business Reports](#62-phase-2--business-reports)
   - 6.3 [Phase 3 — Financial & Retention Reports](#63-phase-3--financial--retention-reports)
   - 6.4 [Phase 4+ — Advanced & BI Reports](#64-phase-4--advanced--bi-reports)
7. [Advanced Analytics Features](#7-advanced-analytics-features)
   - 7.1 [Pricing Memory Analytics](#71-pricing-memory-analytics)
   - 7.2 [Inventory Analytics](#72-inventory-analytics)
   - 7.3 [Customer Retention Analytics](#73-customer-retention-analytics)
   - 7.4 [Mechanic Performance Analytics](#74-mechanic-performance-analytics)
   - 7.5 [Profitability Analytics](#75-profitability-analytics)
   - 7.6 [Benchmarking & Industry Comparisons](#76-benchmarking--industry-comparisons)
   - 7.7 [Anomaly Detection & Alerts](#77-anomaly-detection--alerts)
   - 7.8 [Export & Embedded Analytics](#78-export--embedded-analytics)
8. [UI/UX Design System](#8-uiux-design-system)
   - 8.1 [Layout Patterns](#81-layout-patterns)
   - 8.2 [Chart Selection Guide](#82-chart-selection-guide)
   - 8.3 [Color System](#83-color-system)
   - 8.4 [Progressive Disclosure](#84-progressive-disclosure)
   - 8.5 [Interaction Design](#85-interaction-design)
   - 8.6 [Empty States & Onboarding](#86-empty-states--onboarding)
9. [Psychology-Driven Features](#9-psychology-driven-features)
   - 9.1 [The "State → Delta → Action" Pattern](#91-the-state--delta--action-pattern)
   - 9.2 [Goal Tracking & Streaks](#92-goal-tracking--streaks)
   - 9.3 [Social Proof & Benchmarking](#93-social-proof--benchmarking)
   - 9.4 [Loss Aversion Alerts](#94-loss-aversion-alerts)
   - 9.5 [End-of-Day Ritual](#95-end-of-day-ritual)
   - 9.6 [Variable Rewards](#96-variable-rewards)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Metric Inventory](#11-metric-inventory)
12. [Appendix: Chart Recipes](#12-appendix-chart-recipes)

---

## 1. Executive Vision

Analytics is **not a feature** — it's the **second product** inside TOLOM.

The primary product (work orders, inventory, payments) generates data. The analytics product converts that data into **decisions that save money and grow revenue**. A garage owner who sees their analytics daily will not switch to a competitor — the switching cost becomes enormous.

**Core thesis:** Every dashboard element must answer one of these questions:
- **State:** Where is my business right now?
- **Delta:** What changed?
- **Action:** What should I do next?

If a metric doesn't lead to a decision, it doesn't belong on the screen.

---

## 2. Research Foundation

### 2.1 Data Visualization Psychology

#### Human Perception Limits

| Principle | Source | Finding |
|-----------|--------|---------|
| Cognitive load | Miller's Law (7±2) | Max 7 KPIs per view before overload. Working memory holds ~4 items reliably. |
| Preattentive processing | Treisman's Feature Integration Theory | Color, position, size, orientation are processed in <500ms — use these for encoding data, not decoration. |
| Gestalt principles | Wertheimer et al. | Proximity → group related metrics. Similarity → consistent color coding. Closure → don't overload screens. |
| Change blindness | Rensink | Users miss gradual changes. Highlight deltas with explicit indicators. |
| Visual hierarchy | Stephen Few | Most important metric → top-left. Supportive context → middle. Action triggers → bottom. |

#### Stephen Few's 13 Common Pitfalls

| # | Pitfall | Solution |
|---|---------|----------|
| 1 | Exceeding single screen | Tabbed views, progressive disclosure |
| 2 | Supplying inadequate context for data | Always show period-over-period comparison |
| 3 | Displaying excessive detail | Summary first, drill-down on click |
| 4 | Expressing measures indirectly | Direct values, not encoded abstractions |
| 5 | Choosing inappropriate display media | Right chart for right data (see §8.2) |
| 6 | Poor data arrangement | Most important metrics top-left |
| 7 | Poor color choices | Semantic colors (green=good, red=bad) |
| 8 | Ineffective highlighting | Use sparingly — one emphasis per view |
| 9 | Cluttering with useless decoration | No 3D, gradients, gauges without purpose |
| 10 | Misusing or overusing color | Max 6 distinct colors per chart |
| 11 | Failing to design for the user's cognitive process | Map to user's decision flow |
| 12 | Arranging data poorly | Consistent ordering (chronological, ranked) |
| 13 | Not aligning with business goals | Every metric ties to a KPI tree |

#### Cognitive Load Dashboard Model

```
Top Bar    → 3-4 "Vital Signs" KPIs (state)
┌──────────────────────────────────────┐
│  Revenue    Active WOs   Customers   │
│  $12,430▴    8 ▾         342 ▴      │
└──────────────────────────────────────┘

Main Area  → 2-3 Charts (context)
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Revenue  │ │ WO Status│ │ Top Svc  │
│ Trend    │ │ Pie      │ │ Bar      │
└──────────┘ └──────────┘ └──────────┘

Bottom     → Actionable list (action)
┌──────────────────────────────────────┐
│ Recent Work Orders / Alerts          │
│ [WO-001] Toyota Camry - Diagnosing  │
│ [WO-002] Honda CRV - 0W-20 Oil Low │
└──────────────────────────────────────┘
```

### 2.2 SaaS Analytics & Product Psychology

#### Habit Formation (Nir Eyal's Hook Model)

| Stage | Trigger | Action | Variable Reward | Investment |
|-------|---------|--------|-----------------|------------|
| **Owner** | Daily push "Your shop earned ₮..." | Opens dashboard | Sees new revenue, finds issue | Customizes dashboard |
| **Mechanic** | "Your performance today" notification | Checks report | Beat yesterday's count | Tags completed jobs |
| **End of day** | Auto-generated closing summary | Reviews day | Discovers profit leak | Adjusts pricing |

#### The "Aha!" Moment for Dashboards

A first-time user should see **value within 3 seconds** of opening the dashboard:

1. **Zero-state guidance:** If no data → show sample data / demo mode / setup wizard
2. **First real data:** Highlight the single most important metric with clear interpretation
3. **Period comparison:** Always show "vs last period" to provide context

#### Pricing Psychology for Analytics

| Plan | Analytics Message |
|------|------------------|
| **Starter** | "See how your shop is doing" — basic KPIs, current period only |
| **Pro** | "Control your profit" — trends, comparisons, mechanic performance |
| **Business** | "Scale your business" — multi-branch, benchmarking, exports |
| **Enterprise** | "Optimize everything" — custom reports, BI tools, anomaly detection |

### 2.3 Auto Repair Shop Metrics

#### Industry Benchmarks

| Metric | Average Shop | Top Shop | Source |
|--------|-------------|----------|--------|
| Net profit margin | 6-7% | 15-20% | Industry surveys |
| Labor gross profit | 50-65% | 65%+ | ASA data |
| Parts gross profit | 20-28% | 30%+ | ASA data |
| Overall gross profit | 50-55% | 60%+ | Multiple |
| Effective labor rate | 80-90% of posted | 95%+ | Shop management |
| Customer return rate | 40-50% | 70%+ | Retention data |
| Work orders per bay/day | 2-3 | 4+ | Shop efficiency |
| Average repair order | varies by market | Market-specific | Transaction data |

#### Garage Owner Decision Flow

```
Monday Morning
  ↓
Check revenue → Is it below target?
  ↓                      ↓
No action            Check which services are down
  ↓                      ↓
Continue           Promote that service / adjust pricing
```

Every dashboard metric should map to a decision the owner can make TODAY.

### 2.4 Plan Limits as a Lever

| Limit Type | Starter | Pro | Business | Purpose |
|-----------|---------|-----|----------|---------|
| Dashboard type | Current period only | Trends + comparisons | Cross-branch | Upgrade motivation |
| Export | Manual copy | CSV/PDF | Scheduled + API | Power user need |
| Historical data | 3 months | 12 months | Unlimited | Retention lever |
| Custom reports | ❌ | 5 saved | Unlimited | Stickiness |
| Benchmarking | ❌ | Industry comparisons | Custom benchmarks | Pro differentiator |
| Alerts | Basic | Smart alerts | Predictive | Value expansion |
| API access | ❌ | ❌ | ✅ | Platform integration |

---

## 3. Current State Assessment

### What Exists Today (Phase 0/1)

Dashboard `/dashboard/page.tsx`:
- ✅ 8 KPI cards (revenue, active WOs, avg repair, customers, service/parts revenue, vehicles, margin %)
- ✅ Revenue trend (area chart, 30 days)
- ✅ Work order status distribution (donut chart)
- ✅ Top services by revenue (horizontal bar chart)
- ✅ Technician performance (grouped bar chart)
- ✅ Service category breakdown (pie chart)
- ✅ Customer acquisition trend (line chart, 12 months)
- ✅ Recent work orders table (last 10)
- ✅ Quick actions row (new WO, customer, vehicle, reports)

Reports `/dashboard/reports/page.tsx`:
- ✅ Daily/Weekly/Monthly/End-of-Day tabs
- ✅ Mechanic filter dropdown
- ✅ Date pickers per tab
- ✅ Basic stat cards (WO completed, services, parts, revenue)
- ✅ EOD table with mechanic breakdown + totals row

Report Service `/lib/services/report-service.ts`:
- ✅ `getDashboardData()` — full dashboard aggregation
- ✅ `getDailyReport()` / `getWeeklyReport()` / `getMonthlyReport()`
- ✅ `getEndOfDaySummary()` — per-mechanic EOD breakdown
- ✅ `getMechanicsList()` — basic mechanic lookup

### What's Missing

| Gap | Impact | Priority |
|-----|--------|----------|
| Period-over-period comparisons | No context — is revenue good or bad? | 🔴 Critical |
| Daily/weekly/monthly switcher on dashboard | Cannot zoom in/out on data | 🔴 Critical |
| Goal tracking | No targets = no urgency | 🔴 Critical |
| Empty state guidance | First-time users see blank cards | 🟡 High |
| SQL N+1 performance | Report service loops through WOs one-by-one | 🟡 High |
| Materialized views | Dashboard queries are slow at scale | 🟡 High |
| Customer retention analytics | No returning customer %, churn signals | 🟡 High |
| Inventory analytics | No turnover, stock value, low stock alerts | 🟡 High |
| Profitability per work order | No parts margin, labor margin | 🟡 High |
| Mechanic comparison | No per-mechanic efficiency, commission calc | 🟡 Medium |
| Export (CSV/PDF) | No way to get data out | 🟡 Medium |
| Benchmarks | No industry comparisons | 🟢 Low |
| Anomaly detection | No automated alerts | 🟢 Low |

---

## 4. Analytics Architecture

### 4.1 DB Layer: Materialized Views & Aggregations

Current performance bottleneck: `getDashboardData()` and `getDailyReport()` loop through individual work orders, making N+1 queries. For a shop with 500+ WOs/month, this becomes unusable.

#### Migration: `supabase/migrations/0012_analytics_materialized_views.sql`

```sql
-- 1. Daily aggregate: one row per org per date
CREATE MATERIALIZED VIEW analytics_daily AS
SELECT
  wo.organization_id,
  wo.branch_id,
  DATE(wo.updated_at) as report_date,
  COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'Completed') as completed_wos,
  COUNT(DISTINCT wo.id) FILTER (WHERE wo.status NOT IN ('Completed','Cancelled')) as active_wos,
  COALESCE(SUM(wos.final_price), 0) as service_revenue,
  COALESCE(SUM(wop.final_price), 0) as parts_revenue,
  COALESCE(SUM(wos.discount_amount), 0) + COALESCE(SUM(wop.discount_amount), 0) as total_discounts,
  COUNT(DISTINCT wos.id) as services_sold,
  COUNT(DISTINCT wop.id) as parts_sold,
  COUNT(DISTINCT wo.mechanic_id) as mechanics_active
FROM work_orders wo
LEFT JOIN work_order_services wos ON wos.work_order_id = wo.id
LEFT JOIN work_order_parts wop ON wop.work_order_id = wo.id
WHERE wo.deleted_at IS NULL
GROUP BY wo.organization_id, wo.branch_id, DATE(wo.updated_at);

-- Refresh: cron job or trigger-based refresh
CREATE INDEX idx_analytics_daily_org_date ON analytics_daily (organization_id, report_date);
```

#### Additional Materialized Views

| View | Purpose | Refresh |
|------|---------|---------|
| `analytics_daily` | Daily revenue, WOs, services, parts | Every 15 min + after WO completion |
| `analytics_mechanic_daily` | Per-mechanic daily summary | Same |
| `analytics_service_popularity` | Service frequency, avg price, revenue | Hourly |
| `analytics_inventory_movement` | Part turnover, stock velocity | Real-time via trigger |
| `analytics_customer_cohort` | Monthly cohorts, return rates | Daily |
| `analytics_monthly_summary` | Pre-rolled monthly aggregates | End of day |

#### Query optimization rules

- Dashboard queries hit materialized views, not live tables (sub-second)
- Drill-downs to individual WOs hit live tables (scoped, fast)
- Periodic refreshes via Supabase cron or Postgres `pg_cron`
- Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid table locks

### 4.2 Service Layer: Report Service

Augment `report-service.ts` with new methods:

```typescript
// New service methods to add
export class AnalyticsService {
  // Tier 1: Instant KPIs (from materialized views)
  getDashboardKpis(orgId, period, compareTo?)
  getRevenueBreakdown(orgId, dateFrom, dateTo)
  getWorkOrderVelocity(orgId, period) // avg time in each status
  
  // Tier 2: Trend analysis
  getRevenueTrend(orgId, period, granularity)
  getCustomerAcquisitionTrend(orgId, months)
  getServiceMixTrend(orgId, periods)
  
  // Tier 3: Comparative
  comparePeriods(orgId, currentPeriod, previousPeriod)
  compareMechanics(orgId, period)
  compareBranches(orgId, period)
  
  // Tier 4: Predictive (Phase 6)
  getRevenueForecast(orgId, months)
  getChurnPrediction(orgId)
  getInventoryForecast(orgId, partId)
}
```

### 4.3 API Layer: Cached Endpoints

```typescript
// Cache strategy for /api/organizations/[id]/reports
GET ?type=dashboard
  → Cache: key=org:${orgId}:dashboard:${period}
  → TTL: 60 seconds (stale on WO completion)
  → Cache tagged by orgId for busting

GET ?type=daily&date=...
  → Cache: key=org:${orgId}:daily:${date}:${mechanicId}
  → TTL: 5 minutes
  → No cache for current date (fast refresh)

GET ?type=insights
  → Cache: key=org:${orgId}:insights
  → TTL: 1 hour (stale data OK for longer analysis)
  → Computed from materialized views
```

### 4.4 Frontend Layer: Progressive Disclosure

```
Layer 1: "At a glance" (3-4 KPI cards)
  ↓ scroll
Layer 2: "Context" (2 charts)
  ↓ scroll
Layer 3: "Drill-down" (interactive table)
  ↓ click
Layer 4: "Deep dive" (custom date range, filters)
```

Each layer adds complexity but also insight density. The first fold loads in <1s with cached KPIs, charts load progressively.

---

## 5. Dashboard Tiers

### 5.1 Role-Based Dashboards

Different roles need different information:

| Role | Primary Question | Key Metrics |
|------|-----------------|-------------|
| **Owner** | Is my business profitable? | Revenue, profit, costs, trends |
| **Admin** | Are operations running smoothly? | WOs, inventory, mechanic workload |
| **Mechanic** | What do I work on today? | Assigned jobs, performance, targets |
| **Front Desk** | Who's coming in next? | Appointments, waiting customers |
| **Multi-branch Owner** | Which branch performs best? | Cross-branch comparison |

### 5.2 Global Owner Dashboard (Current, Enhance)

Current dashboard is already close. Enhance with:

**Phase 1 Enhancements:**
- [ ] Period switcher: Today / This Week / This Month / Custom Range
- [ ] Period comparison: "vs last week" arrows on each KPI (+12%, -3%)
- [ ] Sparklines on KPI cards (mini trend — 7-day revenue sparkline)
- [ ] Daily goal ring: "Today's target: 75%"
- [ ] Empty state with demo data toggle
- [ ] Time-of-day context: Morning → "Yesterday's summary". Afternoon → "Today's progress". Evening → "End of day review"

### 5.3 Mechanic Dashboard

**New page: `/dashboard/mechanic-view`**

```typescript
interface MechanicDashboardData {
  // Personal stats
  assignedJobs: number          // Current jobs
  completedToday: number        // Count
  earnedToday: number           // Revenue they generated
  avgTimePerJob: number         // Hours (from status tracking)
  rating: number | null          // Optional mechanic rating
  
  // My jobs list (slim, scoped to self)
  jobs: WorkOrderDetail[]
  
  // Performance vs peers (anonymous)
  rankInShop: number            // 3rd of 8
  percentileRevenue: number     // Top 40%
  
  // Target
  dailyGoal: number             // Shifts completed
  progressToGoal: number        // 3 of 5
}
```

### 5.4 Admin Dashboard

**New page: `/dashboard/admin-view`**

Focuses on operational control:
- Bay utilization (which bays are busy)
- Mechanic workload balance
- Inventory low-stock alerts
- Pending purchase orders
- Today's schedule / appointments
- Payment reconciliation status

### 5.5 Multi-Branch Dashboard

**New page: `/dashboard/branches` (Phase 4)**

```
┌────────────────────────────────────────────┐
│ Branch Comparison │ Period: This Month     │
├──────────┬──────────┬──────────┬───────────┤
│ Branch A │ Branch B │ Branch C │ TOTAL     │
│ ₮12.4M   │ ₮9.8M    │ ₮15.2M   │ ₮37.4M    │
│ ████▌    │ ███▌     │ █████    │ ██████    │
│ 42 WOs   │ 38 WOs   │ 51 WOs   │ 131 WOs   │
│ +8%      │ -2%      │ +15%     │ +7%       │
├──────────┴──────────┴──────────┴───────────┤
│ Per-branch breakdown: revenue, profit,      │
│ mechanic count, customer count              │
└────────────────────────────────────────────┘
```

---

## 6. Report System Roadmap

### 6.1 Phase 1 — Operational Reports

| Report | Type | Description | Data Source |
|--------|------|-------------|-------------|
| **Daily Report** | Tabular | WOs completed, services/parts per mechanic | `analytics_mechanic_daily` |
| **Weekly Report** | Tabular | 7-day breakdown with totals | `analytics_daily` |
| **Monthly Report** | Tabular | Month summary with weekly breakdown | `analytics_monthly_summary` |
| **End of Day Close** | Tabular | Cash register style closeout | Live queries |
| **Mechanic Performance** | Chart + Table | Per-mechanic: WOs, revenue, time | `analytics_mechanic_daily` |

**Enhance existing report page:**
- [ ] Add period comparison column ("vs previous period")
- [ ] Add grand total row with averages
- [ ] Add CSV export button
- [ ] Add print-friendly styles
- [ ] Add chart visualization alongside tables
- [ ] Add date range selector (instead of single date for daily)

### 6.2 Phase 2 — Business Reports

| Report | Type | Description | Prerequisite |
|--------|------|-------------|-------------|
| **Profit & Loss Summary** | Financial | Revenue - discounts - parts cost = profit | Phase 2 inventory costing |
| **Service Category P&L** | Financial | Profit per service category | Phase 2 |
| **Parts Profitability** | Financial | Parts sold vs cost, margin % | Phase 2 inventory |
| **Inventory Valuation** | Financial | Current stock value at cost | Phase 2 |
| **Low Stock Report** | Alert | Items below threshold | Phase 2 |
| **Technician Efficiency** | Performance | WOs per hour, revenue per hour | Time tracking |
| **Customer Lifetime Value** | Retention | Avg spend per customer over time | Phase 1+ data |
| **Return Customer Rate** | Retention | % of customers returning within 90/180 days | Phase 1+ data |

### 6.3 Phase 3 — Financial & Retention Reports

| Report | Type | Description |
|--------|------|-------------|
| **Revenue Dashboard** | Financial | Revenue by source (service, parts), trends |
| **Unpaid Invoices** | Alert | Aging of outstanding payments |
| **Daily Closing Report** | Financial | Full cash register session summary |
| **SMS Campaign Report** | Marketing | Delivery rates, response rates |
| **Service Interval Reminders** | Marketing | Reminders sent, booked, completed |
| **Customer Follow-up Report** | Sales | Pending follow-ups, conversion rate |
| **Discount Analysis** | Financial | Total discounts given, by mechanic, by service |

### 6.4 Phase 4+ — Advanced & BI Reports

| Report | Type | Description |
|--------|------|-------------|
| **Branch Comparison Report** | Multi-branch | Side-by-side KPIs across branches |
| **Stock Transfer Report** | Multi-branch | Cross-branch inventory movement |
| **Custom Report Builder** | Self-serve | Drag-and-drop metric selection |
| **Scheduled Email Reports** | Automation | Daily/weekly/monthly PDF emails |
| **Data Export** | Integration | CSV, Excel, XLSX, accounting format |
| **BI Dashboard** | Embedded | Full interactive dashboard (Phase 6 add-on) |

---

## 7. Advanced Analytics Features

### 7.1 Pricing Memory Analytics

TOLOM's unique differentiator: it remembers every price ever charged.

```typescript
interface PricingAnalytics {
  // Service pricing trends
  servicePriceRange: {
    serviceName: string;
    lowest: number;
    highest: number;
    mostCommon: number;
    average: number;
    lastSold: number;
    priceVolatility: number; // coefficient of variation
    vehicleContexts: Array<{make: string; model: string; avgPrice: number}>;
  }[];
  
  // Price recommendation
  suggestions: Array<{
    serviceName: string;
    suggestedPrice: number;
    confidence: number; // 0-1
    rationale: string; // "Last 10 Lexus RX services averaged ₮85,000"
  }>;
  
  // Discount analysis
  discountPatterns: Array<{
    mechanicName: string;
    avgDiscountPercent: number;
    discountFrequency: number; // % of WOs with discount
    estimatedLostRevenue: number;
    recommendation: string;
  }>;
}
```

**UI: "Pricing Intelligence" tab on dashboard**
- Shows services where actual price deviates from catalog price
- Identifies mechanics who discount more than peers
- Recommends optimal prices based on vehicle make/model history
- Shows revenue lost to discounts

### 7.2 Inventory Analytics

```typescript
interface InventoryAnalytics {
  turnover: number;                     // Inventory turnover ratio
  daysToSell: number;                   // Average days to sell a part
  stockValue: number;                   // Total stock at cost
  slowMovers: PartsCatalogItem[];       // Items not moved in 90 days
  fastMovers: PartsCatalogItem[];       // Top 10 by movement
  stockoutRisk: StockAlert[];           // Items near threshold
  wastageRate: number;                  // Waste/total movement %
  supplierPerformance: Array<{
    supplierId: string;
    name: string;
    avgLeadTimeDays: number;
    onTimeDeliveryRate: number;
    totalSpend: number;
  }>;
}
```

**UI: "Inventory Health" widget on dashboard**
- Gauge showing inventory turnover with benchmark
- Low-stock count (red if >5 items critical)
- Stock value trend (line chart, 30 days)
- Top 5 fast-moving parts this month

### 7.3 Customer Retention Analytics

```typescript
interface RetentionAnalytics {
  returnRate: {
    overall: number;           // % returning within 1 year
    byVehicleMake: Record<string, number>;
    byServiceType: Record<string, number>;
  };
  churnRisk: Array<{
    customerId: string;
    name: string;
    lastVisit: string;
    predictedChurnProbability: number;
    reason: string;
    suggestedAction: string;
  }>;
  cohortRetention: Array<{
    cohort: string;            // "2026-01"
    customers: number;
    retained1Month: number;
    retained3Month: number;
    retained6Month: number;
    retained12Month: number;
  }>;
  ltv: {
    average: number;
    byVehicleMake: Record<string, number>;
    top10PercentLTV: number;
  };
  atRiskCustomers: Array<{
    customer: Customer;
    daysSinceLastVisit: number;
    previousFrequency: number;
    riskScore: number;         // 0-100
  }>;
}
```

**UI: "Customer Health" section on dashboard**
- Return rate % with benchmark arrow
- Customer churn risk list (top 5 at-risk)
- New vs returning customer pie
- LTV trend (monthly average)

### 7.4 Mechanic Performance Analytics

```typescript
interface MechanicAnalytics {
  rankings: Array<{
    mechanicId: string;
    name: string;
    completedJobs: number;
    revenue: number;
    avgRevenuePerJob: number;
    avgTimePerJob: number;      // hours
    partsUsed: number;
    discountRate: number;       // avg discount %
    customerSatisfaction: number | null;
    efficiency: number;         // revenue per hour
  }>;
  trends: Array<{
    month: string;
    mechanicId: string;
    completedJobs: number;
    revenue: number;
  }>;
  commission: Array<{
    mechanicId: string;
    earned: number;
    target: number;
    progress: number;
  }>;
}
```

**UI: "Team Performance" section**
- Leaderboard (anonymous outside admin)
- Personal performance vs shop average
- Commission progress bars (Phase 2+)
- Individual trend (line chart — "Your 30-day performance")

### 7.5 Profitability Analytics

```typescript
interface ProfitabilityAnalytics {
  perWorkOrder: {
    woId: string;
    totalRevenue: number;
    partsCost: number;
    laborCost: number;
    discountGiven: number;
    grossProfit: number;
    grossMargin: number;
    isProfitable: boolean;
  }[];
  perService: Array<{
    serviceName: string;
    revenue: number;
    count: number;
    avgDiscount: number;
    estimatedMargin: number;
  }>;
  perMechanic: Array<{
    name: string;
    revenue: number;
    estimatedCost: number;
    grossProfit: number;
    profitMargin: number;
  }>;
  trends: RevenueTrendPoint[];
}
```

**Key metric: "Gross Profit by Work Order"**
- Color-coded list (green = profitable, yellow = low margin, red = loss)
- Identifies which WOs lost money and why
- Suggests price adjustments for repeat loss-makers

### 7.6 Benchmarking & Industry Comparisons

```
Your Shop vs. Similar Shops (anonymous, aggregated)
┌────────────────────────────────────────────┐
│ Metric          │ You    │ Avg     │ Top   │
├─────────────────┼────────┼─────────┼───────┤
│ Gross Margin    │ 52%    │ 48%     │ 62%   │
│ WO per Bay/Day  │ 2.1    │ 2.8     │ 4.2   │
│ Return Rate     │ 38%    │ 45%     │ 68%   │
│ Revenue/WO      │ ₮85k   │ ₮72k    │₮120k  │
└────────────────────────────────────────────┘
```

Benchmarking is a **Pro+ feature**. It creates switching cost — once a shop has 6 months of benchmarked data, leaving TOLOM means losing that context.

### 7.7 Anomaly Detection & Alerts

```typescript
interface AnomalyAlert {
  id: string;
  type: 'revenue_drop' | 'discount_spike' | 'inventory_anomaly' 
      | 'customer_churn' | 'mechanic_performance_drop' | 'price_deviation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metric: { current: number; expected: number; deviation: number };
  suggestedAction: string;
  created_at: string;
}
```

**Alert types:**
| Alert | Detection | Severity |
|-------|-----------|----------|
| Revenue drop >20% vs same day last week | Revenue trend analysis | 🔴 |
| Discount rate spike >2x normal | Discount analytics | 🟡 |
| Service price drop >15% below catalog | Pricing memory | 🟡 |
| Customer hasn't returned after 90 days | Retention analytics | 🟡 |
| Mechanic output drops >30% | Performance analytics | 🟡 |
| Part hasn't moved in 90 days | Inventory analytics | 🟢 |
| Purchase order overdue | Inventory analytics | 🟡 |

**Alert display:** An alert bell in the top-bar with count. Alerts open a slide-out panel. Critical alerts are also push notifications.

### 7.8 Export & Embedded Analytics

| Export Format | Phase | Implementation |
|---------------|-------|----------------|
| CSV export | Phase 1 | Server-side CSV generation |
| Print-friendly | Phase 1 | CSS `@media print` |
| PDF report | Phase 3 | `@react-pdf/renderer` or puppeteer |
| Email schedule | Phase 4 | Cron-based PDF generation + SendGrid |
| API data access | Phase 4 | REST endpoints for raw data |
| BI tool connection | Phase 6 | Postgres read-only credentials |
| Embedded charts | Phase 6 | Chart image embed URLs |

---

## 8. UI/UX Design System

### 8.1 Layout Patterns

#### KPI Card Design

```
┌─────────────────────────┐
│ Total Revenue      💰   │  ← Icon (semantic, not decorative)
│                         │
│ ₮12,430,000       ▲12% │  ← Primary value + delta indicator
│                         │
│ ▁▃▂▅▇▆▄▇█▇▆▅▄▃▂     ← Sparkline (7 or 30 mini-bar trend)
│                         │
│ vs. ₮11,000,000 last wk│  ← Context footer
└─────────────────────────┘
```

**Delta indicators:**
- ▲ green + value = increase, good
- ▼ red + value = decrease, bad (but invert for costs!)
- → gray = no change
- Show percentage change + absolute change on hover

#### Chart Card Design

```
┌────────────────────────────────┐
│ Revenue Trend    [7d|30d|90d] │  ← Title + period pills
├────────────────────────────────┤
│                                │
│  📈 Area chart with gradient   │
│  ↓ under the line              │
│                                │
│                                │
├────────────────────────────────┤
│ ⚡ This period: ₮430k ▲8%     │  ← Insight footer (one key takeaway)
└────────────────────────────────┘
```

### 8.2 Chart Selection Guide

| Data Type | Best Chart | Why |
|-----------|-----------|-----|
| Single KPI with trend | KPI card + sparkline | Instant comprehension, minimal space |
| Revenue over time | Area chart (with gradient) | Emphasizes magnitude, shows volume |
| Work order status | Donut chart (not pie) | Parts-to-whole, donut reduces distortion |
| Top services by revenue | Horizontal bar chart | Easy to read labels, sorted descending |
| Technician comparison | Grouped bar chart | Side-by-side comparison |
| Service category mix | Donut chart | Parts-to-whole |
| New customers over time | Bar chart (not line) | Discrete counts, no interpolation |
| Customer retention cohort | Cohort retention grid | Complex data needs custom grid, not chart |
| Profit vs cost | Stacked bar | Part-to-whole with composition |
| Mechanic efficiency scatter | Bubble chart | 3 dimensions: revenue, speed, volume |
| Period comparison | Bullet chart | Compact, shows target vs actual |

#### When NOT to use certain charts

| Chart | Avoid When | Better Alternative |
|-------|-----------|-------------------|
| Pie chart (3D) | Always | Donut chart (flat) |
| Radar chart | Showing comparison | Grouped bar chart |
| Gauge chart | Showing status | KPI card with color coding |
| Stacked area | >3 categories | Small multiples of line charts |
| 3D charts | Always | Flat 2D charts |

### 8.3 Color System

```typescript
// Semantic colors (consistent throughout app)
export const ANALYTICS_COLORS = {
  // Trend directions
  positive: '#22c55e',      // Green — revenue up, customers up
  negative: '#ef4444',      // Red — costs up, churn up
  neutral: '#6b7280',       // Gray — no change
  
  // Chart series (max 6 for readability)
  series: [
    '#3b82f6',  // Blue (primary)
    '#f59e0b',  // Amber
    '#8b5cf6',  // Violet
    '#10b981',  // Emerald
    '#f97316',  // Orange
    '#ec4899',  // Pink
  ],
  
  // Status mapping (consistent with WO status)
  status: {
    'New': '#3b82f6',
    'Diagnosing': '#eab308',
    'In Progress': '#f97316',
    'Ready for Pickup': '#8b5cf6',
    'Completed': '#22c55e',
    'Cancelled': '#ef4444',
  },
  
  // Severity
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  success: '#22c55e',
};
```

### 8.4 Progressive Disclosure

```
                    ↑ Data Density
                    │
  High-Level View   │  "Overview"
   (3-4 KPIs)       │  3-second scan
                    │
  ──────────────────┼────────────────────────
                    │
  Medium Detail     │  "Analysis"
   (charts + trends) │  30-second review
                    │
  ──────────────────┼────────────────────────
                    │
  Granular Detail   │  "Deep Dive"
   (tables, filters) │  2+ minutes
                    │
                    └───────────────────────→
                      User Attention →
```

### 8.5 Interaction Design

| Interaction | Behavior | Implementation |
|-------------|----------|----------------|
| **Hover on chart** | Tooltip with exact values | Recharts Tooltip with custom content |
| **Click on chart segment** | Drill down to detail | Click → filter table below chart |
| **Period pills** | Toggle 7d / 30d / 90d | State switcher, re-fetches data |
| **Date range picker** | Custom period | Shadcn DatePickerWithRange |
| **Full-screen chart** | Modal for detail | Click expand icon |
| **Column sorting** | Sort table by column | Client-side sort |
| **Search within table** | Filter rows | Debounced input |
| **Export button** | CSV download | Server-side CSV generation |
| **Refresh** | Manual data refresh | Button with loading state |

### 8.6 Empty States & Onboarding

**No data state:**
```
┌──────────────────────────────────────┐
│                                      │
│          📊 No data yet              │
│                                      │
│  Start by creating your first        │
│  work order to see analytics.        │
│                                      │
│  [Create Work Order]  [Show Demo]    │
│                                      │
└──────────────────────────────────────┘
```

**Demo data toggle:**
- Displays realistic sample data for a "Demo Garage"
- Lets users explore dashboard features before they have real data
- Can be toggled off once real data accumulates
- Never mixed with real data

**First real data celebration:**
- When first work order is completed → highlight the dashboard
- Show: "🎉 Your first completed job! Revenue: ₮45,000"
- This is the Aha! moment — make it visible

---

## 9. Psychology-Driven Features

### 9.1 The "State → Delta → Action" Pattern

Every dashboard section follows this flow:

```
STATE: "What it is"
  ↓
DELTA: "What changed"
  ↓
ACTION: "What to do"
```

Example:
> **STATE:** "You have 8 active work orders"
> **DELTA:** "That's 2 more than yesterday"
> **ACTION:** "Assign mechanics to the 3 still in 'New' status"

This is the single most powerful pattern in dashboard design. Every metric must be accompanied by its delta and a suggested action.

### 9.2 Goal Tracking & Streaks

**Daily revenue goal:**
```
Today's Target: ₮800,000
████████░░░░░░░  62%   ₮496,000 / ₮800,000
```

**Streak counter:**
```
🔥 15-day streak of meeting daily revenue target
```

**End-of-day summary:**
```
📊 Today's Close
✅ Revenue target met (₮496k of ₮800k)
✅ 6 of 8 work orders completed
⚠️ 2 work orders rolled over to tomorrow
```

**Psychology:** Streaks leverage loss aversion — users don't want to break the chain. Targets leverage goal-gradient effect — users work harder as they approach the goal.

### 9.3 Social Proof & Benchmarking

```
Your shop is in the TOP 25% of Mongolian auto shops by revenue
```

Or more granular:
```
Your labor margin (52%) is ABOVE AVERAGE (48%)
Your part markup (22%) is BELOW AVERAGE (28%)
```

**Psychology:** Social comparison theory — knowing where they stand relative to peers drives motivation to improve. Keeps shops competitive.

### 9.4 Loss Aversion Alerts

```
⚠️ ₮125,000 in discounts given this week (3x normal)
  This is ₮85,000 more than last week.
```

```
⚠️ 5 customers overdue for oil change reminder
  Estimated lost revenue: ₮350,000
```

```
⚠️ 3 parts have been in stock >180 days without movement
  Tied-up capital: ₮2,100,000
```

**Psychology:** Loss aversion (Kahneman) — losses hurt ~2x more than equivalent gains feel good. Alerts framed as "lost money" get 3x more engagement than "potential savings."

### 9.5 End-of-Day Ritual

The most important daily habit for garage owners:

1. **Auto-trigger:** At 6 PM (configurable) → push notification
2. **One-tap opens EOD summary:** No loading, instant data
3. **Key data:** Revenue, WOs completed, WOs open, customers served
4. **Highlight:** Best and worst metric of the day
5. **Last step:** "Close day" button → marks day as reviewed

**Gamification:** "Days reviewed" streak counter. Owners who close 30 consecutive days get a dashboard badge.

### 9.6 Variable Rewards

The Hook Model's most powerful element. Provide unpredictable positive surprises:

| Trigger | Variable Reward | Frequency |
|---------|----------------|-----------|
| "You generated ₮12k more revenue than this day last week" | Random positive deviation | ~3x/week |
| "Your top mechanic completed 8 jobs today — new record!" | Surprise record alert | ~1x/week |
| "Customer returned after 6 months — your SMS reminder worked" | Specific outcome | ~1x/2weeks |
| "You moved up 2 spots in shop rankings this month" | Ranking improvement | Monthly |

---

## 10. Implementation Roadmap

### Phase 1 — Current (Week 1-4)

Existing enhancements to current dashboard + reports:

| Task | Effort | Impact |
|------|--------|--------|
| Period switcher on dashboard (today/week/month) | 1d | High |
| Period comparison arrows (+12% vs last week) | 0.5d | High |
| Sparklines on KPI cards | 1d | Medium |
| Empty state with demo data toggle | 0.5d | High |
| SQL performance: add indexes, batch queries | 2d | Medium |
| CSV export button on reports | 1d | Medium |
| Date range picker (vs single date) | 1d | Medium |
| Mechanic-friendly dashboard view | 2d | Medium |
| EOD closing flow improvement | 1d | Medium |

### Phase 1 — Next (Week 5-8)

| Task | Effort | Impact |
|------|--------|--------|
| Materialized view `analytics_daily` + refresh cron | 3d | High |
| Rewrite report service to use materialized views | 2d | High |
| Pricing memory analytics widget | 2d | Medium |
| Goal tracking (daily revenue target) | 2d | High |
| Anomaly alerts (revenue drop, discount spike) | 2d | Medium |
| Print-friendly report styles | 0.5d | Low |
| Report performance optimization (batched queries) | 1d | High |

### Phase 2

| Task | Effort | Priority |
|------|--------|----------|
| Inventory analytics — turnover, stock value, alerts | 3d | High |
| Profitability per work order | 3d | High |
| Mechanic performance leaderboard + trends | 2d | High |
| Customer retention analytics — return rate, LTV | 3d | High |
| Gross margin analysis (labor vs parts) | 2d | Medium |
| Weekly email summary report | 2d | Medium |
| Discount analysis — who's discounting too much | 1d | Medium |
| Technician commission reporting | 3d | Low |

### Phase 3

| Task | Effort | Priority |
|------|--------|----------|
| Revenue dashboard with source breakdown | 2d | High |
| Unpaid invoices aging report | 1d | High |
| SMS campaign analytics | 2d | Medium |
| PDF report export | 2d | Medium |
| Custom date range with comparison | 1d | Medium |
| Dashboard customization (choose which KPIs show) | 3d | Low |
| Scheduled email reports (weekly digest) | 2d | Medium |

### Phase 4

| Task | Effort | Priority |
|------|--------|----------|
| Multi-branch comparison dashboard | 5d | High |
| Per-branch P&L | 3d | High |
| Stock transfer analytics | 2d | Medium |
| Custom report builder | 8d | Medium |
| Data export to Excel/XLSX format | 3d | Low |
| BI dashboard (embedded analytics) | 5d | Low |

### Phase 5+

| Task | Effort | Priority |
|------|--------|----------|
| Real-time bay/mechanic dashboard for Flutter app | 5d | Medium |
| Offline analytics cache for mechanic app | 3d | Medium |
| AI-powered revenue forecasting | 8d | Low |
| Predictive churn model | 5d | Low |
| API analytics — public dashboards for fleet customers | 5d | Low |
| Custom industry benchmarks (Mongolia-specific) | 3d | Low |

---

## 11. Metric Inventory

Complete catalog of every metric TOLOM can show, organized by domain:

### Revenue Metrics

| Metric | Phase | Plan Level | Calculation |
|--------|-------|-----------|-------------|
| Total Revenue | 1 | Starter | Sum of all completed WO final_prices |
| Service Revenue | 1 | Starter | Sum of work_order_services final_price |
| Parts Revenue | 1 | Starter | Sum of work_order_parts final_price |
| Revenue per Day | 1 | Starter | Revenue / days in period |
| Revenue per WO | 1 | Starter | Revenue / completed WOs |
| Revenue per Mechanic | 1 | Pro | Revenue per mechanic / period |
| Revenue per Service Category | 1 | Pro | Revenue grouped by service_catalog.category |
| Revenue by Vehicle Make | 2 | Pro | Revenue grouped by vehicle.make |
| Revenue by Payment Method | 3 | Pro | Revenue grouped by invoice.payment_method |
| Revenue Forecast | 6 | Enterprise | ML-based prediction |
| Projected Monthly Revenue | 6 | Enterprise | Current run-rate extrapolated |

### Work Order Metrics

| Metric | Phase | Plan Level | Calculation |
|--------|-------|-----------|-------------|
| Total Work Orders | 1 | Starter | Count of WOs in period |
| Active Work Orders | 1 | Starter | WOs not Completed/Cancelled |
| Completed Today | 1 | Starter | WOs completed today |
| Work Order by Status | 1 | Starter | Count by status |
| Average Completion Time | 1 | Pro | avg(completed_at - created_at) |
| WO by Bay / Day | 2 | Pro | WOs completed today at bay |
| Service per WO | 1 | Pro | avg(services per WO) |
| Parts per WO | 1 | Pro | avg(parts per WO) |
| Rolled-over WOs | 2 | Pro | WOs not completed same day |
| Status Dwell Time | 3 | Business | avg time in each status |

### Customer Metrics

| Metric | Phase | Plan Level | Calculation |
|--------|-------|-----------|-------------|
| Total Customers | 1 | Starter | Count of customers |
| New Customers (Period) | 1 | Starter | Customers created in period |
| Active Customers (Period) | 2 | Pro | Customers with WO in period |
| Customer Return Rate | 2 | Pro | Customers with >1 visit / total |
| Average Visits per Customer | 2 | Pro | Total visits / total customers |
| Customer Churn Rate | 3 | Pro | Customers not returning in 180 days |
| Customer Lifetime Value | 3 | Business | Avg total revenue per customer |
| Time Between Visits | 3 | Pro | avg(days between visits) |
| Customer Acquisition Cost | 3 | Business | Marketing spend / new customers |
| Cohort Retention | 3 | Business | % retained at 30/90/180/365 days |

### Mechanic Metrics

| Metric | Phase | Plan Level | Calculation |
|--------|-------|-----------|-------------|
| WOs Completed | 1 | Starter | Count per mechanic |
| Revenue Generated | 1 | Starter | Sum of WO revenue per mechanic |
| Services Performed | 1 | Starter | Count per mechanic |
| Parts Used | 1 | Starter | Count per mechanic |
| WO per Day | 1 | Pro | WOs / work days |
| Revenue per Day | 1 | Pro | Revenue / work days |
| Discount Rate | 2 | Pro | avg(discount %) per mechanic |
| Avg Time per WO | 2 | Pro | avg(completed - started) |
| Parts Cost Used | 2 | Pro | Sum of part costs per mechanic |
| Gross Profit Generated | 2 | Business | Revenue - cost per mechanic |
| Commission Earned | 3 | Business | Revenue × commission rate |
| Efficiency Rating | 3 | Business | Revenue per hour |

### Inventory Metrics

| Metric | Phase | Plan Level | Calculation |
|--------|-------|-----------|-------------|
| Stock Value | 2 | Pro | Sum(quantity_on_hand × unit_cost) |
| Items Low Stock | 2 | Pro | Count items below threshold |
| Turnover Rate | 3 | Business | (COGS) / avg inventory value |
| Days to Sell | 3 | Pro | avg(days since received to sold) |
| Parts Used per WO | 2 | Pro | avg(parts per completed WO) |
| Stockouts (Period) | 3 | Business | Items encountered stockout |
| Waste Rate | 3 | Business | Waste movements / total movements |
| Stock Accuracy | 3 | Business | Physical count / system count |
| Supplier Lead Time | 3 | Pro | avg(days from order to receipt) |
| Order Fill Rate | 3 | Pro | Items received / items ordered |

### Financial Metrics

| Metric | Phase | Plan Level | Calculation |
|--------|-------|-----------|-------------|
| Gross Revenue | 1 | Starter | Revenue before discounts |
| Net Revenue | 1 | Starter | Revenue after discounts |
| Total Discounts | 1 | Starter | Sum of discounts given |
| Discount Rate | 1 | Pro | Discounts / Gross Revenue |
| Parts Margin % | 3 | Business | (Parts revenue - parts cost) / Parts revenue |
| Labor Margin % | 3 | Business | (Labor revenue - labor cost) / Labor revenue |
| Gross Profit | 3 | Business | Net revenue - parts cost |
| Profit per WO | 3 | Business | WO revenue - WO parts cost |
| Accounts Receivable Aging | 3 | Pro | Unpaid invoices by age bucket |
| Effective Labor Rate | 3 | Business | Labor revenue / labor hours |

### Retention & Marketing Metrics

| Metric | Phase | Plan Level | Calculation |
|--------|-------|-----------|-------------|
| SMS Sent | 3 | Pro | Count |
| SMS Delivery Rate | 3 | Pro | Delivered / sent |
| SMS Booking Rate | 3 | Business | Booked appointments / SMS sent |
| Reminders Scheduled | 3 | Pro | Count |
| Follow-ups Pending | 3 | Pro | Count |
| Repeat Visit Rate | 3 | Business | Customers with >1 visit / total |

---

## 12. Appendix: Chart Recipes

### Recipe 1: Revenue Trend (Area Chart)

```tsx
// Recharts config
<AreaChart data={revenueTrend}>
  <defs>
    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
  <XAxis dataKey="date" tickFormatter={formatDate} />
  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
  <Tooltip content={<ChartTooltip valueFormatter={formatCurrency} />} />
  <Area 
    type="monotone" 
    dataKey="revenue" 
    stroke="#3b82f6" 
    fill="url(#revenueGradient)" 
    strokeWidth={2} 
  />
</AreaChart>
```

### Recipe 2: Donut Chart (Status Distribution)

```tsx
<PieChart>
  <Pie
    data={workOrderStatusDistribution}
    cx="50%" cy="50%"
    innerRadius={60} outerRadius={90}
    paddingAngle={2}
    dataKey="count" nameKey="status"
  >
    {workOrderStatusDistribution.map((entry) => (
      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
    ))}
  </Pie>
  <Legend verticalAlign="bottom" height={36} />
</PieChart>
```

### Recipe 3: Bullet Chart (Period Comparison)

```tsx
// Custom bullet chart for compact KPI comparison
// Shows: current value, target value, previous period
// Can use Recharts Bar combined with markers
```

### Recipe 4: Cohort Retention Grid

```tsx
// Custom grid (not a standard chart)
// Rows = cohorts (months), Columns = time since
// Cells = % retained, color-coded green→red
// Heat map style
```

### Recipe 5: Mechanism Performance Sparkline

```tsx
// Mini line chart for KPI card
// Width: 100px, Height: 30px
// Pure SVG, no dependency needed for sparklines alone
```

---

## Quick Start: 5 Highest-Impact Changes

If you can only do 5 things to impress users most:

1. **Period comparison arrows** — Every KPI shows ▲/▼ with % change vs previous period. This single feature makes the dashboard feel alive. (0.5 day)

2. **Daily revenue goal with progress ring** — Owners love seeing progress toward a target. Make it configurable. Shows today's revenue vs daily target. (1 day)

3. **Empty state with demo data** — First-time users see realistic sample data, not blank cards. One click to explore. (0.5 day)

4. **"Revenue is ₮12k above last Tuesday"** — One smart insight per view, written in plain language. The most engaging single feature. (1 day with LLM-generated insight from data)

5. **End-of-day close with streak counter** — Make closing the day a habit. Streak counter builds stickiness. Push notification at 6 PM. (1.5 days)

---

*This plan should be read alongside `MASTER_PLAN.md` for product context and `AGENTS.md` for multi-tenant architecture rules.*
