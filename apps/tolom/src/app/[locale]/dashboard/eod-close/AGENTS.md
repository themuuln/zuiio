# EOD Close

**Purpose:** End-of-day close report — daily revenue summary, payment breakdown, best mechanic, biggest issue, and close-day action with streak tracking.

## File Structure

```
eod-close/
└── page.tsx    # Full EOD report page (single file, ~620 lines)
```

## Key Components

- `EodClosePage` — Main page. Fetches EOD data and close status, displays KPIs, payment breakdown, best mechanic, biggest issue, and low stock alerts.
- `StatCard` — Reusable stat card with icon, label, value, optional subtitle, and optional link.
- `PaymentMiniCard` — Payment method breakdown card (cash, card, bank transfer, other) with colored dot.
- `PageSkeleton` — Full-page loading skeleton (header, 4 KPI cards, payment row, 2 secondary cards).

## Data Flow

- **API endpoints:**
  - `GET /api/organizations/{orgId}/reports?type=eod&date={today}` — EOD summary data (work orders, revenue, payment breakdown, best mechanic, biggest issue)
  - `GET /api/organizations/{orgId}/day-close?date={today}` — Day close status (isClosed, streak)
  - `POST /api/organizations/{orgId}/day-close` — Close the day (body: `{ date }`)
- **React Query hooks:**
  - `useCurrentOrg()` — current org ID
  - `useInventoryBalances(orgId)` — stock levels for pending items section
  - `useStockThresholds(orgId)` — minimum stock thresholds
- **Direct fetch:** All API calls use raw `fetch()` in `useCallback` + `useEffect` (not React Query). EOD data and close status are fetched in parallel via `Promise.all`.

## State Management

- **Zustand:** `useSelectedBranchId()` for branch filtering.
- **Local state:** `eodData`, `closeStatus`, `loading`, `closing`, `error` — all `useState`. No React Query for EOD data (raw fetch + manual state).

## Conventions

- Date is always today (`todayStr()` generates `YYYY-MM-DD`).
- Branch filtering: appends `branch_id` param to EOD report endpoint. `selectedBranchId === "all"` → no branch filter.
- Print support: `window.print()` with `@media print` styles hiding interactive elements and formatting for paper.
- Streak display: motivational messages based on streak length (5+ = "Amazing", 3+ = "Getting consistent", <3 = "Keep it going").
- Low stock count is computed client-side by comparing `useInventoryBalances` against `useStockThresholds` (default threshold = 5).
- This page does NOT use React Query for its primary data — it uses raw `fetch` + `useState`. This is an older pattern; newer pages prefer React Query.

## Dependencies

- Imports `LowStockCard` from `../_low-stock-card` (dashboard root component).
- Imports `formatCurrency` from `@/lib/utils`.
- Types `EodData`, `DayCloseStatus` are defined inline (not in `@/lib/types`).
- Sub-route of dashboard — inherits auth, sidebar, and brand theme from dashboard layout.
