import type {
  PartsCatalogItem,
  ServiceCatalog,
  WorkOrderDetail,
} from "@/lib/types";

// ── Catalog item types that accept both org and global items ──

export type CatalogServiceItem = Partial<ServiceCatalog> & {
  id: string;
  name: string;
  name_mn?: string | null;
  default_price: number;
  _source?: "org" | "global";
};

export type CatalogPartItem = Partial<PartsCatalogItem> & {
  id: string;
  name: string;
  name_mn?: string | null;
  default_price: number;
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
}
