"use client";

import { Drawer } from "@base-ui/react/drawer";
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
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(40rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[40rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    Борлуулалтын дэлгэрэнгүй
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {formatDate(sale.sale_date)} •{" "}
                    {sale.contacts?.name ?? "Walk-in"}
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <div className="space-y-6">
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
                <div className="divide-y rounded-xl border border-border/80">
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
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${highlight ? "text-amber-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}
