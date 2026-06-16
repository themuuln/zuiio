"use client";

import { Drawer } from "@base-ui/react/drawer";
import { ShareNetwork, X } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  createInvoiceShareLink,
  updateInvoiceStatus,
} from "@/app/(dashboard)/invoices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  paid: "Төлөгдсөн",
  partially_paid: "Хэсэгчилсэн",
  overdue: "Хугацаа хэтэрсэн",
  cancelled: "Цуцлагдсан",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  paid: "default",
  partially_paid: "outline",
  overdue: "destructive",
  cancelled: "outline",
};

async function fetchInvoice(id: string) {
  const supabase = createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, contacts(name, phone, email)")
    .eq("id", id)
    .single();
  if (!invoice) return null;

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*, products(name, unit)")
    .eq("invoice_id", id);

  return { invoice, items: items ?? [] };
}

export function InvoiceDetailDrawer({
  invoiceId,
  onClose,
}: {
  invoiceId: string | null;
  onClose: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareResult, setShareResult] = useState<{
    token?: string;
    error?: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      return fetchInvoice(invoiceId);
    },
    enabled: !!invoiceId,
  });

  const shareUrl =
    shareResult?.token && !shareResult?.error
      ? `${window.location.origin}/r/invoice/${shareResult.token}`
      : null;

  useEffect(() => {
    setShareResult(null);
    setCopied(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerateShareLink() {
    if (!invoiceId) return;
    setPending(true);
    const formData = new FormData();
    formData.append("invoice_id", invoiceId);
    const result = await createInvoiceShareLink(undefined, formData);
    setPending(false);
    setShareResult(result);
  }

  function handleCopy() {
    if (inputRef.current) {
      inputRef.current.select();
      navigator.clipboard.writeText(inputRef.current.value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!invoiceId) return;
    await updateInvoiceStatus(invoiceId, e.target.value);
  }

  return (
    <Drawer.Root
      swipeDirection="right"
      open={!!invoiceId}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.1] [--bleed:3rem] dark:[--backdrop-opacity:0.4] z-50 fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] z-50 fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(32rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[32rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <Drawer.Title className="text-lg font-semibold tracking-tight">
                  {data ? `#${data.invoice.invoice_number}` : "Нэхэмжлэл"}
                </Drawer.Title>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Уншиж байна...</p>
              ) : !data ? (
                <p className="text-sm text-muted-foreground">
                  Нэхэмжлэл олдсонгүй.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    <NativeSelect
                      value={data.invoice.status ?? "pending"}
                      onChange={handleStatusChange}
                      className="w-auto"
                    >
                      <option value="pending">Хүлээгдэж буй</option>
                      <option value="paid">Төлөгдсөн</option>
                      <option value="partially_paid">Хэсэгчилсэн</option>
                      <option value="overdue">Хугацаа хэтэрсэн</option>
                      <option value="cancelled">Цуцлагдсан</option>
                    </NativeSelect>

                    <Dialog
                      open={shareOpen}
                      onOpenChange={(next) => {
                        setShareOpen(next);
                        if (next && data.invoice.token)
                          setShareResult({ token: data.invoice.token });
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ShareNetwork data-icon="inline-start" />
                          Хуваалцах
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Нэхэмжлэл хуваалцах</DialogTitle>
                          <DialogDescription>
                            Холбоос үүсгэж, хэн ч нэвтрэхгүйгээр үзэх боломжтой.
                          </DialogDescription>
                        </DialogHeader>
                        {shareUrl ? (
                          <div className="flex flex-col gap-4">
                            <Label htmlFor="share-url">Холбоос</Label>
                            <div className="flex gap-2">
                              <Input
                                id="share-url"
                                ref={inputRef}
                                value={shareUrl}
                                readOnly
                                className="flex-1"
                              />
                              <Button variant="outline" onClick={handleCopy}>
                                {copied ? "Хуулав!" : "Хуулах"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {shareResult?.error && (
                              <p className="text-sm text-destructive">
                                {shareResult.error}
                              </p>
                            )}
                            <Button
                              onClick={handleGenerateShareLink}
                              disabled={pending}
                            >
                              {pending ? "Үүсгэж байна..." : "Холбоос үүсгэх"}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Invoice metadata */}
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Дугаар
                      </span>
                      <span className="text-sm font-medium">
                        {data.invoice.invoice_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Огноо
                      </span>
                      <span className="text-sm">
                        {formatDate(data.invoice.issue_date)}
                      </span>
                    </div>
                    {data.invoice.due_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Дуусах
                        </span>
                        <span className="text-sm">
                          {formatDate(data.invoice.due_date)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Төлөв
                      </span>
                      <Badge
                        variant={
                          STATUS_VARIANTS[data.invoice.status ?? ""] ??
                          "outline"
                        }
                      >
                        {STATUS_LABELS[data.invoice.status ?? ""] ??
                          data.invoice.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Нийт дүн</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(data.invoice.total_amount ?? 0)}
                      </span>
                    </div>
                    {(data.invoice.paid_amount ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Төлсөн
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(data.invoice.paid_amount ?? 0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact info */}
                  {data.invoice.contacts && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-2">Харилцагч</h4>
                      <p className="text-sm">
                        {(data.invoice.contacts as { name: string }).name}
                      </p>
                      {(data.invoice.contacts as { phone?: string }).phone && (
                        <p className="text-sm text-muted-foreground">
                          {(data.invoice.contacts as { phone: string }).phone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Бараанууд</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Бараа</TableHead>
                          <TableHead className="text-right">Тоо</TableHead>
                          <TableHead className="text-right">Үнэ</TableHead>
                          <TableHead className="text-right">Нийт</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.items.map((item) => {
                          const product = item.products as {
                            name: string;
                            unit: string | null;
                          } | null;
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.description ||
                                  product?.name ||
                                  "Бүтээгдэхүүн"}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.quantity} {product?.unit ?? ""}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.unit_price)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.total_price)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {data.invoice.notes && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-1">Тэмдэглэл</h4>
                      <p className="text-sm text-muted-foreground">
                        {data.invoice.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
