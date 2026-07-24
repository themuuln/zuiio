"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Paperclip,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineItemRow,
  TotalsSummary,
} from "@/components/work-orders/line-items";

import { workOrderKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useUpdateWorkOrderStatus,
  useWorkOrderDetail,
} from "@/lib/queries/use-work-order-detail";
import { cn, formatMNT } from "@/lib/utils";

// ─── Status helpers ───────────────────────────────────────────

const STATUS_NAMES: Record<string, string> = {
  New: "New",
  Diagnosing: "Diagnosing",
  "In Progress": "In Progress",
  "Ready for Pickup": "Ready for Pickup",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  New: "bg-info/15 text-info border-info/30",
  Diagnosing: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  "In Progress": "bg-orange-500/15 text-orange-500 border-orange-500/30",
  "Ready for Pickup": "bg-green-500/15 text-green-500 border-green-500/30",
  Completed: "bg-gray-500/15 text-gray-500 border-gray-500/30",
  Cancelled: "bg-red-500/15 text-red-500 border-red-500/30",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  New: "bg-info",
  Diagnosing: "bg-yellow-500",
  "In Progress": "bg-orange-500",
  "Ready for Pickup": "bg-green-500",
  Completed: "bg-gray-500",
  Cancelled: "bg-red-500",
};

const STATUS_OPTIONS = Object.keys(STATUS_NAMES).filter(
  (s) => s !== "Cancelled",
);

// ─── Duration helper ──────────────────────────────────────────

function formatDuration(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "<1m";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  if (hr < 24) return remMin > 0 ? `${hr}h ${remMin}m` : `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d ${hr % 24}h`;
}

function formatElapsed(startIso: string): string {
  const ms = Date.now() - new Date(startIso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

// ─── Props ────────────────────────────────────────────────────

interface WorkOrderDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
}

// ─── Collapsible section ──────────────────────────────────────

function CollapsibleLineItems({
  label,
  count,
  total,
  items,
  renderItem,
}: {
  label: string;
  count: number;
  total: number;
  items: unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-card/40">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-xs"
      >
        <span className="flex items-center gap-2 font-semibold text-muted-foreground">
          {label}
          <span className="text-[10px] font-normal tabular-nums text-muted-foreground/50">
            ({count})
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="tabular-nums font-medium">{formatMNT(total)}</span>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {count > 0 ? (
            <div className="-mx-1 border-t border-border/40 divide-y">
              {items.map((item, idx) => renderItem(item, idx))}
              <div className="flex justify-between px-3 py-2 text-xs font-medium">
                <span className="text-muted-foreground">{label} Total</span>
                <span className="tabular-nums">{formatMNT(total)}</span>
              </div>
            </div>
          ) : (
            <p className="px-3 pb-2 text-xs text-muted-foreground">
              No {label.toLowerCase()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────

export function WorkOrderDetailSheet({
  open,
  onOpenChange,
  workOrderId,
}: WorkOrderDetailSheetProps) {
  const t = useTranslations("workOrderDetail");
  const queryClient = useQueryClient();
  const { data: orgData } = useCurrentOrg();
  const orgId = orgData?.orgId;

  const { data: wo, isPending, error } = useWorkOrderDetail(orgId, workOrderId);

  const updateStatus = useUpdateWorkOrderStatus(orgId);

  const handleStatusChange = (newStatus: string) => {
    if (!orgId) return;
    updateStatus.mutate(
      { woId: workOrderId, status: newStatus },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: workOrderKeys.all(orgId),
          });
          toast.success(`${t("statusChanged")}: ${newStatus}`);
        },
        onError: (err: Error) => {
          toast.error(err.message);
        },
      },
    );
  };

  // ── Loading state ──────────────────────────────────────────
  if (isPending || !wo) {
    return (
      <DetailDrawer open={open} onOpenChange={onOpenChange}>
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            <Skeleton className="h-5 w-48" />
          </DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DetailDrawer.Body>
      </DetailDrawer>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error || !orgId) {
    return (
      <DetailDrawer open={open} onOpenChange={onOpenChange}>
        <DetailDrawer.Header>
          <DetailDrawer.Title>Error</DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <p className="text-sm text-muted-foreground">
            {error?.message ?? "Work order not found"}
          </p>
        </DetailDrawer.Body>
      </DetailDrawer>
    );
  }

  // ── Computed values ────────────────────────────────────────
  const servicesTotal = (wo.services ?? []).reduce(
    (sum, s) => sum + Number(s.final_price),
    0,
  );
  const partsTotal = (wo.parts ?? []).reduce(
    (sum, p) => sum + Number(p.final_price),
    0,
  );
  const grandTotal = servicesTotal + partsTotal - Number(wo.discount_total);

  // Status history: last 4 entries, sorted newest first
  const statusHistory = (wo.status_history ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 4);

  const serviceCount = (wo.services ?? []).length;
  const partCount = (wo.parts ?? []).length;
  const attachmentCount = (wo.attachments ?? []).filter(
    (a) => !a.deleted_at,
  ).length;

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange}>
      {/* ── Header ──────────────────────────────────────────── */}
      <DetailDrawer.Header
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                badgeVariants({ variant: "outline" }),
                "gap-1.5 cursor-pointer hover:opacity-80 transition-opacity",
                STATUS_COLORS[wo.status] ??
                  "bg-gray-500/15 text-gray-500 border-gray-500/30",
              )}
            >
              {wo.status}
              <ArrowUpDown className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuGroup>
                {STATUS_OPTIONS.flatMap((s) =>
                  s !== wo.status
                    ? [
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          disabled={updateStatus.isPending}
                        >
                          {s}
                        </DropdownMenuItem>,
                      ]
                    : [],
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <DetailDrawer.Title>
          <span className="font-mono">#{workOrderId.slice(0, 8)}</span>
        </DetailDrawer.Title>
        <DetailDrawer.Description>
          {wo.bay_number != null && <span>Bay {wo.bay_number}</span>}
          {wo.bay_number != null && wo.started_at && (
            <span className="mx-1.5 text-muted-foreground/40">·</span>
          )}
          {wo.started_at && <span>{formatElapsed(wo.started_at)}</span>}
          {!wo.bay_number && !wo.started_at && <span>&nbsp;</span>}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      {/* ── Body ────────────────────────────────────────────── */}
      <DetailDrawer.Body className="flex flex-col gap-4">
        {/* Status Timeline */}
        {statusHistory.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto px-1 py-1">
            {statusHistory
              .slice()
              .reverse()
              .map((entry, idx, arr) => {
                const isLast = idx === arr.length - 1;
                const nextEntry = arr[idx + 1];
                const duration = nextEntry?.created_at
                  ? formatDuration(entry.created_at, nextEntry.created_at)
                  : null;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-1 shrink-0"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "size-2 rounded-full",
                            isLast
                              ? (STATUS_DOT_COLORS[entry.status] ??
                                  "bg-gray-400")
                              : "bg-muted-foreground/30",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[11px] whitespace-nowrap",
                            isLast
                              ? "font-medium text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {entry.status}
                        </span>
                      </div>
                      {duration && (
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                          {duration}
                        </span>
                      )}
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="w-4 h-px bg-border mx-0.5 mt-[-10px]" />
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Complaint + Diagnosis */}
        {(wo.complaint || wo.diagnosis) && (
          <div className="rounded-xl border border-border/60 bg-card/40 p-3 flex flex-col gap-2.5">
            {wo.complaint && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Complaint
                </span>
                <p className="text-sm text-foreground/80">{wo.complaint}</p>
              </div>
            )}
            {wo.diagnosis && (
              <>
                {wo.complaint && <Separator className="bg-border/40" />}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Diagnosis
                    {wo.diagnosis_label?.name && (
                      <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/60">
                        · {wo.diagnosis_label.name}
                      </span>
                    )}
                  </span>
                  <p className="text-sm text-foreground/80">{wo.diagnosis}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Team */}
        {(wo.mechanic || (wo.helpers ?? []).length > 0) && (
          <div className="flex items-center gap-2 text-sm">
            <Wrench className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Team:</span>
            {wo.mechanic?.full_name && (
              <span className="font-medium">{wo.mechanic.full_name}</span>
            )}
            {(wo.helpers ?? []).length > 0 && (
              <span className="text-muted-foreground">
                + {(wo.helpers ?? []).map((h) => h.full_name ?? "—").join(", ")}
              </span>
            )}
          </div>
        )}

        {/* Services (collapsible) */}
        <CollapsibleLineItems
          label="Services"
          count={serviceCount}
          total={servicesTotal}
          items={wo.services ?? []}
          renderItem={(svc) => {
            const s = svc as (typeof wo.services)[number];
            return (
              <LineItemRow
                key={s.id}
                name={s.service_name}
                finalPrice={Number(s.final_price)}
              />
            );
          }}
        />

        {/* Parts (collapsible) */}
        <CollapsibleLineItems
          label="Parts"
          count={partCount}
          total={partsTotal}
          items={wo.parts ?? []}
          renderItem={(part) => {
            const p = part as (typeof wo.parts)[number];
            return (
              <LineItemRow
                key={p.id}
                name={p.part_name}
                finalPrice={Number(p.final_price)}
              />
            );
          }}
        />

        {/* Totals */}
        <TotalsSummary
          servicesTotal={servicesTotal}
          partsTotal={partsTotal}
          grandTotal={grandTotal}
          discountTotal={Number(wo.discount_total)}
          serviceCount={serviceCount}
          partCount={partCount}
          nuatEnabled={wo.nuat_enabled ?? false}
          t={(key) => {
            const labels: Record<string, string> = {
              grandTotal: "Grand Total",
              services: "Services",
              parts: "Parts",
              discount: "Discount",
              totalToPay: "Total to Pay",
            };
            return labels[key] ?? key;
          }}
        />

        {/* Meta: attachments + dates */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {attachmentCount > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="size-3" />
              {attachmentCount} {attachmentCount === 1 ? "file" : "files"}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {new Date(wo.created_at).toLocaleDateString()}
          </span>
          {wo.started_at && (
            <span>→ {new Date(wo.started_at).toLocaleDateString()}</span>
          )}
          {wo.completed_at && (
            <span>→ {new Date(wo.completed_at).toLocaleDateString()}</span>
          )}
        </div>
      </DetailDrawer.Body>

      {/* ── Footer ──────────────────────────────────────────── */}
      <DetailDrawer.Footer className="flex-row items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground truncate">
          {wo.mechanic?.full_name ?? "No mechanic"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.open(`/dashboard/work-orders/${workOrderId}`, "_blank");
          }}
        >
          <FileText className="size-3.5 mr-1.5" />
          Open Full Page
          <ChevronRight className="size-3.5 ml-1" />
        </Button>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
