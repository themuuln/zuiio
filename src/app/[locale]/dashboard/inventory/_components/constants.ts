import { Building2, ClipboardList, Package, Truck } from "lucide-react";

// ── Tab type ─────────────────────────────────────────────────

export type Tab = "parts" | "movements" | "suppliers" | "purchase-orders";

// ── Sorting ──────────────────────────────────────────────────

export type SortKey = "name" | "category" | "price" | "stock" | "popularity";

// ── Movement labels ──────────────────────────────────────────

export const MOVEMENT_LABELS: Record<string, string> = {
  purchase: "Purchase",
  sale: "Sale",
  adjustment: "Adjustment",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  return: "Return",
  waste: "Waste",
};

export const MOVEMENT_COLORS: Record<string, string> = {
  purchase: "text-green-600 bg-green-50",
  sale: "text-red-600 bg-red-50",
  adjustment: "text-blue-600 bg-blue-50",
  transfer_in: "text-purple-600 bg-purple-50",
  transfer_out: "text-purple-600 bg-purple-50",
  return: "text-amber-600 bg-amber-50",
  waste: "text-gray-600 bg-gray-50",
};

// ── PO Status labels ─────────────────────────────────────────

export const PO_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  ordered: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ordered: "Ordered",
  partial: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};

// ── Movement type filter chips ───────────────────────────────

export const MOVEMENT_FILTER_TYPES = [
  "",
  "purchase",
  "sale",
  "adjustment",
  "return",
  "waste",
] as const;

// ── Tab config ───────────────────────────────────────────────

export function getTabs(t: (key: string) => string): {
  key: Tab;
  label: string;
  icon: typeof Package;
}[] {
  return [
    { key: "parts", label: t("tabParts"), icon: Package },
    { key: "movements", label: t("tabMovements"), icon: ClipboardList },
    { key: "suppliers", label: t("tabSuppliers"), icon: Building2 },
    { key: "purchase-orders", label: t("tabPurchaseOrders"), icon: Truck },
  ];
}

// ── Helpers ──────────────────────────────────────────────────

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("mn-MN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
