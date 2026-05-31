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
  waste: "Damage",
  disassembly: "Disassembly",
};

export const MOVEMENT_COLORS: Record<string, string> = {
  purchase:
    "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
  sale: "text-destructive bg-destructive/10",
  adjustment: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
  transfer_in:
    "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30",
  transfer_out:
    "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30",
  return: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
  waste: "text-muted-foreground bg-muted/50",
};

// ── PO Status labels ─────────────────────────────────────────

export const PO_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ordered: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
  partial:
    "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  received:
    "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
};

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ordered: "Ordered",
  partial: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};

// ── Movement type filter chips ───────────────────────────────

export const MOVEMENT_FILTERS = [
  { key: "all", label: "All" },
  { key: "purchase", label: "Purchase" },
  { key: "sale", label: "Sale" },
  { key: "adjustment", label: "Adjustment" },
  { key: "transfer_in", label: "Transfer In" },
  { key: "transfer_out", label: "Transfer Out" },
  { key: "return", label: "Return" },
  { key: "waste", label: "Damage" },
  { key: "disassembly", label: "Disassembly" },
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
