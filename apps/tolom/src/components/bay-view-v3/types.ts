// ─── Bay Status ───────────────────────────────────────────
// Status drives the entire card: color, actions, and visual weight.

export const BAY_STATUSES = [
  "empty",
  "in-progress",
  "waiting",
  "ready-for-pickup",
] as const;

export type BayStatus = (typeof BAY_STATUSES)[number];

export const BAY_STATUS_META: Record<
  BayStatus,
  { label: string; color: string; bg: string; ring: string; icon: string }
> = {
  empty: {
    label: "Хоосон",
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    ring: "ring-border",
    icon: "○",
  },
  "in-progress": {
    label: "Ажиллаж байна",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    ring: "ring-blue-200 dark:ring-blue-800",
    icon: "●",
  },
  waiting: {
    label: "Хүлээж байна",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-200 dark:ring-amber-800",
    icon: "◉",
  },
  "ready-for-pickup": {
    label: "Бэлэн",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    icon: "✓",
  },
};

// ─── Domain Types ─────────────────────────────────────────

export interface Vehicle {
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
}

export interface Mechanic {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export type ServiceStatus = "pending" | "in-progress" | "completed";

export interface Service {
  id: string;
  name: string;
  status: ServiceStatus;
  price: number;
}

export interface Bay {
  id: string;
  number: number;
  status: BayStatus;
  vehicle: Vehicle | null;
  mechanics: Mechanic[];
  services: Service[];
  workOrderId: string | null;
  startedAt: string | null;
  estimatedMinutes: number | null;
  elapsedMinutes: number;
  notes: string;
}

// ─── KPI ──────────────────────────────────────────────────

export interface BayKPI {
  label: string;
  value: number | string;
  trend?: { value: number; direction: "up" | "down" | "flat" };
  icon: string;
}

// ─── Filter ───────────────────────────────────────────────

export type BayFilter = BayStatus | "all";
