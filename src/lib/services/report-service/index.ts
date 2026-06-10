// ── Report Service barrel ───────────────────────────────────
// Re-exports everything that was previously exported from report-service.ts
// to preserve the public API for consumers.

// ── Utilities (re-exported for internal use and external consumers) ──
export { formatNum, formatCurrencyHelper, getWeekKey } from "./utils";

// ── Batched query helpers ──
export {
  getRevenueTrendBatched,
  getTopServicesBatched,
  getTechnicianPerformanceBatched,
  getRecentWorkOrdersBatched,
  getServiceCategoryBreakdownBatched,
  getCustomerAcquisitionTrendBatched,
} from "./queries";

// ── Profitability ──
export {
  calculateProfitability,
  getComparisonData,
  getWorkOrderProfit,
  getDashboardProfitSummary,
  getPreviousPeriodSummary,
  getPnLSummary,
} from "./profitability";

// ── Mechanics ──
export {
  getMechanicKpis,
  getMechanicsList,
  getMechanicPerformanceTrend,
} from "./mechanics";

// ── Reports ──
export {
  getDailyReport,
  getCustomReport,
  getWeeklyReport,
  getMonthlyReport,
  getServiceBreakdown,
} from "./reports";

// ── End of Day ──
export { getEndOfDaySummary } from "./eod";

// ── Dashboard ──
export {
  getDashboardData,
  getDailyTimeline,
  getCustomerRetention,
} from "./dashboard";
export type { TimelineEvent } from "./dashboard";

// ── Insights ──
export { generateInsights, generateReportInsights } from "./insights";

// ── Revenue ──
export {
  getRevenueForecast,
  getRevenueTargets,
  setRevenueTarget,
} from "./revenue";
