// ============================================================
// TOLOM Database Type Definitions
// Matches supabase/migrations/00001_phase0_foundation.sql
// Snake_case column naming per convention
// ============================================================

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage";
export type PlanType = "starter" | "pro" | "business" | "enterprise";

// ----------------------------------------------------------
// Table Row Types
// ----------------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_main: boolean;
  settings: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  branch_id: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Permission {
  id: string;
  organization_id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  description: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface OrganizationUser {
  organization_id: string;
  user_id: string;
  role_id: string | null;
  branch_id: string | null;
  is_primary: boolean;
  joined_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  branch_id: string | null;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  organization_id: string;
  plan_type: PlanType;
  status: string;
  started_at: string;
  expires_at: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  organization_id: string;
  flag_key: string;
  enabled: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  organization_id: string;
  invoice_prefix: string;
  default_currency: string;
  default_tax_rate: number;
  timezone: string;
  date_format: string;
  sms_enabled: boolean;
  qpay_enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Phase 1: Customer + Vehicle CRM Types
// Added 2026-05-11
// ============================================================

export type CustomerType = "individual" | "company";
export type FuelType =
  | "gasoline"
  | "diesel"
  | "hybrid"
  | "electric"
  | "lpg"
  | "cng";
export type TransmissionType = "manual" | "automatic" | "cvt" | "dct";
export type DrivetrainType = "fwd" | "rwd" | "awd" | "4wd";
export type BodyType =
  | "sedan"
  | "suv"
  | "hatchback"
  | "coupe"
  | "wagon"
  | "pickup"
  | "van"
  | "minivan"
  | "convertible"
  | "crossover";
export type WorkOrderStatus =
  | "New"
  | "Diagnosing"
  | "In Progress"
  | "Ready for Pickup"
  | "Completed"
  | "Cancelled";

// ----------------------------------------------------------
// Phase 1 — Table Row Types
// ----------------------------------------------------------

export interface Customer {
  id: string;
  organization_id: string;
  branch_id: string | null;
  type: "individual" | "company";
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  tags: string[] | null;
  total_visits: number;
  last_visit_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Vehicle {
  id: string;
  organization_id: string;
  branch_id: string | null;
  plate_number: string;
  vin: string | null;
  chassis_number: string | null;
  make: string;
  model: string;
  year: number | null;
  trim: string | null;
  color: string | null;
  engine: string | null;
  fuel_type: string | null;
  transmission: string | null;
  drivetrain: string | null;
  body_type: string | null;
  odometer: number | null;
  last_visit_at: string | null;
  next_service_at: string | null;
  license_expiry_at: string | null;
  notes: string | null;
  tags: string[] | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface VehicleOwner {
  id: string;
  organization_id: string;
  vehicle_id: string;
  customer_id: string;
  is_primary: boolean;
  owned_from: string;
  owned_until: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ServiceCatalog {
  id: string;
  organization_id: string;
  branch_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  default_price: number | null;
  estimated_duration_minutes: number | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkOrder {
  id: string;
  organization_id: string;
  branch_id: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  status: WorkOrderStatus;
  description: string | null;
  complaint: string | null;
  diagnosis: string | null;
  mechanic_notes: string | null;
  notes: string | null;
  mechanic_id: string | null;
  bay_number: number | null;
  discount_amount: number | null;
  discount_percentage: number | null;
  subtotal: number;
  discount_total: number;
  total: number;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkOrderService {
  id: string;
  work_order_id: string;
  organization_id: string;
  service_catalog_id: string | null;
  service_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number | null;
  discount_percentage: number | null;
  final_price: number;
  last_sold_price: number | null;
  mechanic_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WorkOrderPart {
  id: string;
  work_order_id: string;
  organization_id: string;
  part_id: string | null;
  part_name: string;
  part_number: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number | null;
  discount_percentage: number | null;
  final_price: number;
  last_sold_price: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WorkOrderStatusHistory {
  id: string;
  work_order_id: string;
  organization_id: string;
  status: WorkOrderStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MechanicAssignment {
  id: string;
  work_order_id: string;
  organization_id: string;
  mechanic_id: string;
  assigned_by: string | null;
  assigned_at: string;
  unassigned_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// ============================================================
// Invoice Types
// Added 2026-05-12
// ============================================================

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled';

export interface Invoice {
  id: string;
  organization_id: string;
  branch_id: string | null;
  work_order_id: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  vehicle_plate: string | null;
  vehicle_details: string | null;
  public_token: string;
  email_sent_at: string | null;
  notes: string | null;
  terms: string | null;
  footer: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type: 'service' | 'part';
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  sort_order: number;
  created_at: string;
}

// ── Payment types ──────────────────────────────────────────────
// payments: Simple manual payment recording (cash, card, internet_bank)
// Separate from invoice_payments which are part of the invoice system

export type PaymentMethod = 'cash' | 'card' | 'internet_bank';

export interface Payment {
  id: string;
  organization_id: string;
  branch_id: string | null;
  work_order_id: string | null;
  amount: number;
  payment_method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  paid_at: string;
  created_by: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paid_at: string;
  created_by: string | null;
  created_at: string;
}

export interface InvoiceWithItems extends Invoice {
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  work_order?: WorkOrder | null;
  customer?: Customer | null;
  vehicle?: Vehicle | null;
}

export interface ServicePriceHistory {
  id: string;
  organization_id: string;
  service_catalog_id: string | null;
  vehicle_id: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  service_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  discount_amount: number | null;
  discount_percentage: number | null;
  final_price: number | null;
  work_order_service_id: string | null;
  work_order_id: string | null;
  mechanic_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PartPriceHistory {
  id: string;
  organization_id: string;
  part_name: string | null;
  part_number: string | null;
  vehicle_id: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  quantity: number | null;
  unit_price: number | null;
  discount_amount: number | null;
  discount_percentage: number | null;
  final_price: number | null;
  work_order_part_id: string | null;
  work_order_id: string | null;
  mechanic_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WorkOrderNote {
  id: string;
  organization_id: string;
  work_order_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

// Composite types for work order display
export interface WorkOrderRow extends WorkOrder {
  customer_name: string | null;
  vehicle_plate: string | null;
  mechanic_name: string | null;
}

export interface WorkOrderDetail extends WorkOrder {
  customer: Customer | null;
  vehicle: Vehicle | null;
  mechanic: { id: string; full_name: string | null } | null;
  services: WorkOrderService[];
  parts: WorkOrderPart[];
  status_history: WorkOrderStatusHistory[];
}

// ============================================================
// Phase 2: Vehicle Models + Parts Catalog Types
// Added 2026-05-11
// ============================================================

export interface VehicleModel {
  id: string;
  organization_id: string;
  make: string;
  model: string;
  generation: string | null;
  year_start: number | null;
  year_end: number | null;
  engine: string | null;
  body_type: string | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PartsCatalog {
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
  last_purchase_price: number | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface VehicleModelPart {
  id: string;
  organization_id: string;
  vehicle_model_id: string;
  part_id: string;
  specific_price: number | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Composite type: vehicle model with its parts and pricing
export interface VehicleModelWithParts extends VehicleModel {
  parts: (PartsCatalog & { specific_price: number | null })[];
}

// Composite type: part with which vehicle models it fits
export interface PartWithVehicleModels extends PartsCatalog {
  vehicle_models: (VehicleModel & { specific_price: number | null })[];
}

// ============================================================
// Phase 2: Inventory Control Types
// Added 2026-05-12
// ============================================================

export type InventoryMovementType =
  | "purchase"
  | "sale"
  | "adjustment"
  | "transfer_in"
  | "transfer_out"
  | "return"
  | "waste";

export interface InventoryMovement {
  id: string;
  organization_id: string;
  branch_id: string | null;
  part_id: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost: number | null;
  unit_price: number | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  branch_id: string | null;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  branch_id: string | null;
  supplier_id: string | null;
  order_number: string;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  order_date: string;
  expected_at: string | null;
  received_at: string | null;
  notes: string | null;
  total_amount: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  organization_id: string;
  purchase_order_id: string;
  part_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockThreshold {
  id: string;
  organization_id: string;
  branch_id: string | null;
  part_id: string;
  minimum_quantity: number;
  maximum_quantity: number;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryBalance {
  organization_id: string;
  branch_id: string | null;
  part_id: string;
  part_name: string;
  part_number: string | null;
  category: string | null;
  unit: string;
  default_price: number | null;
  quantity_on_hand: number;
  last_movement_at: string | null;
}

// ----------------------------------------------------------
// Phase 1 — Insert Types
// ----------------------------------------------------------

export type CustomerInsert = Omit<
  Customer,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type VehicleInsert = Omit<
  Vehicle,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type VehicleOwnerInsert = Omit<VehicleOwner, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ServiceCatalogInsert = Omit<
  ServiceCatalog,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type WorkOrderInsert = Omit<
  WorkOrder,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type WorkOrderServiceInsert = Omit<
  WorkOrderService,
  "id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

export type WorkOrderPartInsert = Omit<WorkOrderPart, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type WorkOrderStatusHistoryInsert = Omit<
  WorkOrderStatusHistory,
  "id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

export type MechanicAssignmentInsert = Omit<
  MechanicAssignment,
  "id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

// ----------------------------------------------------------
// Phase 1 — Update Types
// ----------------------------------------------------------

export type CustomerUpdate = Partial<
  Omit<Customer, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type VehicleUpdate = Partial<
  Omit<Vehicle, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type VehicleOwnerUpdate = Partial<
  Omit<VehicleOwner, "id" | "created_at" | "created_by">
>;

export type ServiceCatalogUpdate = Partial<
  Omit<ServiceCatalog, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type WorkOrderUpdate = Partial<
  Omit<WorkOrder, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

// ----------------------------------------------------------
// Phase 2 — Insert Types
// ----------------------------------------------------------

export type VehicleModelInsert = Omit<
  VehicleModel,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PartsCatalogInsert = Omit<
  PartsCatalog,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  name_mn?: string | null;
};

export type VehicleModelPartInsert = Omit<
  VehicleModelPart,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// ----------------------------------------------------------
// Phase 2: Inventory — Insert Types
// ----------------------------------------------------------

export type InventoryMovementInsert = {
  organization_id: string;
  branch_id?: string | null;
  part_id: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost?: number | null;
  unit_price?: number | null;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  created_by?: string | null;
  id?: string;
  created_at?: string;
};

export type SupplierInsert = Omit<
  Supplier,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PurchaseOrderInsert = Omit<
  PurchaseOrder,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PurchaseOrderItemInsert = Omit<
  PurchaseOrderItem,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type StockThresholdInsert = Omit<
  StockThreshold,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// ----------------------------------------------------------
// Phase 2 — Update Types
// ----------------------------------------------------------

export type VehicleModelUpdate = Partial<
  Omit<VehicleModel, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type PartsCatalogUpdate = Partial<
  Omit<PartsCatalog, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
  name_mn?: string | null;
};

export type VehicleModelPartUpdate = Partial<
  Omit<VehicleModelPart, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

// ----------------------------------------------------------
// Phase 2: Inventory — Update Types
// ----------------------------------------------------------

export type SupplierUpdate = Partial<
  Omit<Supplier, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type PurchaseOrderUpdate = Partial<
  Omit<PurchaseOrder, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type PurchaseOrderItemUpdate = Partial<
  Omit<PurchaseOrderItem, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type StockThresholdUpdate = Partial<
  Omit<StockThreshold, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

// ----------------------------------------------------------
// Insert Types (omit generated columns)
// ----------------------------------------------------------

export type OrganizationInsert = Omit<
  Organization,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type BranchInsert = Omit<
  Branch,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};

export type RoleInsert = Omit<
  Role,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PermissionInsert = Omit<
  Permission,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RolePermissionInsert = RolePermission;

export type OrganizationUserInsert = Omit<OrganizationUser, "joined_at"> & {
  joined_at?: string;
};

export type AuditLogInsert = Partial<Omit<AuditLog, "id" | "created_at">> & {
  organization_id: string;
  user_id: string;
  action: string;
  table_name: string;
  id?: string;
  created_at?: string;
};

export type SubscriptionPlanInsert = Omit<
  SubscriptionPlan,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type FeatureFlagInsert = Omit<
  FeatureFlag,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationSettingsInsert = Omit<
  OrganizationSettings,
  "created_at" | "updated_at"
> & {
  created_at?: string;
  updated_at?: string;
};

// ----------------------------------------------------------
// Update Types (all fields optional except PKs)
// ----------------------------------------------------------

export type OrganizationUpdate = Partial<
  Omit<Organization, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type BranchUpdate = Partial<
  Omit<Branch, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at">> & {
  updated_at?: string;
};

export type RoleUpdate = Partial<
  Omit<Role, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type PermissionUpdate = Partial<
  Omit<Permission, "id" | "created_at" | "created_by">
> & {
  updated_at?: string;
};

export type OrganizationUserUpdate = Partial<
  Omit<OrganizationUser, "organization_id" | "user_id" | "joined_at">
>;

export type SubscriptionPlanUpdate = Partial<
  Omit<SubscriptionPlan, "id" | "created_at">
> & {
  updated_at?: string;
};

export type FeatureFlagUpdate = Partial<
  Omit<FeatureFlag, "id" | "created_at">
> & {
  updated_at?: string;
};

export type OrganizationSettingsUpdate = Partial<
  Omit<OrganizationSettings, "organization_id" | "created_at">
> & {
  updated_at?: string;
};

// ----------------------------------------------------------
// Supabase Database type (for typed client)
// ----------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      branches: {
        Row: Branch;
        Insert: BranchInsert;
        Update: BranchUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      roles: {
        Row: Role;
        Insert: RoleInsert;
        Update: RoleUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      permissions: {
        Row: Permission;
        Insert: PermissionInsert;
        Update: PermissionUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      role_permissions: {
        Row: RolePermission;
        Insert: RolePermissionInsert;
        Update: RolePermission;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      organization_users: {
        Row: OrganizationUser;
        Insert: OrganizationUserInsert;
        Update: OrganizationUserUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditLogInsert;
        Update: AuditLogInsert; // append-only — updates not allowed at app layer
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: SubscriptionPlanInsert;
        Update: SubscriptionPlanUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      feature_flags: {
        Row: FeatureFlag;
        Insert: FeatureFlagInsert;
        Update: FeatureFlagUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      organization_settings: {
        Row: OrganizationSettings;
        Insert: OrganizationSettingsInsert;
        Update: OrganizationSettingsUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      vehicles: {
        Row: Vehicle;
        Insert: VehicleInsert;
        Update: VehicleUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      vehicle_owners: {
        Row: VehicleOwner;
        Insert: VehicleOwnerInsert;
        Update: VehicleOwnerUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      service_catalog: {
        Row: ServiceCatalog;
        Insert: ServiceCatalogInsert;
        Update: ServiceCatalogUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      work_orders: {
        Row: WorkOrder;
        Insert: WorkOrderInsert;
        Update: WorkOrderUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      work_order_services: {
        Row: WorkOrderService;
        Insert: WorkOrderServiceInsert;
        Update: WorkOrderService;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      work_order_parts: {
        Row: WorkOrderPart;
        Insert: WorkOrderPartInsert;
        Update: WorkOrderPart;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      work_order_status_history: {
        Row: WorkOrderStatusHistory;
        Insert: WorkOrderStatusHistoryInsert;
        Update: WorkOrderStatusHistory;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      mechanic_assignments: {
        Row: MechanicAssignment;
        Insert: MechanicAssignmentInsert;
        Update: MechanicAssignment;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      service_price_history: {
        Row: ServicePriceHistory;
        Insert: {
          id?: string;
          organization_id: string;
          service_catalog_id?: string | null;
          vehicle_id?: string | null;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          service_name?: string | null;
          quantity?: number | null;
          unit_price?: number | null;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          final_price?: number | null;
          work_order_service_id?: string | null;
          work_order_id?: string | null;
          mechanic_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      part_price_history: {
        Row: PartPriceHistory;
        Insert: {
          id?: string;
          organization_id: string;
          part_name?: string | null;
          part_number?: string | null;
          vehicle_id?: string | null;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          quantity?: number | null;
          unit_price?: number | null;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          final_price?: number | null;
          work_order_part_id?: string | null;
          work_order_id?: string | null;
          mechanic_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      work_order_notes: {
        Row: WorkOrderNote;
        Insert: {
          id?: string;
          organization_id: string;
          work_order_id: string;
          content: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      vehicle_models: {
        Row: VehicleModel;
        Insert: VehicleModelInsert;
        Update: VehicleModelUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      parts_catalog: {
        Row: PartsCatalog;
        Insert: PartsCatalogInsert;
        Update: PartsCatalogUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      vehicle_model_parts: {
        Row: VehicleModelPart;
        Insert: VehicleModelPartInsert;
        Update: VehicleModelPartUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      inventory_movements: {
        Row: InventoryMovement;
        Insert: InventoryMovementInsert;
        Update: Record<string, never>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      suppliers: {
        Row: Supplier;
        Insert: SupplierInsert;
        Update: SupplierUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      purchase_orders: {
        Row: PurchaseOrder;
        Insert: PurchaseOrderInsert;
        Update: PurchaseOrderUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      purchase_order_items: {
        Row: PurchaseOrderItem;
        Insert: PurchaseOrderItemInsert;
        Update: PurchaseOrderItemUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      stock_thresholds: {
        Row: StockThreshold;
        Insert: StockThresholdInsert;
        Update: StockThresholdUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      invoices: {
        Row: Invoice;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Payment, 'id' | 'created_at'>> & {
          created_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      invoice_payments: {
        Row: InvoicePayment;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
    };
    Views: {
      inventory_balances: {
        Row: InventoryBalance;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
    };
    Functions: {
      get_user_organizations: {
        Args: Record<string, never>;
        Returns: {
          organization_id: string;
          name: string;
          slug: string;
          branch_id: string | null;
          role_id: string | null;
          is_primary: boolean;
          has_bay_view_pin: boolean;
        }[];
      };
      get_user_organization_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      set_organization_bay_view_pin: {
        Args: {
          target_org_id: string;
          plain_pin: string;
        };
        Returns: boolean;
      };
      set_primary_organization: {
        Args: {
          target_org_id: string;
        };
        Returns: string;
      };
      verify_organization_bay_view_pin: {
        Args: {
          target_org_id: string;
          plain_pin: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      permission_action: PermissionAction;
      plan_type: PlanType;
      customer_type: CustomerType;
      fuel_type: FuelType;
      transmission_type: TransmissionType;
      drivetrain_type: DrivetrainType;
      body_type: BodyType;
      work_order_status: WorkOrderStatus;
      inventory_movement_type: InventoryMovementType;
      invoice_status: InvoiceStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
