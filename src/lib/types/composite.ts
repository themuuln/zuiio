/**
 * Composite types — extend core DB types with related entity data.
 * Used by detail queries and API responses.
 */
import type {
  Appointment,
  Customer,
  DiagnosisLabel,
  Estimate,
  EstimateItem,
  InventoryBalance,
  Invoice,
  InvoiceItem,
  InvoicePayment,
  Vehicle,
  WorkOrder,
  WorkOrderHelper,
  WorkOrderPart,
  WorkOrderService,
  WorkOrderStatusHistory,
} from "./core";

// ── Work Order Composites ──────────────────────────────────────

export interface WorkOrderServiceHistoryEntry {
  work_order_id: string;
  status: string;
  created_at: string;
  complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  total: number;
  mechanic_name: string | null;
  helpers: { id: string; full_name: string | null }[];
  services: { name: string; price: number }[];
}

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
  loss_reason?: string | null;
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
  helpers: (WorkOrderHelper & { full_name?: string | null })[];
  services: WorkOrderService[];
  parts: WorkOrderPart[];
  status_history: WorkOrderStatusHistory[];
  service_history: WorkOrderServiceHistoryEntry[];
  diagnosis_label?: DiagnosisLabel | null;
  invoice_public_token?: string | null;
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

export interface WorkOrderRow extends WorkOrder {
  mechanic_name: string | null;
}

// ── Vehicle Composites ─────────────────────────────────────────

export interface VehicleWithOwner extends Vehicle {
  owner_name: string | null;
  owner_phone: string | null;
}

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

// ── Customer Composites ────────────────────────────────────────

export interface CustomerWithVehicleCount extends Customer {
  vehicle_count: number;
}

// ── Invoice Composites ─────────────────────────────────────────

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
  payments: InvoicePayment[];
}

// ── Appointment Composites ───────────────────────────────────

export interface AppointmentDetail extends Appointment {
  customer: Customer | null;
  vehicle: Vehicle | null;
  estimate: {
    id: string;
    estimate_number: string;
    status: string;
    grand_total: number;
  } | null;
  mechanic: { id: string; full_name: string | null } | null;
}

// ── Estimate Composites ────────────────────────────────────────

export interface EstimateDetail extends Estimate {
  customer: Customer | null;
  vehicle: Vehicle | null;
  items: EstimateItem[];
  converted_work_order: {
    id: string;
    status: string;
    total: number;
  } | null;
  appointment: {
    id: string;
    title: string;
    scheduled_at: string;
  } | null;
}

// ── Inventory Composites ───────────────────────────────────────

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
