/**
 * Dashboard and reporting types.
 */
import type { WorkOrderDetail } from "./composite";

export interface DashboardSummary {
  totalRevenue: number;
  activeWorkOrders: number;
  completedToday: number;
  newCustomersToday: number;
  avgRepairOrderValue: number;
  partsRevenue: number;
  serviceRevenue: number;
  grossProfit: number;
  marginPercent: number;
  totalCustomers: number;
  totalVehicles: number;
}

export interface WorkOrderStatusDistribution {
  status: string;
  count: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  workOrders: number;
}

export interface TopService {
  name: string;
  revenue: number;
  count: number;
}

export interface TechnicianPerformance {
  id: string;
  name: string;
  completedOrders: number;
  revenue: number;
  avgJobValue?: number;
  jobsPerDay?: number;
  weeklyTrend?: { week: string; orders: number; revenue: number }[];
}

export interface ServiceCategoryBreakdown {
  category: string;
  revenue: number;
  count: number;
}

export interface CustomerAcquisitionPoint {
  month: string;
  newCustomers: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  summaryComparison: DashboardSummary | null;
  insights: string[];
  workOrderStatusDistribution: WorkOrderStatusDistribution[];
  revenueTrend: RevenueTrendPoint[];
  topServices: TopService[];
  technicianPerformance: TechnicianPerformance[];
  recentWorkOrders: WorkOrderDetail[];
  serviceCategoryBreakdown: ServiceCategoryBreakdown[];
  customerAcquisitionTrend: CustomerAcquisitionPoint[];
}

export interface WorkOrderProfit {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  serviceRevenue: number;
  serviceCost: number;
  partsRevenue: number;
  partsCost: number;
}

// ── Branch Comparison ────────────────────────────────────────

/** Per-branch KPI summary for cross-branch comparison */
export interface BranchKpiSummary {
  branchId: string;
  branchName: string;
  isMain: boolean;
  totalRevenue: number;
  serviceRevenue: number;
  partsRevenue: number;
  grossProfit: number;
  marginPercent: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  totalCustomers: number;
  avgRepairOrderValue: number;
  serviceMix: number;
}

/** Cross-branch comparison data */
export interface BranchComparisonData {
  branches: BranchKpiSummary[];
  totals: Omit<BranchKpiSummary, "branchId" | "branchName" | "isMain">;
  periodLabel: string;
}
