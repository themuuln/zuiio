"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/lib/i18n/navigation";
import {
  usePurchaseOrderItems,
  usePurchaseOrders,
  useReceivePurchaseOrder,
  useUpdatePurchaseOrder,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { PurchaseOrder } from "@/lib/types";

const PO_STATUS_KEYS: Record<string, string> = {
  draft: "poStatusDraft",
  ordered: "poStatusOrdered",
  partial: "poStatusPartiallyReceived",
  received: "poStatusReceived",
  cancelled: "poStatusCancelled",
};

export default function PurchaseOrderDetailPage() {
  const t = useTranslations("inventory");
  const params = useParams();
  const { push, back } = useRouter();
  const poId = params.id as string;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;

  const { data: purchaseOrders = [], isLoading: poLoading } =
    usePurchaseOrders(orgId);
  const { data: items = [], isLoading: itemsLoading } = usePurchaseOrderItems(
    orgId,
    poId,
  );
  const receivePO = useReceivePurchaseOrder(orgId);
  const updatePO = useUpdatePurchaseOrder(orgId);

  const po = useMemo(
    () => purchaseOrders.find((p) => p.id === poId),
    [purchaseOrders, poId],
  );

  const isLoading = poLoading || itemsLoading;

  const handleReceive = async () => {
    if (!confirm(t("confirmReceive"))) return;
    try {
      await receivePO.mutateAsync(poId);
      toast.success(t("poReceived"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToReceive"));
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updatePO.mutateAsync({
        id: poId,
        body: { status: status as PurchaseOrder["status"] },
      });
      toast.success(t("poUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToUpdate"));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 flex flex-col gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <Button variant="ghost" onClick={() => back()} className="w-fit">
          <ArrowLeft className="size-4" /> {t("back")}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">{t("poNotFound")}</p>
            <Button
              onClick={() =>
                push("/dashboard/inventory/purchase-orders")
              }
            >
              {t("backToList")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canReceive = po.status !== "received" && po.status !== "cancelled";
  const canCancel = po.status !== "received" && po.status !== "cancelled";
  const canOrder = po.status === "draft";

  return (
    <div className="flex flex-col gap-6 max-w-3xl print:max-w-none">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => back()}
          aria-label={t("back")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              {po.order_number}
            </h1>
            <Badge variant="outline">
              {t(PO_STATUS_KEYS[po.status] as string) ?? po.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(po.order_date).toLocaleDateString("mn-MN")}
            {po.supplier?.name ? ` · ${po.supplier.name}` : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="hidden sm:flex"
        >
          <Printer className="size-4" /> {t("print")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {canOrder && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange("ordered")}
            disabled={updatePO.isPending}
          >
            {t("markOrdered")}
          </Button>
        )}
        {canReceive && (
          <Button
            size="sm"
            onClick={handleReceive}
            disabled={receivePO.isPending}
          >
            <Truck className="size-4" /> {t("receiveStock")}
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (confirm(t("confirmCancel"))) {
                handleStatusChange("cancelled");
              }
            }}
            disabled={updatePO.isPending}
          >
            {t("cancelPO")}
          </Button>
        )}
      </div>

      {po.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{po.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("items")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">
              {t("noItems")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("part")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("quantityOrdered")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("quantityReceived")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("unitCost")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("lineTotal")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-3 font-medium">{item.part_name}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {item.quantity_ordered}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {item.quantity_received}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {item.unit_cost.toLocaleString("mn-MN")} ₮
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-medium tabular-nums">
                      {(item.quantity_ordered * item.unit_cost).toLocaleString(
                        "mn-MN",
                      )}{" "}
                      ₮
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between text-lg font-semibold">
            <span>{t("totalAmount")}</span>
            <span className="tabular-nums">
              {po.total_amount.toLocaleString("mn-MN")} ₮
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
