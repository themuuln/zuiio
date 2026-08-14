Write Vitest component tests for Reports + Charts components.

CWD: apps/tolom

Create these 8 test files:

### 1. src/components/reports/__tests__/kpi-card.test.tsx
Component: ReportKpiCard from "@/components/reports/kpi-card"
Props: { label: string; value: string; icon: LucideIcon; subtitle?: string; loading?: boolean; cls?: string; delta?: number | null; deltaInvert?: boolean }
- Test renders label and value text
- Test renders icon
- Test loading state shows Skeleton
- Test renders subtitle when provided
- Test renders delta indicator when delta is provided
- Test renders with deltaInvert

### 2. src/components/reports/__tests__/pnl-card.test.tsx
Component: PnLCard from "@/components/reports/pnl-card"
Props: { data: PnLSummary | null; loading?: boolean }
PnLSummary type from @/lib/types has: { revenue: { total, service_revenue, parts_revenue }, cogs: { total }, gross_profit, gross_margin_pct, expenses: { total, by_category: Array<{ category, amount }> }, net_profit }
- Test loading state shows Skeleton
- Test renders P&L data when provided (revenue rows, gross profit, expenses, net profit)
- Test empty state (data=null) shows noDataForPeriod text
- Uses useTranslations("reports") - mock with vi.mock or provide messages

### 3. src/components/reports/__tests__/target-card.test.tsx
Component: TargetCard from "@/components/reports/target-card"
Props: { targets: ReportTarget[]; loading?: boolean; onSetTarget?: () => void }
ReportTarget: { id, actual_revenue, target_revenue, progress_pct, achieved: boolean, ... }
- Test loading state
- Test empty targets shows "no target" state
- Test empty targets with onSetTarget shows button
- Test renders progress bar and revenue amounts
- Test achieved state shows "target met" badge

### 4. src/components/reports/__tests__/forecast-card.test.tsx
Component: ForecastCard from "@/components/reports/forecast-card"
Props: { forecast: ReportForecast | null; loading?: boolean }
ReportForecast: { projected_revenue, revenue_to_date, days_passed, days_in_period, daily_run_rate, projected_daily, ... previous_period_revenue? }
- Test loading state
- Test renders forecast data
- Test null forecast shows noDataForPeriod

### 5. src/components/reports/__tests__/retention-card.test.tsx
Component: RetentionCard from "@/components/reports/retention-card"
Props: { data: CustomerRetentionData | null; loading?: boolean }
CustomerRetentionData: { total_customers, returning_customers, new_customers, retention_rate, avg_visits, total_visits, ... top_customers: Array<{...}> }
- Test loading state
- Test renders with data
- Test empty state (data=null or total_customers=0) shows noDataForPeriod
- Test with top customers

### 6. src/components/charts/__tests__/area-chart.test.tsx
Component: AreaChart from "@/components/charts/area-chart" (dynamic export - client only)
Props: { data: Record<string, unknown>[]; config: ChartConfig; xKey: string; series: Array<{ key: string; color?: string }>; height?: number; showGrid?: boolean; showYAxis?: boolean; stacked?: boolean }
- This is a dynamic import. Test it renders by mounting.
- Mock the inner _area-chart-inner module
- Import ChartConfig from "@/components/ui/chart"

### 7. src/components/charts/__tests__/bar-chart.test.tsx
Same pattern as area-chart. Component: BarChart from "@/components/charts/bar-chart"
Has extra prop: layout?: "horizontal" | "vertical"
- Mock the inner _bar-chart-inner module

### 8. src/components/charts/__tests__/pie-chart.test.tsx
Same pattern. Component: PieChart from "@/components/charts/pie-chart"
Props: { data: Array<{ name: string; value: number; fill?: string }>; config: ChartConfig; ... }
- Mock the inner _pie-chart-inner module

Import render from @/test/test-utils. Provide messages object for translations used.
Use report messages like: { reports: { profitAndLoss: "P&L", noDataForPeriod: "No data", serviceRevenue: "Service", partsRevenue: "Parts", totalRevenue: "Total", costOfGoodsSold: "COGS", grossProfit: "Gross", grossMargin: "Margin", totalExpenses: "Expenses", netProfit: "Net", targetTitle: "Target", ofTarget: "of {amount}", achieved: "Achieved {percent}%", targetMet: "Target Met!", noRevenueTargetSet: "No target", setTarget: "Set Target", forecastTitle: "Forecast", customerRetention: "Retention" } }
