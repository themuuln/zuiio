"use client";

import { Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { formatMNT } from "@/lib/utils";

interface SupplierInfo {
  id: string;
  name: string;
}

interface PurchaseOrderInfo {
  id: string;
  created_at: string;
  status: string;
  supplier: SupplierInfo | null;
}

interface PurchaseHistoryItem {
  id: string;
  quantity_ordered: number;
  quantity_received: number | null;
  unit_cost: number;
  purchase_order: PurchaseOrderInfo | null;
}

interface SupplierPriceHistoryProps {
  history: PurchaseHistoryItem[];
  isPending: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SupplierPriceHistory({
  history,
  isPending,
}: SupplierPriceHistoryProps) {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Receipt className="size-4 text-muted-foreground" />
        <CardTitle className="text-base font-semibold">
          {t("supplierPriceHistory")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noPurchaseHistory")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("supplier")}</TableHead>
                  <TableHead className="text-right">
                    {t("qtyOrdered")}
                  </TableHead>
                  <TableHead className="text-right">{t("unitCost")}</TableHead>
                  <TableHead className="text-right">{t("total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => {
                  const total = item.quantity_ordered * item.unit_cost;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {item.purchase_order
                          ? formatDate(item.purchase_order.created_at)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {item.purchase_order?.supplier?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {item.quantity_ordered}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatMNT(item.unit_cost)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {formatMNT(total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
