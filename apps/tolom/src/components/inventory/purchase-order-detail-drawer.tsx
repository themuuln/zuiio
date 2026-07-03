"use client";

import { Loader2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { DetailSheetHeader } from "@/components/ui/detail-drawer-header";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import {
  usePurchaseOrderItems,
  usePurchaseOrders,
  useReceivePurchaseOrder,
  useUpdatePurchaseOrder,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { PurchaseOrder } from "@/lib/types";

interface PurchaseOrderDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poId: string | null;
}

const PO_STATUS_KEYS: Record<string, string> = {
  draft: "poStatusDraft",
  ordered: "poStatusOrdered",
  partial: "poStatusPartiallyReceived",
  received: "poStatusReceived",
  cancelled: "poStatusCancelled",
};

export function PurchaseOrderDetailSheet({
  open,
  onOpenChange,
  poId,
}: PurchaseOrderDetailSheetProps) {
  const t = useTranslations("inventory");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const { data: purchaseOrders = [], isLoading: poLoading } =
    usePurchaseOrders(orgId);
  const { data: items = [], isLoading: itemsLoading } = usePurchaseOrderItems(
    orgId,
    poId ?? "",
  );
  const receivePO = useReceivePurchaseOrder(orgId);
  const updatePO = useUpdatePurchaseOrder(orgId);

  const po = useMemo(
    () => purchaseOrders.find((p) => p.id === poId),
    [purchaseOrders, poId],
  );

  const isLoading = (poLoading || itemsLoading) && open;
  const notFound = open && !poLoading && !po;

  const handleReceive = useCallback(async () => {
    if (!poId) return;
    try {
      await receivePO.mutateAsync(poId);
      toast.dismiss();
      toast.success(t("poReceived"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToReceive"));
    }
  }, [poId, receivePO, t]);

  const handleStatusChange = useCallback(
    async (status: string) => {
      if (!poId) return;
      try {
        await updatePO.mutateAsync({
          id: poId,
          body: { status: status as PurchaseOrder["status"] },
        });
        toast.dismiss();
        toast.success(t("poUpdated"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("failedToUpdate"));
      }
    },
    [poId, updatePO, t],
  );

  const canReceive =
    po && po.status !== "received" && po.status !== "cancelled";
  const canCancel = po && po.status !== "received" && po.status !== "cancelled";
  const canOrder = po?.status === "draft";

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="2xl">
      <DrawerHeader className="px-4 py-3 border-b border-border shrink-0">
        <DetailSheetHeader
          icon={Truck}
          iconLoading={isLoading}
          title={
            <DrawerTitle className="text-base">
              {isLoading ? "Loading…" : po ? po.order_number : t("poNotFound")}
            </DrawerTitle>
          }
          subtitle={
            po ? (
              <>
                <Badge variant="outline" className="text-xs">
                  {t(PO_STATUS_KEYS[po.status] as string) ?? po.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(po.order_date).toLocaleDateString("mn-MN")}
                  {po.supplier?.name ? ` · ${po.supplier.name}` : ""}
                </span>
              </>
            ) : undefined
          }
        />
      </DrawerHeader>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Not found */}
      {notFound && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
          <Typography.Muted className="text-sm">
            {t("poNotFound")}
          </Typography.Muted>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !notFound && po && (
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-border/50">
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
                onClick={() => {
                  if (confirm(t("confirmReceive"))) {
                    handleReceive();
                  }
                }}
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

          {/* Notes */}
          {po.notes && (
            <div className="px-4 py-3 border-b border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("notes")}
              </span>
              <Typography.Text className="mt-1 text-sm text-muted-foreground">
                {po.notes}
              </Typography.Text>
            </div>
          )}

          {/* Items table */}
          <div className="px-4 py-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("items")}
            </span>
            {items.length === 0 ? (
              <Typography.Muted className="text-sm text-muted-foreground mt-2 block">
                {t("noItems")}
              </Typography.Muted>
            ) : (
              <div className="mt-2 rounded-lg border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="px-3 py-2 text-left text-xs">
                        {t("part")}
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right text-xs">
                        {t("quantityOrdered")}
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right text-xs">
                        {t("quantityReceived")}
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right text-xs">
                        {t("unitCost")}
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right text-xs">
                        {t("lineTotal")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-3 py-2 text-sm font-medium">
                          {item.part_name}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-right tabular-nums">
                          {item.quantity_ordered}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-right tabular-nums">
                          {item.quantity_received}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-right tabular-nums">
                          {item.unit_cost.toLocaleString("mn-MN")} ₮
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-right font-medium tabular-nums">
                          {(
                            item.quantity_ordered * item.unit_cost
                          ).toLocaleString("mn-MN")}{" "}
                          ₮
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="px-4 py-3 border-t border-border mt-auto">
            <div className="flex justify-between text-lg font-semibold">
              <span>{t("totalAmount")}</span>
              <span className="tabular-nums">
                {po.total_amount.toLocaleString("mn-MN")} ₮
              </span>
            </div>
          </div>
        </div>
      )}
    </DetailDrawer>
  );
}
