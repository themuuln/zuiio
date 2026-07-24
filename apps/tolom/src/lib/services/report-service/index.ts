// ── Report Service barrel ───────────────────────────────────
// Re-exports everything that was previously exported from report-service.ts
// to preserve the public API for consumers.

// ── Branch Comparison ──
export { getBranchComparison } from "./branch-comparison";
export type { TimelineEvent } from "./dashboard";
// ── Dashboard ──
export {
  getCustomerRetention,
  getDailyTimeline,
  getDashboardData,
} from "./dashboard";
// ── End of Day ──
export { getEndOfDaySummary } from "./eod";
// ── Insights ──
export { generateInsights, generateReportInsights } from "./insights";
// ── Mechanics ──
export {
  getMechanicKpis,
  getMechanicPerformanceTrend,
  getMechanicsList,
} from "./mechanics";
// ── Profitability ──
export {
  calculateProfitability,
  getComparisonData,
  getDashboardProfitSummary,
  getPnLSummary,
  getPreviousPeriodSummary,
} from "./profitability";
// ── Batched query helpers ──
export {
  getCustomerAcquisitionTrendBatched,
  getRecentWorkOrdersBatched,
  getRevenueTrendBatched,
  getServiceCategoryBreakdownBatched,
  getTechnicianPerformanceBatched,
  getTopServicesBatched,
} from "./queries";
// ── Reports ──
export {
  getCustomReport,
  getDailyReport,
  getFinanceSummaryFast,
  getMechanicLeaderboardFast,
  getMonthlyReport,
  getServiceBreakdown,
  getWeeklyReport,
} from "./reports";

// ── Revenue ──
export {
  getRevenueForecast,
  getRevenueTargets,
  setRevenueTarget,
} from "./revenue";
// ── Utilities (re-exported for internal use and external consumers) ──
export { formatCurrencyHelper, formatNum, getWeekKey } from "./utils";
