"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { PurchaseCreateDrawer } from "@/components/purchases/purchase-create-drawer";
import { PurchaseDetailDrawer } from "@/components/purchases/purchase-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PurchaseRow } from "./purchases-table";

type SupplierOption = {
  id: string;
  name: string;
  phone: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  cost_price: number | null;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Ноорог",
  sent: "Илгээсэн",
  partially_received: "Хэсэгчлэн хүлээн авсан",
  received: "Хүлээн авсан",
  cancelled: "Цуцлагдсан",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  sent: "secondary",
  partially_received: "secondary",
  received: "default",
  cancelled: "destructive",
};

export function PurchasesContent({
  purchaseOrders,
  suppliers,
  products,
}: {
  purchaseOrders: PurchaseRow[];
  suppliers: SupplierOption[];
  products: ProductOption[];
}) {
  const searchParams = useSearchParams();
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const initialRef = useRef(createOpen);

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/purchases");
    }
  }, []);

  return (
    <>
      <PageShell
        title="Худалдан авалт"
        description="Нийлүүлэгчээс бараа материалын худалдан авалтын захиалга"
        actions={
          <>
            <ExportButton
              href="/api/export/purchases"
              filename={`purchases-${new Date().toISOString().slice(0, 10)}.csv`}
            />
            <PurchaseCreateDrawer
              suppliers={suppliers}
              products={products}
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          </>
        }
      >
        {!purchaseOrders.length ? (
          <ErpEmptyState
            icon={<ShoppingCart className="size-4" />}
            title="Худалдан авалтын захиалга байхгүй"
            description="Шинэ захиалга үүсгэж, нийлүүлэгчээс бараа захиалах."
            action={
              <PurchaseCreateDrawer
                suppliers={suppliers}
                products={products}
                open={createOpen}
                onOpenChange={setCreateOpen}
              />
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Худалдан авалтын захиалгууд</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Захиалгын дугаар</TableHead>
                    <TableHead>Нийлүүлэгч</TableHead>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Хүлээгдэж буй огноо</TableHead>
                    <TableHead className="text-right">Дүн</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPurchaseId(order.id)}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{order.supplier_name ?? "-"}</TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>
                        {order.expected_date
                          ? formatDate(order.expected_date)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(order.total_amount ?? 0))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANTS[order.status] ?? "outline"
                          }
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </PageShell>
      <PurchaseDetailDrawer
        purchaseOrderId={selectedPurchaseId}
        onClose={() => setSelectedPurchaseId(null)}
      />
    </>
  );
}
