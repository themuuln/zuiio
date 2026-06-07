/**
 * Service parameter types — Create/Update/Input interfaces for all domains.
 */

import type { WorkOrderDetail } from "./composite";
import type {
  AppointmentStatus,
  EstimateStatus,
  WorkOrderStatus,
} from "./core";

// ── Organization ───────────────────────────────────────────────

export interface CreateOrganizationParams {
  name: string;
  slug: string;
  userFullName?: string | null;
}

export interface UpdateOrganizationParams {
  name?: string;
  logoUrl?: string | null;
  settings?: Record<string, unknown>;
  sharingEnabled?: boolean;
}

export interface CreateBranchParams {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateBranchParams {
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isMain?: boolean;
  settings?: Record<string, unknown>;
}

export interface InviteUserParams {
  email: string;
  roleId?: string;
  message?: string;
}

export interface UpdateUserRoleParams {
  roleId: string;
}

// ── Subscription ───────────────────────────────────────────────

export interface SubscriptionPlanInfo {
  id: string;
  organizationId: string;
  planType: string;
  status: string;
  startedAt: string;
  expiresAt: string | null;
  gracePeriodEnd: string | null;
  trial: boolean;
}

export interface SubscriptionStatus {
  status: string;
  expired: boolean;
  plan_type: string;
  expires_at: string | null;
  grace_period_end: string | null;
  trial: boolean;
  message?: string;
}

export interface UpdateSubscriptionParams {
  planType: string;
}

// ── Appointments ──────────────────────────────────────────────

export interface CreateAppointmentParams {
  customer_id: string;
  vehicle_id: string;
  title: string;
  scheduled_at: string;
  branchId?: string | null;
  description?: string | null;
  end_at?: string | null;
  mechanic_id?: string | null;
  notes?: string | null;
  source_estimate_id?: string | null;
}

export interface UpdateAppointmentParams {
  title?: string;
  scheduled_at?: string;
  end_at?: string | null;
  description?: string | null;
  notes?: string | null;
  mechanic_id?: string | null;
  status?: AppointmentStatus;
}

// ── Estimates ──────────────────────────────────────────────────

export interface CreateEstimateParams {
  customer_id: string;
  vehicle_id: string;
  branchId?: string | null;
  notes?: string | null;
  terms?: string | null;
  valid_until?: string | null;
  discount_amount?: number;
  discount_percentage?: number;
  tax_total?: number;
  appointment_id?: string | null;
  items: Array<{
    item_type: "service" | "part" | "custom";
    source_service_id?: string | null;
    source_part_id?: string | null;
    description: string;
    quantity?: number;
    unit_price: number;
    discount_amount?: number;
    discount_percentage?: number;
    sort_order?: number;
    notes?: string | null;
  }>;
}

export interface UpdateEstimateParams {
  notes?: string | null;
  terms?: string | null;
  valid_until?: string;
  status?: EstimateStatus;
  discount_amount?: number;
  discount_percentage?: number;
  tax_total?: number;
  items?: Array<{
    item_type: "service" | "part" | "custom";
    source_service_id?: string | null;
    source_part_id?: string | null;
    description: string;
    quantity?: number;
    unit_price: number;
    discount_amount?: number;
    discount_percentage?: number;
    sort_order?: number;
    notes?: string | null;
  }>;
}

// ── Work Orders ────────────────────────────────────────────────

export interface CreateWorkOrderParams {
  customer_id?: string;
  vehicle_id: string;
  branchId?: string;
  mechanic_id?: string;
  notes?: string;
  complaint?: string;
  diagnosis_label_id?: string | null;
  services?: AddServiceParams[];
  parts?: AddPartParams[];
  discount_amount?: number;
  discount_percentage?: number;
}

export interface AddServiceParams {
  service_catalog_id: string | null;
  service_name: string;
  quantity?: number;
  unit_price: number;
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
}

export interface AddPartParams {
  part_id?: string | null;
  part_name: string;
  part_number?: string;
  quantity?: number;
  unit_price: number;
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
}

export interface WorkOrderFilters {
  status?: WorkOrderStatus | WorkOrderStatus[];
  mechanic_id?: string;
  date?: string;
  vehicle_plate?: string;
  search?: string;
  branchId?: string;
}

// ── Reports ────────────────────────────────────────────────────

/** Period-over-period comparison snapshot */
export interface ReportComparison {
  work_orders_completed: number;
  total_revenue: number;
  services_count: number;
  parts_count: number;
  /** % change from previous period (positive = improvement) */
  revenue_change_pct: number | null;
  work_orders_change_pct: number | null;
}

/** Profitability and efficiency metrics */
export interface ReportProfitability {
  gross_profit: number;
  margin_percent: number;
  service_revenue: number;
  service_cost: number;
  parts_revenue: number;
  parts_cost: number;
  total_cost: number;
  /** Effective labor rate: service revenue / billed hours (or per-WO proxy) */
  effective_labor_rate: number;
  /** Average repair order value */
  avg_repair_order: number;
  /** Parts-to-labor revenue ratio (e.g. 0.42 = 42 parts per 100 labor) */
  parts_to_labor_ratio: number;
}

/** Per-mechanic KPI row */
export interface MechanicReview {
  rating: number;
  feedback: string | null;
  customer_name: string | null;
  date: string;
}

export interface ReportMechanicKpi {
  mechanic_id: string;
  mechanic_name: string;
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
  avg_revenue_per_wo: number;
  avg_satisfaction: number | null;
  total_reviews: number;
  recent_reviews: MechanicReview[];
}

export interface DailyReport {
  date: string;
  mechanic_id: string;
  mechanic_name: string;
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
  total_discounts: number;
  work_orders: WorkOrderDetail[];
  /** Previous same-length period comparison */
  comparison: ReportComparison | null;
  /** Profitability metrics */
  profitability: ReportProfitability | null;
  /** Per-mechanic breakdown (for "all mechanics" view) */
  mechanic_kpis: ReportMechanicKpi[];
}

export interface WeeklyReport {
  week_start: string;
  week_end: string;
  mechanic_id: string;
  mechanic_name: string;
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
  total_discounts: number;
  daily_breakdown: DailyReport[];
  comparison: ReportComparison | null;
  profitability: ReportProfitability | null;
  mechanic_kpis: ReportMechanicKpi[];
}

export interface MonthlyReport {
  year: number;
  month: number;
  mechanic_id: string;
  mechanic_name: string;
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
  total_discounts: number;
  weekly_breakdown: WeeklyReport[];
  comparison: ReportComparison | null;
  profitability: ReportProfitability | null;
  mechanic_kpis: ReportMechanicKpi[];
}

// ── ERP-Grade Report Extensions ───────────────────────────────

/** Severity levels for automated insights */
export type InsightSeverity = "positive" | "warning" | "danger" | "info";

/** Automated insight / alert generated from data analysis */
export interface ReportInsight {
  id: string;
  severity: InsightSeverity;
  title: string;
  message: string;
  /** Optional metric value that triggered the insight */
  metric_value?: number;
  /** Optional comparison value */
  comparison_value?: number;
  /** Actionable suggestion */
  action?: string;
}

/** Revenue forecast / projection */
export interface ReportForecast {
  /** Current period revenue to date */
  current_revenue: number;
  /** Days elapsed in period */
  days_elapsed: number;
  /** Total days in period */
  total_days: number;
  /** Projected end-of-period revenue based on current pace */
  projected_revenue: number;
  /** Previous period revenue for comparison */
  previous_period_revenue: number | null;
  /** Projected % change vs previous period */
  projected_change_pct: number | null;
  /** Daily run rate */
  daily_run_rate: number;
  /** Whether on track to meet or exceed previous period */
  on_track: boolean;
  /** Revenue target for this period (if set) */
  target_revenue: number | null;
  /** % of target achieved */
  target_progress_pct: number | null;
}

/** Revenue target / goal */
export interface ReportTarget {
  id: string;
  organization_id: string;
  /** Daily, weekly, monthly */
  period_type: "daily" | "weekly" | "monthly";
  /** Target revenue amount */
  target_revenue: number;
  /** Current actual revenue */
  actual_revenue: number;
  /** % of target achieved */
  progress_pct: number;
  /** Whether target was met */
  achieved: boolean;
  /** The period this target covers */
  period_start: string;
  period_end: string;
}

/** Customer retention data */
export interface CustomerRetentionData {
  /** Total customers who visited in this period */
  total_customers: number;
  /** Customers who are returning (have >1 visit in last 12 months) */
  returning_customers: number;
  /** New customers (first visit in this period) */
  new_customers: number;
  /** Retention rate: returning / (returning + returning from before) */
  retention_rate: number;
  /** Average visits per customer in period */
  avg_visits_per_customer: number;
  /** Customer lifetime value (avg total revenue per customer) */
  avg_lifetime_value: number;
  /** Top customers by revenue */
  top_customers: Array<{
    customer_id: string;
    customer_name: string;
    total_revenue: number;
    visit_count: number;
  }>;
}

/** P&L line item */
export interface PnLLineItem {
  label: string;
  amount: number;
  /** % of revenue (for sub-items) */
  pct_of_revenue?: number;
  /** Sub-items for grouped lines */
  children?: PnLLineItem[];
}

/** Simplified Profit & Loss statement */
export interface PnLSummary {
  period_start: string;
  period_end: string;
  /** Revenue lines */
  revenue: {
    service_revenue: number;
    parts_revenue: number;
    other_revenue: number;
    total: number;
  };
  /** Cost of goods sold */
  cogs: {
    service_cost: number;
    parts_cost: number;
    total: number;
  };
  /** Gross profit = Revenue - COGS */
  gross_profit: number;
  gross_margin_pct: number;
  /** Operating expenses */
  expenses: {
    total: number;
    by_category: Array<{
      category: string;
      amount: number;
    }>;
  };
  /** Net profit = Gross Profit - Expenses */
  net_profit: number;
  net_margin_pct: number;
}

/** Service type breakdown for filtering and analysis */
export interface ServiceBreakdown {
  service_name: string;
  service_count: number;
  total_revenue: number;
  avg_price: number;
  percentage_of_revenue: number;
}

/** Enhanced report filters */
export interface ReportFilters {
  mechanic_id?: string | null;
  service_type?: string | null;
  date_from?: string;
  date_to?: string;
  period?: "daily" | "weekly" | "monthly";
}

export interface EndOfDaySummary {
  date: string;
  mechanics: {
    mechanic_id: string;
    mechanic_name: string;
    work_orders_completed: number;
    services_count: number;
    parts_count: number;
    total_revenue: number;
    total_commission: number;
  }[];
  total_work_orders: number;
  total_revenue: number;
  total_commission: number;
  /** Count of non-completed, non-cancelled work orders */
  open_work_orders: number;
  /** Payment method breakdown for completed jobs today */
  payment_breakdown: {
    cash: number;
    card: number;
    bank_transfer: number;
    other: number;
  };
  /** Unpaid invoices summary */
  unpaid_invoices: {
    count: number;
    total: number;
  };
  /** Mechanic with highest revenue today */
  best_mechanic: {
    id: string;
    name: string;
    revenue: number;
    jobs: number;
  } | null;
  /** Oldest open job (biggest issue) */
  biggest_issue: {
    description: string;
    work_order_id: string;
    customer: string;
    days_open: number;
  } | null;
}

// ── Commission ─────────────────────────────────────────────────

export interface MechanicCommissionRule {
  id: string;
  organization_id: string;
  mechanic_id: string | null;
  name: string;
  commission_type:
    | "percentage_of_labor"
    | "percentage_of_parts"
    | "percentage_of_revenue"
    | "fixed_per_work_order";
  commission_value: number;
  min_commission: number | null;
  max_commission: number | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

export interface WorkOrderCommission {
  id: string;
  work_order_id: string;
  mechanic_id: string;
  commission_rule_id: string | null;
  commission_type: string;
  commission_rate: number;
  commission_amount: number;
  labor_amount: number;
  parts_amount: number;
  created_at: string;
  updated_at: string;
}

// ── CRM ────────────────────────────────────────────────────────

export type CustomerNoteType =
  | "general"
  | "follow_up"
  | "complaint"
  | "call"
  | "email"
  | "meeting"
  | "other";

export interface CreateCustomerParams {
  type?: "individual" | "company";
  firstName?: string;
  lastName?: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  source?: string;
  branchId?: string | null;
}

export interface UpdateCustomerParams {
  type?: "individual" | "company";
  firstName?: string;
  lastName?: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  source?: string;
}

export interface CreateCustomerNoteParams {
  content: string;
  type?: CustomerNoteType;
}

export interface CreateCustomerCommunicationParams {
  type: "call" | "email" | "in_person" | "note";
  direction: "inbound" | "outbound";
  subject?: string;
  content: string;
  customerId?: string;
}

export interface CustomerNote {
  id: string;
  organization_id: string;
  customer_id: string;
  content: string;
  type: CustomerNoteType;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type CustomerNoteInsert = Omit<
  CustomerNote,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomerNoteUpdate = Partial<
  Omit<CustomerNote, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

// ── Vehicles ───────────────────────────────────────────────────

export interface CreateVehicleParams {
  plateNumber: string;
  customerId?: string;
  vin?: string;
  chassisNumber?: string;
  make: string;
  model: string;
  year?: number;
  trim?: string;
  color?: string;
  engine?: string;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  bodyType?: string;
  odometer?: number;
  notes?: string;
  licenseExpiryAt?: string;
  nextServiceAt?: string;
  importDate?: string;
  countryOfOrigin?: string;
  category?: string;
  seats?: number;
  steering?: string;
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  branchId?: string | null;
}

export interface UpdateVehicleParams {
  plateNumber?: string;
  customerId?: string;
  vin?: string | null;
  chassisNumber?: string | null;
  make?: string;
  model?: string;
  year?: number | null;
  trim?: string | null;
  color?: string | null;
  engine?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  bodyType?: string | null;
  odometer?: number | null;
  notes?: string | null;
  licenseExpiryAt?: string | null;
  nextServiceAt?: string | null;
  importDate?: string | null;
  countryOfOrigin?: string | null;
  category?: string | null;
  seats?: number | null;
  steering?: string | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
  weight?: number | null;
}

export interface CreateServiceCatalogParams {
  name: string;
  name_mn?: string | null;
  description?: string;
  default_price: number;
  category?: string;
}
