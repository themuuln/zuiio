import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface LandingProductPreviewProps {
  appName: string;
  title: string;
  liveLabel: string;
  openJobsLabel: string;
  readyLabel: string;
  revenueLabel: string;
  workOrdersLabel: string;
  customersLabel: string;
  inventoryLabel: string;
  workOrderDetail: string;
  customerDetail: string;
  inventoryDetail: string;
  inProgressLabel: string;
  readyStatusLabel: string;
  awaitingLabel: string;
  viewAllLabel: string;
}

const SIDEBAR_ITEMS = [
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  BarChart3,
];

export function LandingProductPreview({
  appName,
  title,
  liveLabel,
  openJobsLabel,
  readyLabel,
  revenueLabel,
  workOrdersLabel,
  customersLabel,
  inventoryLabel,
  workOrderDetail,
  customerDetail,
  inventoryDetail,
  inProgressLabel,
  readyStatusLabel,
  awaitingLabel,
  viewAllLabel,
}: LandingProductPreviewProps) {
  const rows = [
    {
      icon: ClipboardList,
      label: workOrdersLabel,
      detail: workOrderDetail,
      status: inProgressLabel,
      statusClassName: "bg-primary/10 text-primary",
    },
    {
      icon: Users,
      label: customersLabel,
      detail: customerDetail,
      status: readyStatusLabel,
      statusClassName: "bg-emerald-500/10 text-emerald-600",
    },
    {
      icon: Package,
      label: inventoryLabel,
      detail: inventoryDetail,
      status: awaitingLabel,
      statusClassName: "bg-amber-500/10 text-amber-700",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
      <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/10">
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <ClipboardList className="size-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{appName}</p>
              <p className="text-[10px] text-muted-foreground">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-1 text-[10px] font-medium text-emerald-600">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {liveLabel}
          </div>
        </div>

        <div className="grid sm:grid-cols-[3.25rem_1fr]">
          <div className="hidden flex-col items-center gap-4 border-r bg-muted/10 py-5 sm:flex">
            {SIDEBAR_ITEMS.map((Icon, index) => (
              <div
                key={index}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  index === 0
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground/60",
                )}
              >
                <Icon className="size-4" />
              </div>
            ))}
          </div>

          <div className="min-w-0 p-4 sm:p-5">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Metric label={openJobsLabel} value="24" trend="+12%" />
              <Metric label={readyLabel} value="08" trend="+4%" />
              <Metric label={revenueLabel} value="₮4.8M" trend="+18%" />
            </div>

            <div className="mt-4 rounded-xl border bg-background">
              <div className="flex items-center justify-between border-b px-3.5 py-3">
                <p className="text-xs font-semibold text-foreground">
                  {workOrdersLabel}
                </p>
                <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </div>
              <div className="divide-y">
                {rows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 px-3.5 py-3"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-foreground">
                          {row.label}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {row.detail}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-1 text-[9px] font-medium",
                          row.statusClassName,
                        )}
                      >
                        {row.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/[0.06] px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span className="text-[10px] font-medium text-foreground">
                  {viewAllLabel}
                </span>
              </div>
              <Clock3 className="size-3.5 text-muted-foreground" />
            </div>
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
      <p className="truncate text-[10px] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-1">
        <p className="text-base font-semibold tracking-tight text-foreground">
          {value}
        </p>
        <span className="text-[9px] font-medium text-emerald-600">{trend}</span>
      </div>
    </div>
  );
}
