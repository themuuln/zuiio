"use client";

import { Badge } from "@/components/ui/badge";
import { Plus, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { ExportButton } from "@/components/export-button";
import { type FilterChip, FilterChips } from "@/components/filter-chips";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ExportColumn } from "@/lib/export";
import { Link } from "@/lib/i18n/navigation";
import { usePurchaseOrders } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { PurchaseOrder } from "@/lib/types";

const PO_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  ordered: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PO_STATUS_KEYS: Record<string, string> = {
  draft: "poStatusDraft",
  ordered: "poStatusOrdered",
  partial: "poStatusPartiallyReceived",
  received: "poStatusReceived",
  cancelled: "poStatusCancelled",
};

const STATUS_FILTERS = [
  "",
  "draft",
  "ordered",
  "partial",
  "received",
  "cancelled",
];

export default function PurchaseOrdersPage() {
  const t = useTranslations("inventory");
  const now = useClientNow();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders(orgId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let list = [...purchaseOrders];
    if (statusFilter) {
      list = list.filter((po) => po.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (po) =>
          po.order_number.toLowerCase().includes(q) ||
          (po.supplier?.name?.toLowerCase() ?? "").includes(q),
      );
    }
    return list;
  }, [purchaseOrders, statusFilter, search]);

  const statusChips: FilterChip[] = useMemo(
    () =>
      STATUS_FILTERS.map((key) => ({
        key: key || "all",
        label: key ? t(PO_STATUS_KEYS[key] as string) : t("all"),
        active: statusFilter === key,
        onClick: () => setStatusFilter(key),
      })),
    [statusFilter, t],
  );

  const exportColumns: ExportColumn<PurchaseOrder>[] = [
    { key: "order_number", label: t("orderNumber") },
    {
      key: "supplier_id",
      label: t("supplier"),
      value: (po) => po.supplier_id ?? "—",
    },
    {
      key: "status",
      label: t("status"),
      value: (po) => t(PO_STATUS_KEYS[po.status] as string) ?? po.status,
    },
    { key: "total_amount", label: t("totalAmount"), format: "currency" },
    { key: "order_date", label: t("orderDate"), format: "date" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("purchaseOrdersTitle")}
        </h1>
        <p className="text-muted-foreground">{t("purchaseOrdersSubtitle")}</p>
      </div>

      <ListToolbar
        search={{
          placeholder: t("searchPOs"),
          value: search,
          onChange: setSearch,
        }}
        filters={<FilterChips items={statusChips} />}
        stats={
          <span>
            {filtered.length} {t("purchaseOrders")}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={filtered}
              columns={exportColumns}
              filename={`purchase-orders-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Purchase Orders"
            />
            <Link href="/dashboard/inventory/purchase-orders/new">
              <Button size="default">
                <Plus className="size-5" /> {t("newPurchaseOrder")}
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
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
                  <Truck />
                </EmptyMedia>
                <EmptyTitle>{t("noPurchaseOrders")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/dashboard/inventory/purchase-orders/new">
                  <Button>{t("createFirstPO")}</Button>
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((po) => (
                <Link
                  key={po.id}
                  href={`/dashboard/inventory/purchase-orders/${po.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer min-h-[64px]"
                >
                  <span className="font-medium text-sm w-28 shrink-0">
                    {po.order_number}
                  </span>
                  <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">
                    {po.supplier?.name ?? t("noSupplier")}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {t(PO_STATUS_KEYS[po.status] as string) ?? po.status}
                  </Badge>
                  <span className="text-sm font-medium tabular-nums shrink-0">
                    {po.total_amount.toLocaleString()} ₮
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {new Date(po.order_date).toLocaleDateString("mn-MN")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
