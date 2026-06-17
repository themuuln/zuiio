"use client";

import { ArrowUUpLeft } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { ReturnCreateDrawer } from "@/components/returns/return-create-drawer";
import { ReturnDetailDrawer } from "@/components/returns/return-detail-drawer";
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
import type { ReturnRow } from "./page";

type ContactOption = {
  id: string;
  name: string;
};

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

type SaleOption = {
  id: string;
  sale_date: string;
  total_amount: number;
  contacts: { name: string } | null;
};

type PurchaseOrderOption = {
  id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  contacts: { name: string } | null;
};

const typeLabels: Record<string, string> = {
  sales_return: "Борлуулалтын буцаалт",
  purchase_return: "Худалдан авалтын буцаалт",
};

const statusLabels: Record<string, string> = {
  draft: "Ноорог",
  completed: "Гүйцэтгэсэн",
  cancelled: "Цуцлагдсан",
};

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "draft":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export function ReturnsContent({
  returns,
  contacts,
  products,
  sales,
  purchaseOrders,
}: {
  returns: ReturnRow[];
  contacts: ContactOption[];
  products: ProductOption[];
  sales: SaleOption[];
  purchaseOrders: PurchaseOrderOption[];
}) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const initialRef = useRef(createOpen);

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/returns");
    }
  }, []);

  const selectedReturn = selectedReturnId
    ? (returns.find((r) => r.id === selectedReturnId) ?? null)
    : null;

  return (
    <PageShell
      title="Буцаалт"
      description="Борлуулалт болон худалдан авалтын буцаалтууд"
      actions={
        <ReturnCreateDrawer
          contacts={contacts}
          products={products}
          sales={sales}
          purchaseOrders={purchaseOrders}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      }
    >
      {!returns.length ? (
        <ErpEmptyState
          icon={<ArrowUUpLeft className="size-4" />}
          title="Буцаалт байхгүй"
          description="Шинэ буцаалт үүсгэнэ үү."
          action={
            <ReturnCreateDrawer
              contacts={contacts}
              products={products}
              sales={sales}
              purchaseOrders={purchaseOrders}
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Буцаалтын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дугаар</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Харилцагч</TableHead>
                  <TableHead className="text-right">Нийт дүн</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedReturnId(r.id)}
                  >
                    <TableCell className="font-medium">
                      {r.return_number}
                    </TableCell>
                    <TableCell>{formatDate(r.return_date)}</TableCell>
                    <TableCell>{typeLabels[r.type] ?? r.type}</TableCell>
                    <TableCell>{r.contact_name ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(r.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(r.status)}>
                        {statusLabels[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ReturnDetailDrawer
        returnData={selectedReturn}
        open={!!selectedReturnId}
        onOpenChange={(open) => {
          if (!open) setSelectedReturnId(null);
        }}
      />
    </PageShell>
  );
}
