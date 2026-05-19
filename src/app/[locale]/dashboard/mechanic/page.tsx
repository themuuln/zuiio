"use client";

import {
  CheckCircle2,
  ClipboardList,
  Coins,
  Users,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { cn, formatCurrency, formatMNT } from "@/lib/utils";
import dynamic from "next/dynamic";

const MechanicTrendChart = dynamic(
  () => import("../_charts").then((m) => m.MechanicTrendChart),
  { ssr: false },
);

// ── Types ──────────────────────────────────────────

interface MechanicEodSummary {
  mechanic_id: string;
  mechanic_name: string;
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
}

interface WorkOrderRow {
  id: string;
  status: string;
  description: string | null;
  total: number;
  customer_name: string | null;
  vehicle_plate: string | null;
  created_at: string;
}

interface MechanicItem {
  id: string;
  full_name: string | null;
}

// ── Status config ──────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; bar: string; dot: string; bg: string }
> = {
  New: {
    label: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
    bg: "hover:bg-blue-50/50 dark:hover:bg-blue-950/10",
  },
  Diagnosing: {
    label:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    bar: "bg-yellow-500",
    dot: "bg-yellow-500",
    bg: "hover:bg-yellow-50/50 dark:hover:bg-yellow-950/10",
  },
  "In Progress": {
    label:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    bar: "bg-orange-500",
    dot: "bg-orange-500 animate-pulse",
    bg: "hover:bg-orange-50/50 dark:hover:bg-orange-950/10",
  },
  "Ready for Pickup": {
    label:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    bar: "bg-green-500",
    dot: "bg-green-500 animate-pulse",
    bg: "hover:bg-green-50/50 dark:hover:bg-green-950/10",
  },
  Completed: {
    label:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    bar: "bg-gray-400",
    dot: "bg-gray-400",
    bg: "hover:bg-gray-50/50 dark:hover:bg-gray-950/10",
  },
  Cancelled: {
    label:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    bar: "bg-red-400",
    dot: "bg-red-400",
    bg: "hover:bg-red-50/50 dark:hover:bg-red-950/10",
  },
};

function getStatusCfg(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      label: "bg-muted text-muted-foreground",
      bar: "bg-border",
      dot: "bg-muted-foreground",
      bg: "hover:bg-muted/30",
    }
  );
}

// ── Helpers ────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const mins = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 60000,
  );
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

// ── KPI Card ───────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  accent: "blue" | "green" | "amber";
  loading?: boolean;
}) {
  const accentMap = {
    blue: {
      dot: "bg-blue-500",
      icon: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50/60 dark:bg-blue-950/20 ring-blue-500/15",
    },
    green: {
      dot: "bg-emerald-500",
      icon: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50/60 dark:bg-emerald-950/20 ring-emerald-500/15",
    },
    amber: {
      dot: "bg-amber-500",
      icon: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50/60 dark:bg-amber-950/20 ring-amber-500/15",
    },
  };
  const a = accentMap[accent];

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm shadow-black/5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      {/* Accent dot */}
      <span
        className={cn(
          "absolute right-3 top-3 size-1.5 rounded-full shadow-[0_0_6px] transition-opacity",
          a.dot,
          loading ? "opacity-30" : "opacity-100",
        )}
      />

      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors duration-200",
          a.bg,
          a.icon,
        )}
      >
        <Icon className="size-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-1.5 h-7 w-20" />
        ) : (
          <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight [font-feature-settings:'tnum']">
            {value}
          </p>
        )}
        {subtext && !loading && (
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Work Order Row ─────────────────────────────────

function WorkOrderRow({
  wo,
  onClick,
}: {
  wo: WorkOrderRow;
  onClick: () => void;
}) {
  const cfg = getStatusCfg(wo.status);
  const elapsed = useMemo(() => timeAgo(wo.created_at), [wo.created_at]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-all duration-150 last:border-b-0",
        cfg.bg,
        "hover:pl-5",
      )}
    >
      {/* Status color bar */}
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-0.5 transition-all duration-200",
          cfg.bar,
          "group-hover:w-1",
        )}
      />

      {/* Status dot */}
      <span
        className={cn(
          "size-2 shrink-0 rounded-full shadow-sm",
          cfg.dot,
        )}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {wo.customer_name ?? "—"}
          </span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground/50">
            {wo.vehicle_plate ?? ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <span className="truncate max-w-[200px]">
            {wo.description ?? "No description"}
          </span>
          <span className="text-[10px] text-muted-foreground/40 shrink-0">
            · {elapsed}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-sm font-semibold tabular-nums text-foreground/80">
          {formatMNT(wo.total ?? 0)}
        </span>
        <Badge
          className={cn(cfg.label, "border-0 text-[10px] font-semibold px-2 py-0.5")}
          variant="secondary"
        >
          {wo.status}
        </Badge>
      </div>
    </button>
  );
}

// ── MechanicDashboard ──────────────────────────────

function MechanicDashboard({
  userId,
  orgId,
  mechanicName,
  isAdminView,
}: {
  userId: string;
  orgId: string;
  mechanicName?: string | null;
  isAdminView: boolean;
}) {
  const t = useTranslations();
  const { push } = useRouter();
  const [eod, setEod] = useState<MechanicEodSummary | null>(null);
  const [assignedWos, setAssignedWos] = useState<WorkOrderRow[]>([]);
  const [trend, setTrend] = useState<{
    avgJobValue: number;
    jobsPerDay: number;
    weeklyTrend: { week: string; orders: number; revenue: number }[];
  } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const abort = new AbortController();

    setDataLoading(true);
    const eodUrl = `/api/organizations/${orgId}/reports?type=eod&date=${today}&mechanic=${userId}`;
    const woUrl = `/api/organizations/${orgId}/work-orders?mechanic=${userId}&status=In Progress&status=Diagnosing&status=New&status=Ready for Pickup`;
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
      .toISOString().split("T")[0];
    const trendUrl = `/api/organizations/${orgId}/reports?type=mechanic-trend&mechanic=${userId}&period=weekly&startDate=${eightWeeksAgo}&endDate=${today}`;

    const signal = abort.signal;

    Promise.all([
      fetch(eodUrl, { signal })
        .then((r) => r.json())
        .catch(() => ({ data: null })),
      fetch(woUrl, { signal })
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      fetch(trendUrl, { signal })
        .then((r) => r.json())
        .catch(() => ({ data: null })),
    ])
      .then(([eodJson, woJson, trendJson]) => {
        if (eodJson.data?.mechanics?.length > 0) {
          setEod(eodJson.data.mechanics[0]);
        }
        if (Array.isArray(woJson.data)) {
          setAssignedWos(woJson.data);
        }
        if (trendJson.data) {
          setTrend(trendJson.data);
        }
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));

    return () => abort.abort();
  }, [userId, orgId]);

  // Sort: active/pickup first, then new, then rest
  const sortedWos = useMemo(() => {
    const priority: Record<string, number> = {
      "In Progress": 0,
      "Ready for Pickup": 1,
      New: 2,
      Diagnosing: 3,
    };
    return assignedWos.toSorted(
      (a, b) =>
        (priority[a.status] ?? 99) - (priority[b.status] ?? 99),
    );
  }, [assignedWos]);

  return (
    <div className="tablet-touch flex flex-col gap-6">
      {/* ── Header (non-admin only — admin page renders its own) ── */}
      {!isAdminView && (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight">
                {mechanicName ?? t("nav.mechanic")}
              </h1>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-50/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px] shadow-emerald-500/60" />
                Live
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {now.toLocaleDateString("mn-MN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          icon={CheckCircle2}
          label={t("mechanic.completedToday")}
          value={eod?.work_orders_completed ?? 0}
          subtext={t("mechanic.servicesAndParts", {
            services: eod?.services_count ?? 0,
            parts: eod?.parts_count ?? 0,
          })}
          accent="green"
          loading={dataLoading}
        />
        <KpiCard
          icon={Coins}
          label={t("mechanic.revenueToday")}
          value={formatMNT(eod?.total_revenue ?? 0)}
          subtext={t("mechanic.fromCompleted")}
          accent="blue"
          loading={dataLoading}
        />
        <KpiCard
          icon={ClipboardList}
          label={t("mechanic.activeJobs")}
          value={assignedWos.length}
          subtext={
            isAdminView
              ? t("mechanic.assignedToMechanic")
              : t("mechanic.assignedToYou")
          }
          accent="amber"
          loading={dataLoading}
        />
      </div>

      {/* ── Efficiency KPIs ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard
          icon={Coins}
          label="Avg Job Value"
          value={trend ? formatMNT(trend.avgJobValue) : "—"}
          subtext="Revenue per completed order"
          accent="blue"
          loading={dataLoading}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Jobs Per Day"
          value={trend ? String(trend.jobsPerDay) : "—"}
          subtext="Average over selected period"
          accent="green"
          loading={dataLoading}
        />
      </div>

      {/* ── Trend Chart ── */}
      {trend?.weeklyTrend && trend.weeklyTrend.length > 0 && (
        <MechanicTrendChart data={trend.weeklyTrend} />
      )}

      {/* ── Work Orders ── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm shadow-black/5">
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <Wrench className="size-4 text-muted-foreground/60" />
          <span className="text-sm font-semibold">
            {isAdminView
              ? t("mechanic.mechanicWorkOrders")
              : t("mechanic.myWorkOrders")}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground/50">
            {sortedWos.length} job{sortedWos.length !== 1 ? "s" : ""}
          </span>
        </div>

        {dataLoading ? (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={`skeleton-${i}`}
                className="h-16 w-full rounded-none border-b border-border/30 last:border-b-0"
              />
            ))}
          </div>
        ) : sortedWos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground/60">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted/50">
              <ClipboardList className="size-10" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/80">
              {t("mechanic.noActiveWorkOrders")}
            </p>
          </div>
        ) : (
          <div className="divide-y-0">
            {sortedWos.map((wo) => (
              <WorkOrderRow
                key={wo.id}
                wo={wo}
                onClick={() =>
                  push(`/dashboard/work-orders/${wo.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────

export default function MechanicPage() {
  const t = useTranslations();
  const now = useClientNow();
  const {
    profile,
    loading: roleLoading,
    isMechanic,
    isAdmin,
  } = useCurrentUserRole();
  const [mechanics, setMechanics] = useState<MechanicItem[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState<
    string | null
  >(null);
  const [mechanicsLoading, setMechanicsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organizationId) return;
    const abort = new AbortController();

    if (!isAdmin) {
      setMechanicsLoading(false);
      return;
    }

    const orgId = profile.organizationId;
    fetch(`/api/organizations/${orgId}/reports?type=mechanics`, {
      signal: abort.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        const list: MechanicItem[] = json.data ?? [];
        setMechanics(list);
        if (list.length > 0) {
          setSelectedMechanicId(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setMechanicsLoading(false));

    return () => abort.abort();
  }, [profile?.organizationId, isAdmin]);

  if (roleLoading) {
    return (
      <div className="tablet-touch flex flex-col gap-6">
        <div>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-1.5 h-4 w-56" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
                <div key={`skeleton-${i}`} className="rounded-xl border border-border/60 bg-card p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-7 w-16" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isMechanic && !isAdmin && !roleLoading) {
    return (
      <div className="tablet-touch flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
          <Wrench className="size-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Mechanic Dashboard</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This view is for mechanics. Your current role is{" "}
          <strong>{profile?.roleName ?? "unknown"}</strong>.{"\n"}
          Ask your admin to assign you the Mechanic role to access this
          page.
        </p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <>
        {mechanicsLoading ? (
          <div className="tablet-touch flex flex-col gap-6">
            <div>
              <Skeleton className="h-7 w-44" />
              <Skeleton className="mt-1.5 h-4 w-56" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
            <div key={`skeleton-${i}`} className="rounded-xl border border-border/60 bg-card p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-7 w-16" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : mechanics.length === 0 ? (
          <div className="tablet-touch flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
              <Users className="size-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">
              {t("mechanic.noMechanics")}
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {t("mechanic.noMechanicsDesc")}
            </p>
          </div>
        ) : selectedMechanicId ? (
          <div className="tablet-touch flex flex-col gap-6">
            {/* Admin header with selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-semibold tracking-tight">
                    {mechanics.find((m) => m.id === selectedMechanicId)?.full_name ?? t("nav.mechanic")}
                  </h1>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-50/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px] shadow-emerald-500/60" />
                    Live
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground/60">
                  {now.toLocaleDateString("mn-MN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground/50 shrink-0" />
                <Select
                  value={selectedMechanicId}
                  onValueChange={(val) => setSelectedMechanicId(val)}
                >
                  <SelectTrigger className="w-[200px] h-9 text-xs">
                    <SelectValue>
                      {mechanics.find((m) => m.id === selectedMechanicId)?.full_name ??
                        t("mechanic.selectMechanic")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {mechanics.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.full_name ?? "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <MechanicDashboard
              userId={selectedMechanicId}
              orgId={profile?.organizationId!}
              mechanicName={mechanics.find((m) => m.id === selectedMechanicId)?.full_name}
              isAdminView
            />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <MechanicDashboard
      userId={profile?.id!}
      orgId={profile?.organizationId!}
      mechanicName={profile?.fullName}
      isAdminView={false}
    />
  );
}
