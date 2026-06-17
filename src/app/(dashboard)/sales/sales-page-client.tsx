"use client";

import { Drawer } from "@base-ui/react/drawer";
import { CurrencyDollar, Plus, X } from "@phosphor-icons/react";
import { useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import {
  type SaleDetailData,
  SaleDetailDrawer,
} from "@/components/sales/sale-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { SaleForm } from "./new/sale-form";

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

type SaleRow = {
  id: string;
  sale_date: string;
  total_amount: number | null;
  paid_amount: number | null;
  payment_method: string | null;
  status: string | null;
  notes: string | null;
  contacts: { name: string } | null;
  sale_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: { id: string; name: string; unit: string | null } | null;
  }[];
};

const STATUS_MAP: Record<
  string,
  { label: string; variant: "secondary" | "outline" | "destructive" }
> = {
  completed: { label: "Дууссан", variant: "secondary" },
  pending: { label: "Хүлээгдэж буй", variant: "outline" },
  cancelled: { label: "Цуцлагдсан", variant: "destructive" },
};

export function SalesPageClient({
  sales,
  products,
  customers,
  completedAmount,
  pendingCount,
  invoiceCount,
}: {
  sales: SaleRow[];
  products: ProductOption[];
  customers: CustomerOption[];
  completedAmount: number;
  pendingCount: number;
  invoiceCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleDetailData | null>(null);

  const openDetail = (sale: SaleRow) => {
    setSelectedSale(sale as SaleDetailData);
    setDetailOpen(true);
  };

  return (
    <>
      <Drawer.Root swipeDirection="right" open={open} onOpenChange={setOpen}>
        <PageShell
          title="Борлуулалт"
          description="Нэхэмжлэл, бэлэн ба дансны төлбөр, үлдэгдэл авлагын хяналт."
          actions={
            <Drawer.Trigger className={buttonVariants({ variant: "default" })}>
              <Plus data-icon="inline-start" />
              Шинэ борлуулалт
            </Drawer.Trigger>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Сүүлийн 50 борлуулалт</CardTitle>
                <CardDescription>Сүүлийн бүртгэлүүдийн тоо</CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {sales.length}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Нийт дүн</CardTitle>
                <CardDescription>
                  Бүх бүртгэлийн борлуулалтын хэмжээ
                </CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatCurrency(completedAmount)}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Төлөгдөөгүй</CardTitle>
                <CardDescription>
                  {pendingCount} хүлээгдэж буй, {invoiceCount} нэхэмжлэлтэй
                </CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-amber-600">
                {formatCurrency(
                  sales.reduce(
                    (sum, sale) =>
                      sum +
                      (Number(sale.total_amount ?? 0) -
                        Number(sale.paid_amount ?? 0)),
                    0,
                  ) ?? 0,
                )}
              </CardContent>
            </Card>
          </div>

          {!sales.length ? (
            <ErpEmptyState
              icon={<CurrencyDollar className="size-4" />}
              title="Борлуулалтын бүртгэл хоосон байна"
              description="Шинэ борлуулалт үүсгэхэд барааны үлдэгдэл автоматаар буурна."
              action={
                <Drawer.Trigger
                  className={buttonVariants({ variant: "default" })}
                >
                  Борлуулалт бүртгэх
                </Drawer.Trigger>
              }
            />
          ) : (
            <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Борлуулалтын түүх</CardTitle>
                <CardDescription>
                  Харилцагч, төлбөрийн арга, төлөвийг нэг хүснэгтэд харуулна.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Огноо</TableHead>
                      <TableHead>Харилцагч</TableHead>
                      <TableHead>Төлбөрийн арга</TableHead>
                      <TableHead>Нийт дүн</TableHead>
                      <TableHead>Төлсөн</TableHead>
                      <TableHead>Төлөв</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => {
                      const status =
                        STATUS_MAP[sale.status ?? "completed"] ??
                        STATUS_MAP.completed;
                      return (
                        <TableRow
                          key={sale.id}
                          className="cursor-pointer"
                          onClick={() => openDetail(sale)}
                        >
                          <TableCell>{formatDate(sale.sale_date)}</TableCell>
                          <TableCell className="font-medium">
                            {sale.contacts?.name ?? "Walk-in"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {sale.payment_method ?? "cash"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(Number(sale.total_amount ?? 0))}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(Number(sale.paid_amount ?? 0))}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </PageShell>

        <Drawer.Portal>
          <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
          <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
            <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(40rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[40rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-neutral-950 dark:text-white dark:shadow-none">
              <Drawer.Content className="mx-auto w-full">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <Drawer.Title className="text-lg font-semibold tracking-tight">
                      Шинэ борлуулалт
                    </Drawer.Title>
                    <Drawer.Description className="text-sm text-muted-foreground">
                      Нэг алхмаар бүтээгдэхүүн сонгож, нийт дүн, төлбөр,
                      харилцагчийн мэдээллээ бүртгэнэ.
                    </Drawer.Description>
                  </div>
                  <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                    <X className="size-4" />
                  </Drawer.Close>
                </div>

                <SaleForm
                  products={products}
                  customers={customers}
                  onSuccess={() => {
                    setOpen(false);
                  }}
                />
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      {selectedSale ? (
        <SaleDetailDrawer
          sale={selectedSale}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      ) : null}
    </>
  );
}
