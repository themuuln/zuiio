"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Package,
  Send,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { type FilterChip, FilterChips } from "@/components/filter-chips";
import { ListToolbar } from "@/components/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import { useBranches } from "@/lib/queries/use-branches";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useTransfers } from "@/lib/queries/use-transfers";
import { useSelectedBranchId } from "@/lib/stores";
import type { StockTransferRow, StockTransferStatus } from "@/lib/types";
import { CreateTransferSheet } from "./_create-transfer-drawer";
import { TransferDetailSheet } from "./_transfer-detail-drawer";

const STATUS_CONFIG: Record<
  string,
  { labelKey: string; color: string; icon: typeof Clock }
> = {
  pending: {
    labelKey: "transferStatusPending",
    color:
      "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  approved: {
    labelKey: "transferStatusApproved",
    color: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
    icon: CheckCircle2,
  },
  in_transit: {
    labelKey: "transferStatusInTransit",
    color:
      "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400",
    icon: Send,
  },
  received: {
    labelKey: "transferStatusReceived",
    color:
      "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  completed: {
    labelKey: "transferStatusCompleted",
    color:
      "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  cancelled: {
    labelKey: "transferStatusCancelled",
    color: "bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

const STATUS_FILTERS: (StockTransferStatus | "all")[] = [
  "all",
  "pending",
  "approved",
  "in_transit",
  "completed",
  "cancelled",
];

export default function TransfersPage() {
  const t = useTranslations("inventory");
  const now = useClientNow();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const { data: transfersData, isPending } = useTransfers(orgId, {
    branchId: branchFilter,
  });

  const transfers = transfersData?.data ?? [];

  const { data: branches = [] } = useBranches(orgId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockTransferStatus | "all">(
    "all",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...transfers];
    if (statusFilter !== "all") {
      list = list.filter((tr) => tr.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (tr) =>
          (tr.from_branch_name ?? "").toLowerCase().includes(q) ||
          (tr.to_branch_name ?? "").toLowerCase().includes(q) ||
          (tr.notes ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [transfers, statusFilter, search]);

  const statusChips: FilterChip[] = useMemo(
    () =>
      STATUS_FILTERS.map((key) => ({
        key,
        label: key === "all" ? t("all") : t(STATUS_CONFIG[key].labelKey),
        active: statusFilter === key,
        onClick: () => setStatusFilter(key),
      })),
    [statusFilter, t],
  );

  const exportColumns: ExportColumn<StockTransferRow>[] = [
    {
      key: "from_branch_name",
      label: t("transferFromBranch"),
      value: (tr) => tr.from_branch_name ?? "—",
    },
    {
      key: "to_branch_name",
      label: t("transferToBranch"),
      value: (tr) => tr.to_branch_name,
    },
    {
      key: "status",
      label: t("status"),
      value: (tr) => t(STATUS_CONFIG[tr.status]?.labelKey ?? tr.status),
    },
    { key: "item_count", label: t("transferItems") },
    { key: "created_at", label: t("transferCreated"), format: "date" },
  ];

  return (
    <div className="px-4 pt-4 pb-6 md:px-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("transferTitle")}
        </Typography.H1>
        <Typography.Muted className="text-muted-foreground">
          {t("transferSubtitle")}
        </Typography.Muted>
      </div>

      <ListToolbar
        search={{
          placeholder: t("searchTransfers"),
          value: search,
          onChange: setSearch,
        }}
        filters={<FilterChips items={statusChips} />}
        stats={
          <span>
            {filtered.length} {t("transfers")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={filtered}
              columns={exportColumns}
              filename={`stock-transfers-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Stock Transfers"
            />
            <Button size="default" onClick={() => setCreateOpen(true)}>
              <Package className="size-5" /> {t("newTransfer")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ArrowRightLeft />
                </EmptyMedia>
                <EmptyTitle>{t("noTransfers")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setCreateOpen(true)}>
                  {t("createFirstTransfer")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((tr) => {
                const statusCfg = STATUS_CONFIG[tr.status];
                const StatusIcon = statusCfg?.icon ?? Clock;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => setDetailId(tr.id)}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer min-h-[64px] w-full text-left"
                  >
                    {/* Branches */}
                    <span className="text-sm font-medium w-28 shrink-0 truncate">
                      {tr.from_branch_name ?? t("transferAnyBranch")}
                    </span>
                    <ArrowRightLeft className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium w-28 shrink-0 truncate">
                      {tr.to_branch_name}
                    </span>

                    {/* Status */}
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs ${statusCfg?.color ?? ""}`}
                    >
                      <StatusIcon className="mr-1 size-3" />
                      {t(statusCfg?.labelKey ?? tr.status)}
                    </Badge>

                    {/* Items count */}
                    <span className="text-sm text-muted-foreground shrink-0 hidden sm:block">
                      {tr.item_count ?? 0} {t("transferItemsShort")}
                    </span>

                    {/* Date */}
                    <span className="text-xs text-muted-foreground shrink-0 ml-auto hidden sm:block">
                      {new Date(tr.created_at).toLocaleDateString("mn-MN")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Transfer Dialog */}
      {orgId && (
        <CreateTransferSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          orgId={orgId}
          branches={branches}
          currentBranchId={branchFilter}
        />
      )}

      {/* Transfer Detail Sheet */}
      {orgId && detailId && (
        <TransferDetailSheet
          open={!!detailId}
          onOpenChange={(open) => {
            if (!open) setDetailId(null);
          }}
          orgId={orgId}
          transferId={detailId}
        />
      )}
    </div>
  );
}
