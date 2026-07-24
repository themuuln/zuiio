/**
 * Inventory and parts domain types.
 */
import type { InventoryMovementType } from "./core";

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
  image_url: string | null;
  location: string | null;
  is_active: boolean;
  popularity_score?: number;
  global_part_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePartParams {
  name?: string;
  name_mn?: string;
  part_number?: string;
  category?: string;
  description?: string;
  unit?: string;
  default_price?: number;
  purchase_price?: number;
  image_url?: string | null;
  location?: string;
  global_part_id?: string | null;
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
  image_url?: string | null;
  location?: string | null;
  is_active?: boolean;
  global_part_id?: string | null;
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
  branchId?: string | null;
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
  branchId?: string | null;
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
  branchId?: string | null;
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
  branchId?: string | null;
}

// ── Inventory Reports ────────────────────────────────────────────

export interface InventoryTurnover {
  cogs: number;
  averageInventoryValue: number;
  turnoverRate: number;
}

export interface UsageTrend {
  month: string;
  part_id: string;
  partName: string;
  category: string | null;
  quantity: number;
  totalAmount: number;
}

export interface SlowMovingItem {
  partId: string;
  partName: string | null;
  partNumber: string | null;
  quantity: number;
  category: string | null;
  lastMovementDate: string | null;
  daysSinceLastMove: number;
}

// ── Stock Transfers ─────────────────────────────────────────────

export type StockTransferStatus =
  | "pending"
  | "approved"
  | "in_transit"
  | "received"
  | "completed"
  | "cancelled";

/** StockTransferItem from DB + optional joined fields */
export type StockTransferItemRow = import("./core").StockTransferItem & {
  part_name?: string;
  part_number?: string | null;
  unit?: string;
  available_quantity?: number;
};

/** StockTransfer from DB + optional joined fields */
export type StockTransferRow = import("./core").StockTransfer & {
  from_branch_name?: string | null;
  to_branch_name?: string;
  created_by_name?: string | null;
  items?: StockTransferItemRow[];
  item_count?: number;
  total_cost?: number;
};

export interface CreateTransferParams {
  from_branch_id?: string | null;
  to_branch_id: string;
  notes?: string;
  items: Array<{
    part_id: string;
    quantity: number;
    unit_cost?: number;
  }>;
}

export interface UpdateTransferParams {
  notes?: string;
  status?: StockTransferStatus;
}
