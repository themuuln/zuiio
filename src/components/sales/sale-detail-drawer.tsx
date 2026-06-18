"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import { X } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { InfoRow } from "@/components/ui/info-row";

type SaleItemDetail = {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: { id: string; name: string; unit: string | null } | null;
};

export type SaleDetailData = {
  id: string;
  sale_date: string;
  total_amount: number | null;
  paid_amount: number | null;
  payment_method: string | null;
  status: string | null;
  notes: string | null;
  contacts: { name: string } | null;
  salesperson_name: string | null;
  sale_items: SaleItemDetail[];
};

const STATUS_MAP: Record<
  string,
  { label: string; variant: "secondary" | "outline" | "destructive" }
> = {
  completed: { label: "Дууссан", variant: "secondary" },
  pending: { label: "Хүлээгдэж буй", variant: "outline" },
  cancelled: { label: "Цуцлагдсан", variant: "destructive" },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Бэлэн",
  bank_transfer: "Данс",
  card: "Карт",
  invoice: "Нэхэмжлэл",
};

export function SaleDetailDrawer({
  sale,
  open,
  onOpenChange,
}: {
  sale: SaleDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const status = STATUS_MAP[sale.status ?? "completed"] ?? STATUS_MAP.completed;
  const remaining =
    Number(sale.total_amount ?? 0) - Number(sale.paid_amount ?? 0);

  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      panelWidth="40rem"
    >
              <DrawerHeader title="Борлуулалтын дэлгэрэнгүй" description={<>{formatDate(sale.sale_date)} •{" "} {sale.contacts?.name ?? "Walk-in"}</>} />


              <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">Нийт дүн</p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatCurrency(Number(sale.total_amount ?? 0))}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">Төлсөн дүн</p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatCurrency(Number(sale.paid_amount ?? 0))}
                    </p>
                  </div>
                </div>

                {/* Info rows */}
                <div className="divide-y rounded-xl border border-border/80 px-4">
                  <InfoRow label="Огноо" value={formatDate(sale.sale_date)} />
                  <InfoRow
                    label="Харилцагч"
                    value={sale.contacts?.name ?? "Walk-in"}
                  />
                  <InfoRow
                    label="Борлуулагч"
                    value={sale.salesperson_name ?? "-"}
                  />
                  <InfoRow
                    label="Төлбөрийн арга"
                    value={
                      PAYMENT_LABELS[sale.payment_method ?? "cash"] ??
                      sale.payment_method
                    }
                  />
                  <InfoRow
                    label="Үлдэгдэл"
                    value={formatCurrency(remaining)}
                    highlight={remaining > 0}
                  />
                  <InfoRow
                    label="Төлөв"
                    value={
                      <Badge variant={status.variant}>{status.label}</Badge>
                    }
                  />
                  {sale.notes ? (
                    <InfoRow label="Тэмдэглэл" value={sale.notes} />
                  ) : null}
                </div>

                {/* Sale items table */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                    Борлуулсан бүтээгдэхүүн
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Бүтээгдэхүүн</TableHead>
                        <TableHead className="text-right">Тоо</TableHead>
                        <TableHead className="text-right">Нэгж үнэ</TableHead>
                        <TableHead className="text-right">Дүн</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.sale_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product?.name ?? "Устгасан"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.product?.unit ?? "ширхэг"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(item.unit_price))}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(item.total_price))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
    </DrawerLayout>
  );
}
