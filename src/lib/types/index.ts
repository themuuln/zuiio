// ── Imports (needed for type references within this file) ────────
import type {
  Customer,
  InventoryMovementType,
  InvoiceStatus,
  Vehicle,
  WorkOrderDetail,
  WorkOrderStatus,
} from "@/lib/database.types";

// ── Re-exports from database.types.ts ────────────────────────────
// Domain types are defined in @/lib/database.types.ts.
// This file adds API-level and convenience types used across routes and services.

export type {
  AuditLog,
  Branch,
  Customer,
  CustomerType,
  FeatureFlag,
  FuelType,
  InviteStatus,
  MechanicAssignment,
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
  Vehicle,
  VehicleModel,
  VehicleModelPart,
  VehicleOwner,
  WorkOrder,
  WorkOrderDetail,
  WorkOrderPart,
  WorkOrderRow,
  WorkOrderService,
  WorkOrderStatus,
  WorkOrderStatusHistory,
  InventoryMovement,
  InventoryMovementType,
  InventoryBalance,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  StockThreshold,
  SupplierInsert,
  PurchaseOrderInsert,
  Invoice,
  InvoiceItem,
  InvoicePayment,
  InvoiceWithItems,
  InvoiceStatus,
  PurchaseOrderItemInsert,
  StockThresholdInsert,
  SupplierUpdate,
  PurchaseOrderUpdate,
  PurchaseOrderItemUpdate,
  StockThresholdUpdate,
} from "@/lib/database.types";

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
  trial: boolean;
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

export interface EndOfDaySummary {
  date: string;
  mechanics: {
    mechanic_id: string;
    mechanic_name: string;
    work_orders_completed: number;
    services_count: number;
    parts_count: number;
    total_revenue: number;
  }[];
  total_work_orders: number;
  total_revenue: number;
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

// ── Inventory Types ────────────────────────────────────────────

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
  is_active: boolean;
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
