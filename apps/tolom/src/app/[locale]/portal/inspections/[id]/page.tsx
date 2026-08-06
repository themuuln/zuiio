"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CheckCheck, ClipboardList, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  PageErrorState,
  PageNotFoundState,
  PageShellSkeleton,
} from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { cn, formatMNT } from "@/lib/utils";

// ─── Config ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  draft: { variant: "outline", className: "" },
  ready: { variant: "secondary", className: "" },
  sent: {
    variant: "secondary",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-transparent",
  },
  partially_approved: {
    variant: "outline",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  approved: { variant: "default", className: "" },
  converted: {
    variant: "secondary",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
  },
  declined: { variant: "destructive", className: "" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  sent: "Sent",
  partially_approved: "Partially Approved",
  approved: "Approved",
  converted: "Converted",
  declined: "Declined",
};

const CATEGORY_LABELS: Record<string, string> = {
  exterior: "Exterior",
  interior: "Interior",
  tires: "Tires & Wheels",
  brakes: "Brakes",
  under_hood: "Under Hood",
  under_vehicle: "Under Vehicle",
  lights: "Lights",
  fluids: "Fluids",
  battery: "Battery",
  belts_hoses: "Belts & Hoses",
};

const CATEGORY_ORDER = [
  "exterior",
  "under_hood",
  "under_vehicle",
  "interior",
  "brakes",
  "tires",
  "lights",
  "fluids",
  "battery",
  "belts_hoses",
];

const CONDITION_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  good: "default",
  fair: "secondary",
  poor: "destructive",
  fail: "destructive",
  not_checked: "outline",
};

const SEVERITY_STYLES: Record<string, string> = {
  minor: "bg-green-500",
  major: "bg-amber-500",
  critical: "bg-red-500",
};

// ─── Types ───────────────────────────────────────────────────

interface InspectionItem {
  id: string;
  inspection_id: string;
  category: string;
  item_name: string;
  condition: string | null;
  severity: string | null;
  estimated_cost: number | null;
  customer_approved: boolean | null;
  has_photo: boolean;
  photo_urls: string[] | null;
  technician_notes: string | null;
  sort_order: number;
  measurement_value: number | null;
  measurement_unit: string | null;
  created_at: string;
}

interface InspectionDetail {
  id: string;
  status: string;
  vehicle_id: string;
  odometer: number | null;
  fuel_level: string | null;
  technician_notes: string | null;
  created_at: string;
  updated_at: string;
  vehicle: {
    id: string;
    plate_number: string;
    make: string;
    model: string;
    year: number | null;
    color: string | null;
    vin: string | null;
    odometer: number | null;
  } | null;
  items: InspectionItem[];
  estimated_total_cost: number;
}

// ─── Component ───────────────────────────────────────────────

export default function PortalInspectionDetailPage() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const params = useParams();
  const inspectionId = params.id as string;
  const { customer, loading: authLoading, token } = usePortalAuth();
  const queryClient = useQueryClient();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  // ── Fetch inspection data ──────────────────────────────

  const {
    data: inspection,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portal", "inspection", inspectionId],
    queryFn: async () => {
      const res = await fetch(`/api/portal/inspections/${inspectionId}`, {
        headers,
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(t("portal.failedToLoadInspections"));
      }
      const json = await res.json();
      return json.data as InspectionDetail;
    },
    enabled: !!customer && !!inspectionId,
  });

  // ── Approve / Decline mutation ─────────────────────────

  const approveMutation = useMutation({
    mutationFn: async ({
      itemIds,
      approved,
    }: {
      itemIds: string[];
      approved: boolean;
    }) => {
      const res = await fetch(
        `/api/portal/inspections/${inspectionId}/approve`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ item_ids: itemIds, approved }),
        },
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const errMsg =
          errBody &&
          typeof errBody === "object" &&
          "error" in errBody &&
          errBody.error &&
          typeof errBody.error === "object" &&
          "message" in errBody.error &&
          typeof errBody.error.message === "string"
            ? errBody.error.message
            : t("portal.failedToApprove");
        throw new Error(errMsg);
      }
      const json = await res.json();
      return json.data as { updated_count: number; status: string };
    },
    onMutate: async ({ itemIds, approved }) => {
      await queryClient.cancelQueries({
        queryKey: ["portal", "inspection", inspectionId],
      });
      const previous = queryClient.getQueryData<InspectionDetail>([
        "portal",
        "inspection",
        inspectionId,
      ]);
      queryClient.setQueryData<InspectionDetail>(
        ["portal", "inspection", inspectionId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              itemIds.includes(item.id)
                ? { ...item, customer_approved: approved }
                : item,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["portal", "inspection", inspectionId],
          context.previous,
        );
      }
      toast.error(t("portal.failedToApprove"));
    },
    onSuccess: (data) => {
      if (data.status === "approved") {
        toast.success(t("portal.itemsApproved"));
      } else if (data.status === "declined") {
        toast.success(t("portal.itemsDeclined"));
      } else {
        toast.success(t("portal.itemsApproved"));
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["portal", "inspection", inspectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["portal", "inspections", "list"],
      });
    },
  });

  // ── Loading state ──────────────────────────────────────

  if (authLoading || isPending) {
    return <PageShellSkeleton cards={2} title={t("portal.inspectionDetail")} />;
  }

  // ── Error state ────────────────────────────────────────

  if (error) {
    return (
      <PageErrorState
        description={error.message}
        onRetry={() => refetch()}
        className="min-h-[260px]"
      />
    );
  }

  // ── Not found state ────────────────────────────────────

  if (!inspection) {
    return (
      <PageNotFoundState
        title={t("portal.inspectionDetail")}
        description={t("common.pageNotFoundDescription") ?? "Page not found"}
      />
    );
  }

  // ── Derived data ───────────────────────────────────────

  const itemsByCategory = inspection.items.reduce(
    (acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, InspectionItem[]>,
  );

  const sortedCategories = Object.keys(itemsByCategory).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
  );

  const pendingItems = inspection.items.filter(
    (item) => item.customer_approved === null,
  );

  const statusConfig = STATUS_CONFIG[inspection.status] ?? STATUS_CONFIG.draft;
  const statusLabel = STATUS_LABELS[inspection.status] ?? inspection.status;

  const vehicle = inspection.vehicle;

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Back link ─────────────────────────────────── */}
      <Link
        href="/portal/inspections"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {t("portal.inspections")}
      </Link>

      {/* ── Vehicle & inspection header ───────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <ClipboardList className="size-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <Typography.H1 className="text-xl font-semibold">
                  {vehicle
                    ? `${vehicle.plate_number ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`
                    : t("portal.inspectionDetail")}
                </Typography.H1>
                <Badge
                  variant={statusConfig.variant}
                  className={statusConfig.className}
                >
                  {statusLabel}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground/70">
                <span>
                  {new Date(inspection.created_at).toLocaleDateString()}
                </span>
                {inspection.odometer != null && (
                  <span>{inspection.odometer.toLocaleString()} km</span>
                )}
                {vehicle?.color && <span>{vehicle.color}</span>}
                {vehicle?.vin && (
                  <span className="font-mono text-[10px]">
                    VIN: {vehicle.vin}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Typography.Text className="text-lg font-bold tabular-nums">
                {formatMNT(inspection.estimated_total_cost)}
              </Typography.Text>
              <Typography.Muted className="text-[10px] text-muted-foreground/60">
                {t("portal.totalEstimatedCost")}
              </Typography.Muted>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Items section ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-muted-foreground" />
              {t("portal.itemsToReview")}
            </CardTitle>
            {pendingItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={approveMutation.isPending}
                  onClick={() =>
                    approveMutation.mutate({
                      itemIds: pendingItems.map((i) => i.id),
                      approved: true,
                    })
                  }
                >
                  <CheckCheck className="size-3.5 mr-1" />
                  {t("portal.approveAll")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={approveMutation.isPending}
                  onClick={() =>
                    approveMutation.mutate({
                      itemIds: pendingItems.map((i) => i.id),
                      approved: false,
                    })
                  }
                >
                  <X className="size-3.5 mr-1" />
                  {t("portal.declineAll")}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {inspection.items.length === 0 ? (
            <Typography.Muted className="text-sm text-muted-foreground py-4 text-center">
              {t("portal.noItemsToReview")}
            </Typography.Muted>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Items grouped by category */}
              {sortedCategories.map((category) => {
                const items = itemsByCategory[category];
                const categoryLabel = CATEGORY_LABELS[category] ?? category;

                // Split items by approval status within this category
                const pendingInCat = items.filter(
                  (i) => i.customer_approved === null,
                );
                const approvedInCat = items.filter(
                  (i) => i.customer_approved === true,
                );
                const declinedInCat = items.filter(
                  (i) => i.customer_approved === false,
                );

                if (
                  pendingInCat.length === 0 &&
                  approvedInCat.length === 0 &&
                  declinedInCat.length === 0
                ) {
                  return null;
                }

                return (
                  <div key={category}>
                    <Typography.H2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {categoryLabel}
                    </Typography.H2>

                    {/* Pending items */}
                    {pendingInCat.length > 0 && (
                      <div className="flex flex-col gap-2 mb-3">
                        {pendingInCat
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((item) => (
                            <InspectionItemCard
                              key={item.id}
                              item={item}
                              approveLabel={t("common.approve") ?? "Approve"}
                              declineLabel={t("common.decline") ?? "Decline"}
                              onApprove={() =>
                                approveMutation.mutate({
                                  itemIds: [item.id],
                                  approved: true,
                                })
                              }
                              onDecline={() =>
                                approveMutation.mutate({
                                  itemIds: [item.id],
                                  approved: false,
                                })
                              }
                              isMutating={approveMutation.isPending}
                            />
                          ))}
                      </div>
                    )}

                    {/* Approved items */}
                    {approvedInCat.length > 0 && (
                      <div className="flex flex-col gap-1 mb-3">
                        {approvedInCat
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((item) => (
                            <ApprovedItemRow
                              key={item.id}
                              item={item}
                              label={t("portal.approvedItems")}
                            />
                          ))}
                      </div>
                    )}

                    {/* Declined items */}
                    {declinedInCat.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {declinedInCat
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((item) => (
                            <DeclinedItemRow
                              key={item.id}
                              item={item}
                              label={t("portal.declinedItems")}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Technician notes ──────────────────────────── */}
      {inspection.technician_notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-muted-foreground" />
              {t("common.notes") ?? "Technician Notes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-sm whitespace-pre-wrap">
              {inspection.technician_notes}
            </Typography.Text>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function InspectionItemCard({
  item,
  approveLabel,
  declineLabel,
  onApprove,
  onDecline,
  isMutating,
}: {
  item: InspectionItem;
  approveLabel: string;
  declineLabel: string;
  onApprove: () => void;
  onDecline: () => void;
  isMutating: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Typography.Text className="text-sm font-medium">
              {item.item_name}
            </Typography.Text>
            {item.has_photo && (
              <Badge variant="outline" className="text-[10px]">
                📷
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {item.condition && (
              <Badge
                variant={CONDITION_VARIANTS[item.condition] ?? "outline"}
                className="text-[10px]"
              >
                {item.condition}
              </Badge>
            )}
            {item.severity && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span
                  className={cn(
                    "inline-block size-1.5 rounded-full",
                    SEVERITY_STYLES[item.severity] ?? "bg-gray-400",
                  )}
                />
                {item.severity}
              </span>
            )}
            {item.measurement_value != null && item.measurement_unit && (
              <span className="text-[10px] text-muted-foreground">
                {item.measurement_value} {item.measurement_unit}
              </span>
            )}
          </div>
          {item.technician_notes && (
            <Typography.Muted className="text-xs text-muted-foreground mt-1">
              {item.technician_notes}
            </Typography.Muted>
          )}
          {item.estimated_cost != null && (
            <Typography.Text className="text-xs font-medium text-muted-foreground mt-1">
              Est. {formatMNT(item.estimated_cost)}
            </Typography.Text>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant="default"
            className="h-7 px-2 text-xs"
            disabled={isMutating}
            onClick={onApprove}
          >
            <Check className="size-3 mr-0.5" />
            {approveLabel}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            disabled={isMutating}
            onClick={onDecline}
          >
            <X className="size-3 mr-0.5" />
            {declineLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApprovedItemRow({
  item,
  label,
}: {
  item: InspectionItem;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-green-50/50 dark:bg-green-950/10 px-3 py-2">
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <Check className="size-3 text-green-600 dark:text-green-400" />
      </span>
      <Typography.Text className="text-xs text-green-700 dark:text-green-400 line-clamp-1">
        {item.item_name}
      </Typography.Text>
      <Typography.Muted className="text-[10px] text-muted-foreground ml-auto shrink-0">
        {label}
      </Typography.Muted>
    </div>
  );
}

function DeclinedItemRow({
  item,
  label,
}: {
  item: InspectionItem;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-red-50/50 dark:bg-red-950/10 px-3 py-2">
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <X className="size-3 text-red-600 dark:text-red-400" />
      </span>
      <Typography.Text className="text-xs text-red-700 dark:text-red-400 line-clamp-1">
        {item.item_name}
      </Typography.Text>
      <Typography.Muted className="text-[10px] text-muted-foreground ml-auto shrink-0">
        {label}
      </Typography.Muted>
    </div>
  );
}
