/**
 * Core DB type aliases, enums, API wrappers, and foundational types.
 * Every other types/* file can import from here.
 */
// biome-ignore lint/style/noRestrictedImports: Central types mapping file
import type { Enums, Tables, TablesInsert } from "@/lib/database.types";

// ── DB Aliases ──────────────────────────────────────────────────

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
export type Appointment = Tables<"appointments">;
export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type Estimate = Tables<"estimates">;
export type EstimateItem = Tables<"estimate_items">;
export type EstimateStatus =
  | "draft"
  | "sent"
  | "approved"
  | "declined"
  | "expired"
  | "converted";
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
type ServiceCatalogInsert = TablesInsert<"service_catalog">;
type ServiceCatalogUpdate = Partial<Tables<"service_catalog">>;
type ServicePriceHistory = Tables<"service_price_history">;
type SubscriptionPlan = Tables<"subscription_plans">;
type VehicleModel = Tables<"vehicle_models">;
type VehicleModelPart = Tables<"vehicle_model_parts">;
type VehicleOwner = Tables<"vehicle_owners">;
type InventoryMovement = Tables<"inventory_movements">;
type Supplier = Tables<"suppliers">;
type SupplierInsert = TablesInsert<"suppliers">;
type SupplierUpdate = Partial<Tables<"suppliers">>;
type PurchaseOrder = Tables<"purchase_orders">;
type PurchaseOrderInsert = TablesInsert<"purchase_orders">;
type PurchaseOrderUpdate = Partial<Tables<"purchase_orders">>;
type PurchaseOrderItem = Tables<"purchase_order_items">;
type PurchaseOrderItemInsert = TablesInsert<"purchase_order_items">;
type PurchaseOrderItemUpdate = Partial<Tables<"purchase_order_items">>;
type StockThreshold = Tables<"stock_thresholds">;
type StockThresholdInsert = TablesInsert<"stock_thresholds">;
type StockThresholdUpdate = Partial<Tables<"stock_thresholds">>;
type PartsCars = Tables<"parts_cars">;
type PartsCarsInsert = TablesInsert<"parts_cars">;
type PartsCarsUpdate = Partial<Tables<"parts_cars">>;
type PartsCarParts = Tables<"parts_car_parts">;
type PartsCarPartsInsert = TablesInsert<"parts_car_parts">;
type PartsCarPartsUpdate = Partial<Tables<"parts_car_parts">>;
type InvoiceStatus = Enums<"invoice_status">;
type CustomerType = Customer["type"];
type FuelType = Vehicle["fuel_type"];
type InviteStatus = OrgInvite["status"];
type TransmissionType = Vehicle["transmission"];

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

// ── Org Theme ──────────────────────────────────────────────────

export interface OrgTheme {
  primaryColor: string;
  accentColor: string;
  radius: string;
  fontFamily: string;
}

export const DEFAULT_ORG_THEME: OrgTheme = {
  primaryColor: "oklch(0.205 0 0)",
  accentColor: "oklch(0.97 0 0)",
  radius: "0px",
  fontFamily: "Inter, sans-serif",
};

// ── API Response Wrappers ──────────────────────────────────────

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

// ── User Profile ───────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  organizationId: string | null;
  organizationName: string | null;
  branchId: string | null;
  roleId: string | null;
  roleName: string | null;
}

// ── Global Reference Catalogs ──────────────────────────────────

export type GlobalPartCatalog = Tables<"global_parts_catalog">;
export type GlobalServiceCatalog = Tables<"global_services_catalog">;
export type GlobalPartsVehicleModel = Tables<"global_parts_vehicle_models">;
