/**
 * Service parameter types — Create/Update/Input interfaces for all domains.
 */
import type { WorkOrderStatus } from "./core";
import type { WorkOrderDetail } from "./composite";

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

// ── Work Orders ────────────────────────────────────────────────

export interface CreateWorkOrderParams {
  customer_id: string;
  vehicle_id: string;
  branch_id?: string;
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
  service_catalog_id: string;
  service_name: string;
  quantity?: number;
  unit_price: number;
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
}

export interface AddPartParams {
  part_id?: string;
  part_name: string;
  part_number?: string;
  quantity?: number;
  unit_price: number;
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
}

export interface WorkOrderFilters {
  status?: WorkOrderStatus;
  mechanic_id?: string;
  date?: string;
  vehicle_plate?: string;
  search?: string;
}

// ── Reports ────────────────────────────────────────────────────

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
}
