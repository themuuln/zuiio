import type {
  PartsCatalogItem,
  ServiceCatalog,
  WorkOrderDetail,
} from "@/lib/types";

/**
 * Price match quality tiers for fallback pricing memory.
 * - "exact": same make + same model as the current vehicle
 * - "same_make": same make, different model (same generation/family)
 * - "fallback": different make and model (closest available match)
 */
export type PriceMatchQuality = "exact" | "same_make" | "fallback";

export type PricingMemoryInfo = {
  /** The vehicle make this price was recorded on */
  last_make?: string | null;
  /** The vehicle model this price was recorded on */
  last_model?: string | null;
  /** How well this price matches the current vehicle */
  match_quality?: PriceMatchQuality | null;
};

// ── Catalog item types that accept both org and global items ──

export type CatalogServiceItem = Partial<ServiceCatalog> &
  PricingMemoryInfo & {
    id: string;
    name: string;
    name_mn?: string | null;
    default_price: number;
    last_price?: number | null;
    _source?: "org" | "global";
  };

export type CatalogPartItem = Partial<PartsCatalogItem> &
  PricingMemoryInfo & {
    id: string;
    name: string;
    name_mn?: string | null;
    default_price: number;
    last_price?: number | null;
    _source?: "org" | "global";
  };

// ── Hook param types ──

export interface UseDrawerDataParams {
  workOrderId: string | null;
  open: boolean;
}

export interface UseDrawerMutationsParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  onRefresh: () => void;
  push: (url: string) => void;
  onOpenChange: (open: boolean) => void;
}

// ── Data hook return type ──

export interface DrawerDataResult {
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  loading: boolean;
  error: string | null;
  hasLoadedOnce: boolean;
  orgIdRef: React.MutableRefObject<string | null>;
  fetchWo: (silent?: boolean, orgIdOverride?: string) => Promise<void>;
  catalog: CatalogServiceItem[];
  partsCatalog: CatalogPartItem[];
  lowStockMap: Record<string, { quantity: number; threshold: number }>;
  mechanics: Array<{ id: string; full_name: string }>;
}

// ── Props ──

export interface WorkOrderDetailDrawerProps {
  workOrderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  initialAction?: "add-service" | "add-part" | null;
  /** Branch filter for bay view cache key (optimistic drawer mutations) */
  branchFilter?: string;
  /**
   * Pre-built mutation hooks for mechanic/customer assignment.
   * When provided, the drawer uses these instead of raw fetch().
   */
  assignMechanicMutation?: {
    mutateAsync: (vars: { woId: string; mechanicId: string }) => Promise<void>;
  };
  assignCustomerMutation?: {
    mutateAsync: (
      vars: { woId: string; customerId: string | null; customerName?: string | null },
    ) => Promise<void>;
  };
}
