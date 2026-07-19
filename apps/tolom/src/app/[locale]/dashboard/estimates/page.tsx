"use client";

import { FileText, Plus, Send, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { type FilterChip, FilterChips } from "@/components/filter-chips";
import { ListPageShell } from "@/components/list-page-shell";
import { ListToolbar } from "@/components/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { useTableFilters } from "@/lib/hooks/use-table-filters";
import { useRouter } from "@/lib/i18n/navigation";
import { estimateKeys } from "@/lib/queries/keys";
import {
  type EstimateListItem,
  useEstimates,
} from "@/lib/queries/use-estimates";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import { formatCurrency } from "@/lib/utils";
import { NewEstimateSheet } from "./_new-estimate-drawer";

const STATUS_ORDER = [
  "all",
  "draft",
  "sent",
  "approved",
  "declined",
  "expired",
  "converted",
] as const;

const STATUS_DOT: Record<string, string> = {
  draft: "bg-muted-foreground/50",
  sent: "bg-sky-500",
  approved: "bg-emerald-500",
  declined: "bg-destructive",
  expired: "bg-amber-500",
  converted: "bg-green-600",
};

function getCustomerName(estimate: EstimateListItem) {
  return (
    [estimate.customer?.first_name, estimate.customer?.last_name]
      .filter(Boolean)
      .join(" ") || "—"
  );
}

function getVehicleName(estimate: EstimateListItem) {
  const parts = [
    estimate.vehicle?.plate_number,
    estimate.vehicle?.make,
    estimate.vehicle?.model,
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

function EstimateCard({
  estimate,
  onOpen,
  t,
}: {
  estimate: EstimateListItem;
  onOpen: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(estimate.id)}
      className="w-full rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/30"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Typography.Text className="font-mono text-sm font-semibold">
              {estimate.estimate_number}
            </Typography.Text>
            <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${STATUS_DOT[estimate.status] ?? STATUS_DOT.draft}`}
              />
              {t(`status_${estimate.status}`)}
            </Badge>
            {estimate.converted_work_order && (
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                <Wrench className="size-3.5" />
                {t("convertedToWorkOrder")}
              </Badge>
            )}
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div>
              <Typography.Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("customer")}
              </Typography.Text>
              <Typography.Text className="mt-1 block text-sm text-foreground">
                {getCustomerName(estimate)}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("vehicle")}
              </Typography.Text>
              <Typography.Text className="mt-1 block text-sm text-foreground">
                {getVehicleName(estimate)}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("items")}
              </Typography.Text>
              <Typography.Text className="mt-1 block text-sm text-foreground">
                {estimate.items.length}
              </Typography.Text>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
          <Typography.Text className="font-mono text-lg font-semibold">
            {formatCurrency(Number(estimate.grand_total ?? 0))}
          </Typography.Text>
          <Typography.Text className="text-sm text-muted-foreground">
            {t("created")} {new Date(estimate.created_at).toLocaleDateString()}
          </Typography.Text>
        </div>
      </div>
    </button>
  );
}

export default function EstimatesPage() {
  const t = useTranslations("estimates");
  const commonT = useTranslations("common");
  const router = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const { search, setSearch, status, setStatus } = useTableFilters(
    "estimates",
    {
      status: "all",
    },
  );

  useRealtimeMulti({
    enabled: !!orgId,
    tables: [
      {
        table: "estimates",
        queryKey: estimateKeys.all(orgId ?? ""),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "estimate_items",
        queryKey: estimateKeys.all(orgId ?? ""),
        filter: `organization_id=eq.${orgId}`,
      },
    ],
  });

  const activeStatus = status === "all" ? undefined : status;
  const estimatesQuery = useEstimates(
    orgId,
    activeStatus,
    search,
    branchFilter,
  );
  const estimates = estimatesQuery.data ?? [];

  useEffect(() => {
    if (estimatesQuery.data) setHasLoadedOnce(true);
  }, [estimatesQuery.data]);

  const summary = useMemo(() => {
    const active = estimates.filter((item) =>
      ["draft", "sent", "approved"].includes(item.status),
    ).length;
    const sent = estimates.filter((item) => item.status === "sent").length;
    const approved = estimates.filter(
      (item) => item.status === "approved",
    ).length;
    const total = estimates.reduce(
      (sum, item) => sum + Number(item.grand_total ?? 0),
      0,
    );

    return { active, sent, approved, total };
  }, [estimates]);

  const chips = useMemo<FilterChip[]>(
    () =>
      STATUS_ORDER.map((key) => ({
        key,
        label: key === "all" ? t("all") : t(`status_${key}`),
        active: (status || "all") === key,
        onClick: () => setStatus(key),
        colorDot: key === "all" ? undefined : STATUS_DOT[key],
        count:
          key === "all"
            ? estimates.length
            : estimates.filter((item) => item.status === key).length,
      })),
    [estimates, setStatus, status, t],
  );

  const emptyState = !estimatesQuery.isPending && estimates.length === 0;

  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <ListPageShell
        title={t("pageTitle")}
        description={t("pageSubtitle")}
        loading={estimatesQuery.isPending && !hasLoadedOnce}
        error={
          estimatesQuery.error instanceof Error
            ? estimatesQuery.error.message
            : null
        }
        onRetry={() => estimatesQuery.refetch()}
        headerAction={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
            {t("newQuote")}
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {t("allStatuses")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography.H3 className="text-2xl">
                {estimates.length}
              </Typography.H3>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {t("active")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography.H3 className="text-2xl">
                {summary.active}
              </Typography.H3>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {t("status_sent")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography.H3 className="text-2xl">{summary.sent}</Typography.H3>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {t("grandTotal")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography.H3 className="text-2xl">
                {formatCurrency(summary.total)}
              </Typography.H3>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-4 md:p-5">
            <ListToolbar
              search={{
                value: search,
                onChange: setSearch,
                onValueChange: setSearch,
                placeholder: commonT("search"),
                loading: estimatesQuery.isFetching && hasLoadedOnce,
                focusShortcut: false,
              }}
              filters={<FilterChips items={chips} />}
              stats={
                <div className="flex flex-wrap items-center gap-2">
                  {branchFilter && (
                    <Badge
                      variant="outline"
                      className="rounded-full px-2.5 py-0.5"
                    >
                      {commonT("branch")}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2.5 py-0.5"
                  >
                    <Send className="size-3.5" />
                    {summary.approved} {t("status_approved").toLowerCase()}
                  </Badge>
                </div>
              }
            />

            {emptyState ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText className="size-10 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>{t("noQuotes")}</EmptyTitle>
                  <EmptyDescription>{t("noQuotesDesc")}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setNewOpen(true)}>
                    <Plus className="size-4" />
                    {t("createQuote")}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="flex flex-col gap-3">
                {estimatesQuery.isFetching && hasLoadedOnce ? (
                  <div className="grid gap-3">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <Skeleton key={index} className="h-28 rounded-2xl" />
                    ))}
                  </div>
                ) : null}

                {estimates.map((estimate) => (
                  <EstimateCard
                    key={estimate.id}
                    estimate={estimate}
                    onOpen={(id) => router.push(`/dashboard/estimates/${id}`)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <NewEstimateSheet open={newOpen} onOpenChange={setNewOpen} />
      </ListPageShell>
    </div>
  );
}
