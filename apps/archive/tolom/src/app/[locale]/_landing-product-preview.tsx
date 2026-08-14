"use client";

import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TabKey =
  | "dashboard"
  | "workOrders"
  | "customers"
  | "inventory"
  | "reports";

const STATUS_STYLES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-700",
} as const;

type ListRow = {
  icon: typeof ClipboardList;
  label: string;
  status: string;
  statusClass: string;
};

type KpiRow = {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  trend: string;
};

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b px-3.5 py-3">
      <p className="truncate text-xs font-semibold text-foreground">{title}</p>
      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
    </div>
  );
}

function ListRowItem({ icon: Icon, label, status, statusClass }: ListRow) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </div>
      <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        {label}
      </p>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-1 text-[10px] font-medium",
          statusClass,
        )}
      >
        {status}
      </span>
    </div>
  );
}

function KpiRowItem({ icon: Icon, label, value, trend }: KpiRow) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </div>
      <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        {label}
      </p>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
        <span className="text-[10px] font-medium text-emerald-600">
          {trend}
        </span>
      </div>
    </div>
  );
}

export function LandingProductPreview() {
  const t = useTranslations("home");
  const appT = useTranslations("app");
  const [active, setActive] = useState<TabKey>("dashboard");

  const tabs = [
    {
      key: "dashboard",
      icon: LayoutDashboard,
      label: t("productPreviewTabDashboard"),
    },
    {
      key: "workOrders",
      icon: ClipboardList,
      label: t("productPreviewTabWorkOrders"),
    },
    { key: "customers", icon: Users, label: t("productPreviewTabCustomers") },
    { key: "inventory", icon: Package, label: t("productPreviewTabInventory") },
    { key: "reports", icon: BarChart3, label: t("productPreviewTabReports") },
  ] as const;

  const workOrderRows: ListRow[] = [
    {
      icon: ClipboardList,
      label: t("productPreviewWorkOrderDetail"),
      status: t("productPreviewInProgress"),
      statusClass: STATUS_STYLES.primary,
    },
    {
      icon: ClipboardList,
      label: t("productPreviewWo2"),
      status: t("productPreviewReadyStatus"),
      statusClass: STATUS_STYLES.success,
    },
    {
      icon: ClipboardList,
      label: t("productPreviewWo3"),
      status: t("productPreviewAwaiting"),
      statusClass: STATUS_STYLES.warning,
    },
  ];

  const customerRows: ListRow[] = [
    {
      icon: Users,
      label: t("productPreviewCustomerDetail"),
      status: t("productPreviewReadyStatus"),
      statusClass: STATUS_STYLES.success,
    },
    {
      icon: Users,
      label: t("productPreviewCustomer2"),
      status: t("productPreviewInProgress"),
      statusClass: STATUS_STYLES.primary,
    },
    {
      icon: Users,
      label: t("productPreviewCustomer3"),
      status: t("productPreviewAwaiting"),
      statusClass: STATUS_STYLES.warning,
    },
  ];

  const inventoryRows: ListRow[] = [
    {
      icon: Package,
      label: t("productPreviewInventoryDetail"),
      status: t("productPreviewReadyStatus"),
      statusClass: STATUS_STYLES.success,
    },
    {
      icon: Package,
      label: t("productPreviewInventory2"),
      status: t("productPreviewReadyStatus"),
      statusClass: STATUS_STYLES.success,
    },
    {
      icon: Package,
      label: t("productPreviewInventory3"),
      status: t("productPreviewAwaiting"),
      statusClass: STATUS_STYLES.warning,
    },
  ];

  const reportRows: KpiRow[] = [
    {
      icon: TrendingUp,
      label: t("productPreviewRevenue"),
      value: "₮4.8M",
      trend: "+18%",
    },
    {
      icon: ClipboardList,
      label: t("productPreviewOpenJobs"),
      value: "24",
      trend: "+12%",
    },
    {
      icon: CheckCircle2,
      label: t("productPreviewReady"),
      value: "08",
      trend: "+4%",
    },
  ];

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    prefix: string,
  ) => {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActive(tabs[next].key);
    document.getElementById(`${prefix}${tabs[next].key}`)?.focus();
  };

  const renderTabButtons = (mobile: boolean) =>
    tabs.map(({ key, icon: Icon, label }) => {
      const selected = active === key;
      const prefix = mobile ? "preview-tab-m-" : "preview-tab-";
      return (
        <button
          key={key}
          type="button"
          role="tab"
          id={`${prefix}${key}`}
          aria-selected={selected}
          aria-controls={`preview-panel-${key}`}
          tabIndex={selected ? 0 : -1}
          onClick={() => setActive(key)}
          onKeyDown={(e) =>
            handleTabKeyDown(
              e,
              tabs.findIndex((x) => x.key === key),
              prefix,
            )
          }
          className={cn(
            "flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            mobile ? "rounded-full" : "rounded-lg",
            selected
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground/60 hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </button>
      );
    });

  const renderPanel = (key: TabKey) => {
    switch (key) {
      case "dashboard":
        return (
          <>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Metric
                label={t("productPreviewOpenJobs")}
                value="24"
                trend="+12%"
              />
              <Metric label={t("productPreviewReady")} value="08" trend="+4%" />
              <Metric
                label={t("productPreviewRevenue")}
                value="₮4.8M"
                trend="+18%"
              />
            </div>

            <div className="mt-4 rounded-xl border bg-background">
              <PanelHeader title={t("productPreviewTitle")} />
              <div className="divide-y">
                {[
                  {
                    icon: ClipboardList,
                    label: t("featureWorkOrders"),
                    detail: t("productPreviewWorkOrderDetail"),
                    status: t("productPreviewInProgress"),
                    statusClass: STATUS_STYLES.primary,
                  },
                  {
                    icon: Users,
                    label: t("featureCustomers"),
                    detail: t("productPreviewCustomerDetail"),
                    status: t("productPreviewReadyStatus"),
                    statusClass: STATUS_STYLES.success,
                  },
                  {
                    icon: Package,
                    label: t("featureInventory"),
                    detail: t("productPreviewInventoryDetail"),
                    status: t("productPreviewAwaiting"),
                    statusClass: STATUS_STYLES.warning,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 px-3.5 py-3"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <row.icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {row.label}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {row.detail}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-1 text-[10px] font-medium",
                        row.statusClass,
                      )}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/[0.06] px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span className="text-[11px] font-medium text-foreground">
                  {t("productPreviewViewAll")}
                </span>
              </div>
              <Clock3 className="size-3.5 text-muted-foreground" />
            </div>
          </>
        );
      case "workOrders":
        return (
          <>
            <div className="rounded-xl border bg-background">
              <PanelHeader title={t("featureWorkOrders")} />
              <div className="divide-y">
                {workOrderRows.map((row) => (
                  <ListRowItem key={row.label} {...row} />
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/[0.06] px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span className="text-[11px] font-medium text-foreground">
                  {t("productPreviewViewAll")}
                </span>
              </div>
              <Clock3 className="size-3.5 text-muted-foreground" />
            </div>
          </>
        );
      case "customers":
        return (
          <div className="rounded-xl border bg-background">
            <PanelHeader title={t("featureCustomers")} />
            <div className="divide-y">
              {customerRows.map((row) => (
                <ListRowItem key={row.label} {...row} />
              ))}
            </div>
          </div>
        );
      case "inventory":
        return (
          <div className="rounded-xl border bg-background">
            <PanelHeader title={t("featureInventory")} />
            <div className="divide-y">
              {inventoryRows.map((row) => (
                <ListRowItem key={row.label} {...row} />
              ))}
            </div>
          </div>
        );
      case "reports":
        return (
          <div className="rounded-xl border bg-background">
            <PanelHeader title={t("featureAnalytics")} />
            <div className="divide-y">
              {reportRows.map((row) => (
                <KpiRowItem key={row.label} {...row} />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-4 rounded-[2rem] blur-3xl">
        <div className="absolute inset-0 rounded-[2rem] bg-[var(--brand-violet-glow)]" />
        <div className="absolute right-0 bottom-0 size-1/2 rounded-[2rem] bg-[var(--brand-teal-glow)]" />
      </div>
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="h-1 bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-teal)]" />
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <ClipboardList className="size-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {appT("name")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("productPreviewTitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-1 text-[11px] font-medium text-emerald-600">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {t("productPreviewLive")}
          </div>
        </div>

        {/* Mobile tab strip */}
        <div
          role="tablist"
          aria-label={t("productPreviewTablistLabel")}
          className="flex items-center justify-center gap-1 border-b bg-muted/10 px-3 py-2 sm:hidden"
        >
          {renderTabButtons(true)}
        </div>

        <div className="grid sm:grid-cols-[3.25rem_1fr]">
          <div
            role="tablist"
            aria-label={t("productPreviewTablistLabel")}
            className="hidden flex-col items-center gap-4 border-r bg-muted/10 py-5 sm:flex"
          >
            {renderTabButtons(false)}
          </div>

          <div className="grid min-w-0">
            {tabs.map(({ key, label }) => (
              <div
                key={key}
                id={`preview-panel-${key}`}
                role="tabpanel"
                aria-label={label}
                className={cn(
                  "min-w-0 p-4 [grid-area:1/1] sm:p-5",
                  active === key
                    ? "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
                    : "invisible",
                )}
              >
                {renderPanel(key)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-1">
        <p className="text-base font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
        <span className="text-[10px] font-medium text-emerald-600">
          {trend}
        </span>
      </div>
    </div>
  );
}
