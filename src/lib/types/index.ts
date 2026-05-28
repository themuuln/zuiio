// ── Imports (needed for type references within this file) ────────
import type { Database, Tables, TablesInsert } from "@/lib/database.types";
import type { Enums } from "@/lib/database.types";

// Convenience aliases — use Tables<> helper which is designed for this
export type Customer = Tables<"customers">;
export type Vehicle = Tables<"vehicles">;
export type Invoice = Tables<"invoices">;
export type InvoicePayment = Tables<"invoice_payments">;
export type InvoiceItem = Tables<"invoice_items">;
export type WorkOrder = Tables<"work_orders">;
export type WorkOrderStatus =
  | "New"
  | "Diagnosing"
  | "In Progress"
  | "Ready for Pickup"
  | "Completed"
  | "Cancelled";
export type DiagnosisLabel = Tables<"diagnosis_labels">;
export type InventoryMovementType = Enums<"inventory_movement_type">;
export type InventoryBalance = Tables<"inventory_balances">;
export type MechanicAssignment = Tables<"mechanic_assignments">;
export type WorkOrderPart = Tables<"work_order_parts">;
export type WorkOrderService = Tables<"work_order_services">;
export type WorkOrderStatusHistory = Tables<"work_order_status_history">;
export type CustomerCommunication = Tables<"customer_communications">;
export type VehicleServiceSchedule = Tables<"vehicle_service_schedules">;
export type ReminderLog = Tables<"reminder_logs">;
export type AuditLogInsert = TablesInsert<"audit_logs">;

// ── Org Theme Types ──────────────────────────────────────────────
export interface OrgTheme {
  primaryColor: string; // oklch value, e.g. "oklch(0.55 0.15 250)"
  accentColor: string; // oklch value
  radius: string; // CSS value, e.g. "0px", "0.5rem"
  fontFamily: string; // CSS font-family stack
}

export const DEFAULT_ORG_THEME: OrgTheme = {
  primaryColor: "oklch(0.205 0 0)",
  accentColor: "oklch(0.97 0 0)",
  radius: "0px",
  fontFamily: "Inter, sans-serif",
};

// ── Re-exports from database.types.ts ────────────────────────────
// Domain types are defined in @/lib/database.types.ts.
// This file adds API-level and convenience types used across routes and services.

/** Work order with related entities — used by detail queries */
export interface WorkOrderDetail extends Record<string, unknown> {
  id: string;
  organization_id: string;
  branch_id: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  mechanic_id: string | null;
  status: string;
  complaint: string | null;
  diagnosis: string | null;
  description: string | null;
  notes: string | null;
  mechanic_notes: string | null;
  diagnosis_label_id: string | null;
  bay_number: number | null;
  queue_order: number;
  odometer_at_service: number | null;
  discount_amount: number;
  discount_percentage: number;
  discount_total: number;
  subtotal: number;
  total: number;
  completed_at: string | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  customer: Customer | null;
  vehicle: Vehicle | null;
  mechanic: { id: string; full_name: string | null } | null;
  services: WorkOrderService[];
  parts: WorkOrderPart[];
  status_history: WorkOrderStatusHistory[];
  diagnosis_label?: DiagnosisLabel | null;
  attachments?: WorkOrderAttachment[];
}

export interface WorkOrderAttachment {
  id: string;
  organization_id: string;
  work_order_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  public_url: string | null;
  file_type: "photo" | "document" | "other";
  uploaded_by: string;
  created_at: string;
  deleted_at: string | null;
}

// Convenience re-exports from Database helper (Supabase v6+ CLI)
// Instead of: import from database.types (no longer exports named types)

type AuditLog = Tables<"audit_logs">;
type Branch = Tables<"branches">;
type FeatureFlag = Tables<"organization_settings">;
type OrgInvite = Tables<"org_invites">;
type Organization = Tables<"organizations">;
type OrganizationSettings = Tables<"organization_settings">;
type OrganizationUser = Tables<"organization_users">;
type PartPriceHistory = Tables<"part_price_history">;
type PartsCatalog = Tables<"parts_catalog">;
type Permission = Tables<"permissions">;
type PermissionAction = Enums<"permission_action">;
type PlanType = Enums<"plan_type">;
type Profile = Tables<"profiles">;
type Role = Tables<"roles">;
type ServiceCatalog = Tables<"service_catalog">;
type ServiceCatalogInsert = Tables<"service_catalog">;
type ServiceCatalogUpdate = Tables<"service_catalog">;
type ServicePriceHistory = Tables<"service_price_history">;
type SubscriptionPlan = Tables<"subscription_plans">;
type VehicleModel = Tables<"vehicle_models">;
type VehicleModelPart = Tables<"vehicle_model_parts">;
type VehicleOwner = Tables<"vehicle_owners">;
type InventoryMovement = Tables<"inventory_movements">;
type Supplier = Tables<"suppliers">;
type SupplierInsert = Tables<"suppliers">;
type SupplierUpdate = Tables<"suppliers">;
type PurchaseOrder = Tables<"purchase_orders">;
type PurchaseOrderInsert = Tables<"purchase_orders">;
type PurchaseOrderUpdate = Tables<"purchase_orders">;
type PurchaseOrderItem = Tables<"purchase_order_items">;
type PurchaseOrderItemInsert = Tables<"purchase_order_items">;
type PurchaseOrderItemUpdate = Tables<"purchase_order_items">;
type StockThreshold = Tables<"stock_thresholds">;
type StockThresholdInsert = Tables<"stock_thresholds">;
type StockThresholdUpdate = Tables<"stock_thresholds">;
type PartsCars = Tables<"parts_cars">;
type PartsCarsInsert = Tables<"parts_cars">;
type PartsCarsUpdate = Tables<"parts_cars">;
type PartsCarParts = Tables<"parts_car_parts">;
type PartsCarPartsInsert = Tables<"parts_car_parts">;
type PartsCarPartsUpdate = Tables<"parts_car_parts">;
type InvoiceStatus = Enums<"invoice_status">;
type CustomerType = Customer["type"];
type FuelType = Vehicle["fuel_type"];
type InviteStatus = OrgInvite["status"];
type TransmissionType = Vehicle["transmission"];

// Direct exports (avoids re-export resolution issues with Next.js Turbopack)
export type {
  AuditLog,
  Branch,
  CustomerType,
  FeatureFlag,
  FuelType,
  InviteStatus,
  OrgInvite,
  Organization,
  OrganizationSettings,
  OrganizationUser,
  PartPriceHistory,
  PartsCatalog,
  Permission,
  PermissionAction,
  PlanType,
  Profile,
  Role,
  ServiceCatalog,
  ServiceCatalogInsert,
  ServiceCatalogUpdate,
  ServicePriceHistory,
  SubscriptionPlan,
  TransmissionType,
  VehicleModel,
  VehicleModelPart,
  VehicleOwner,
  InventoryMovement,
  Supplier,
  SupplierInsert,
  SupplierUpdate,
  PurchaseOrder,
  PurchaseOrderInsert,
  PurchaseOrderUpdate,
  PurchaseOrderItem,
  PurchaseOrderItemInsert,
  PurchaseOrderItemUpdate,
  StockThreshold,
  StockThresholdInsert,
  StockThresholdUpdate,
  PartsCars,
  PartsCarsInsert,
  PartsCarsUpdate,
  PartsCarParts,
  PartsCarPartsInsert,
  PartsCarPartsUpdate,
  InvoiceStatus,
};
export type InventoryBalanceWithAvgCost = InventoryBalance & {
  avg_unit_cost: number;
};
export type PartsCarStatus =
  | "arrived"
  | "disassembling"
  | "completed"
  | "cancelled";
export type PartsCarLocationGroup =
  | "engine"
  | "transmission"
  | "suspension"
  | "brake"
  | "body"
  | "interior"
  | "electrical"
  | "cooling"
  | "exhaust"
  | "fuel"
  | "steering"
  | "ac"
  | "other";

// ── API Response Wrappers ────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Convenience / Composite Types ────────────────────────────────

/** Flattened profile for the current user, including org + role info. */
export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  organizationId: string | null;
  organizationName: string | null;
  branchId: string | null;
  roleId: string | null;
  roleName: string | null;
}

// ── Service Parameter Types ──────────────────────────────────────

export interface CreateOrganizationParams {
  name: string;
  slug: string;
  userFullName?: string | null;
}

export interface UpdateOrganizationParams {
  name?: string;
  logoUrl?: string | null;
  settings?: Record<string, unknown>;
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

export interface UpdateUserRoleParams {
  roleId: string;
}

// Phase 1 service parameter types
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

// ── Dashboard Types ─────────────────────────────────────────────

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
  /** Previous period data for comparison, null when no prior period */
  summaryComparison: DashboardSummary | null;
  /** Smart text insights generated from data deltas */
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

// ── Phase 1 CRM Convenience Types ────────────────────────────

/** Flattened customer with vehicle count. */
export interface CustomerWithVehicleCount extends Customer {
  vehicle_count: number;
}

/** Vehicle with owner (customer) info. */
export interface VehicleWithOwner extends Vehicle {
  owner_name: string | null;
  owner_phone: string | null;
}

/** Vehicle with full owner and service history. */
export interface VehicleDetail extends Vehicle {
  owners: {
    customer_id: string;
    name: string;
    phone: string | null;
    is_primary: boolean;
  }[];
  recent_work_orders: {
    id: string;
    status: string;
    complaint: string | null;
    total: number;
    created_at: string;
  }[];
}

// ── Service Parameter Types for CRM ──────────────────────────

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

// ── Expense Types ──────────────────────────────────────────

export interface ExpenseCategory {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  branch_id: string | null;
  category_id: string | null;
  vendor_name: string | null;
  description: string;
  amount: number;
  tax_amount: number;
  expense_date: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  reference_number: string | null;
  receipt_url: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurrence_interval: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithCategory extends Expense {
  category?: ExpenseCategory | null;
}

export interface CreateExpenseParams {
  categoryId?: string;
  vendorName?: string;
  description: string;
  amount: number;
  taxAmount?: number;
  expenseDate?: string;
  dueDate?: string | null;
  paidAt?: string | null;
  paymentMethod?: string;
  referenceNumber?: string;
  receiptUrl?: string | null;
  notes?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
  branchId?: string;
}

export interface UpdateExpenseParams {
  categoryId?: string | null;
  vendorName?: string | null;
  description?: string;
  amount?: number;
  taxAmount?: number;
  expenseDate?: string;
  dueDate?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  isRecurring?: boolean;
  recurrenceInterval?: string | null;
}

export interface CreateExpenseCategoryParams {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateExpenseCategoryParams {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  totalTax: number;
  paidAmount: number;
  unpaidAmount: number;
  byCategory: {
    category_id: string | null;
    category_name: string;
    total: number;
    count: number;
  }[];
  thisMonth: number;
  lastMonth: number;
}

// ── Inventory Types ────────────────────────────────────────────

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "manual";

export type PurchaseOrderStatus =
  | "draft"
  | "ordered"
  | "partial"
  | "received"
  | "cancelled";

export interface PartsCatalogItem {
  id: string;
  organization_id: string;
  name: string;
  name_mn: string | null;
  part_number: string | null;
  category: string | null;
  description: string | null;
  unit: string;
  default_price: number | null;
  purchase_price: number | null;
  is_active: boolean;
  popularity_score?: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePartParams {
  name: string;
  name_mn?: string;
  part_number?: string;
  category?: string;
  description?: string;
  unit?: string;
  default_price?: number;
  purchase_price?: number;
}

export interface UpdatePartParams {
  name?: string;
  name_mn?: string;
  part_number?: string;
  category?: string;
  description?: string;
  unit?: string;
  default_price?: number;
  purchase_price?: number;
  is_active?: boolean;
}

export interface CreateMovementParams {
  part_id: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost?: number;
  unit_price?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
}

export interface CreateSupplierParams {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  notes?: string;
}

export interface UpdateSupplierParams {
  name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  notes?: string;
  is_active?: boolean;
}

export interface CreatePurchaseOrderParams {
  supplier_id?: string;
  order_number: string;
  notes?: string;
  items: Array<{
    part_id: string;
    quantity_ordered: number;
    unit_cost: number;
    notes?: string;
  }>;
}

export interface UpdatePurchaseOrderParams {
  status?: PurchaseOrderStatus;
  notes?: string;
  expected_at?: string;
  received_at?: string;
}

export interface CreateStockThresholdParams {
  part_id: string;
  minimum_quantity: number;
  notes?: string;
}

export type CustomerNoteType =
  | "general"
  | "follow_up"
  | "complaint"
  | "call"
  | "email"
  | "meeting"
  | "other";

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

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
  payments: InvoicePayment[];
}

export interface WorkOrderRow extends WorkOrder {
  mechanic_name: string | null;
}

// ── Global Reference Catalog Types ─────────────────────────────
// Shared across all organizations. No prices — each org sets its own.

export type GlobalPartCatalog = Tables<"global_parts_catalog">;
export type GlobalServiceCatalog = Tables<"global_services_catalog">;
export type GlobalPartsVehicleModel = Tables<"global_parts_vehicle_models">;
