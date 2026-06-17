"use client";

import { Drawer } from "@base-ui/react/drawer";
import { ArrowFatDown, X } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  receivePurchaseOrderItems,
  updatePurchaseOrderStatus,
} from "@/app/(dashboard)/purchases/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

type PurchaseDetailData = {
  order: {
    id: string;
    order_number: string;
    order_date: string;
    expected_date: string | null;
    status: string;
    total_amount: number;
    notes: string | null;
    supplier_id: string | null;
    created_by: string | null;
    created_at: string | null;
  };
  items: Array<{
    id: string;
    product_id: string | null;
    description: string | null;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    received_quantity: number;
    products: { name: string; unit: string | null } | null;
  }>;
  supplier: { name: string; phone: string | null } | null;
  createdBy: { name: string } | null;
};

async function fetchPurchaseOrder(id: string): Promise<PurchaseDetailData | null> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("*, contacts!purchase_orders_supplier_id_fkey(name, phone), profiles!purchase_orders_created_by_fkey(name)")
    .eq("id", id)
    .single();

  if (!order) return null;

  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("*, products(name, unit)")
    .eq("purchase_order_id", id);

  return {
    order: order as unknown as PurchaseDetailData["order"],
    items: (items ?? []).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost ?? 0,
      received_quantity: item.received_quantity,
      products: item.products as { name: string; unit: string | null } | null,
    })),
    supplier: order.contacts as { name: string; phone: string | null } | null,
    createdBy: order.profiles as { name: string } | null,
  };
}

export function PurchaseDetailDrawer({
  purchaseOrderId,
  onClose,
}: {
  purchaseOrderId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [receiveMode, setReceiveMode] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [receiveQuantities, setReceiveQuantities] = useState<
    Record<string, number>
  >({});

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-order-detail", purchaseOrderId],
    queryFn: async () => {
      if (!purchaseOrderId) return null;
      return fetchPurchaseOrder(purchaseOrderId);
    },
    enabled: !!purchaseOrderId,
  });

  async function handleStatusChange(
    e: React.ChangeEvent<HTMLSelectElement>,
  ) {
    if (!purchaseOrderId) return;
    const result = await updatePurchaseOrderStatus(
      purchaseOrderId,
      e.target.value,
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Төлөв шинэчлэгдлээ.");
      queryClient.invalidateQueries({
        queryKey: ["purchase-order-detail"],
      });
    }
  }

  async function handleReceive() {
    if (!purchaseOrderId || !data) return;
    setReceiving(true);

    const items = data.items.map((item) => ({
      item_id: item.id,
      received_quantity: receiveQuantities[item.id] ?? 0,
    }));

    // Filter out items with 0 received quantity
    const validItems = items.filter((i) => i.received_quantity > 0);

    if (validItems.length === 0) {
      toast.error("Дор хаяж нэг барааны хүлээн авсан тоо хэмжээг оруулна уу.");
      setReceiving(false);
      return;
    }

    const formData = new FormData();
    formData.append("order_id", purchaseOrderId);
    formData.append("items", JSON.stringify(validItems));

    try {
      const result = await receivePurchaseOrderItems(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Бараа амжилттай хүлээн авлаа.");
        setReceiveMode(false);
        setReceiveQuantities({});
        queryClient.invalidateQueries({
          queryKey: ["purchase-order-detail"],
        });
        queryClient.invalidateQueries({
          queryKey: ["purchase-orders"],
        });
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Хүлээн авахад алдаа гарлаа.",
      );
    } finally {
      setReceiving(false);
    }
  }

  const status = (data?.order?.status as string) ?? "";
  const canReceive =
    status === "sent" || status === "partially_received";

  return (
    <Drawer.Root
      swipeDirection="right"
      open={!!purchaseOrderId}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
          setReceiveMode(false);
          setReceiveQuantities({});
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.1] [--bleed:3rem] dark:[--backdrop-opacity:0.4] z-50 fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] z-50 fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(32rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[32rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <Drawer.Title className="text-lg font-semibold tracking-tight">
                  {data
                    ? `#${data.order.order_number}`
                    : "Худалдан авалтын захиалга"}
                </Drawer.Title>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Уншиж байна...
                </p>
              ) : !data ? (
                <p className="text-sm text-muted-foreground">
                  Захиалга олдсонгүй.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    <NativeSelect
                      value={status}
                      onChange={handleStatusChange}
                      className="w-auto"
                    >
                      <option value="draft">Ноорог</option>
                      <option value="sent">Илгээсэн</option>
                      <option value="received">Хүлээн авсан</option>
                      <option value="cancelled">Цуцлагдсан</option>
                    </NativeSelect>

                    {canReceive && (
                      <button
                        type="button"
                        onClick={() => setReceiveMode(!receiveMode)}
                        className={buttonVariants({
                          variant: receiveMode ? "default" : "outline",
                          size: "sm",
                        })}
                      >
                        <ArrowFatDown data-icon="inline-start" />
                        {receiveMode ? "Цуцлах" : "Бараа хүлээн авах"}
                      </button>
                    )}
                  </div>

                  {/* Order metadata */}
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Захиалгын дугаар
                      </span>
                      <span className="text-sm font-medium font-mono">
                        {data.order.order_number as string}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Нийлүүлэгч
                      </span>
                      <span className="text-sm">
                        {data.supplier?.name ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Огноо
                      </span>
                      <span className="text-sm">
                        {formatDate(data.order.order_date as string)}
                      </span>
                    </div>
                    {data.order.expected_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Хүлээгдэж буй огноо
                        </span>
                        <span className="text-sm">
                          {formatDate(
                            data.order.expected_date as string,
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Төлөв
                      </span>
                      <Badge
                        variant={
                          STATUS_VARIANTS[status] ?? "outline"
                        }
                      >
                        {STATUS_LABELS[status] ?? status}
                      </Badge>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Нийт дүн</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(
                          Number(data.order.total_amount ?? 0),
                        )}
                      </span>
                    </div>
                    {data.createdBy && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Үүсгэсэн
                        </span>
                        <span className="text-sm">
                          {data.createdBy.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Supplier info */}
                  {data.supplier && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-2">
                        Нийлүүлэгч
                      </h4>
                      <p className="text-sm">{data.supplier.name}</p>
                      {data.supplier.phone && (
                        <p className="text-sm text-muted-foreground">
                          {data.supplier.phone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Бараанууд
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Бараа</TableHead>
                          <TableHead className="text-right">
                            Тоо
                          </TableHead>
                          <TableHead className="text-right">
                            Өртөг
                          </TableHead>
                          <TableHead className="text-right">
                            Дүн
                          </TableHead>
                          {(status === "received" ||
                            status === "partially_received" ||
                            receiveMode) && (
                            <TableHead className="text-right">
                              Хүлээн авсан
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.items.map((item) => {
                          const productName =
                            item.description ||
                            item.products?.name ||
                            "Бүтээгдэхүүн";
                          const remaining =
                            Number(item.quantity) -
                            Number(item.received_quantity);

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                {productName}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.quantity}{" "}
                                {item.products?.unit ?? ""}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.unit_cost)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.total_cost)}
                              </TableCell>
                              {(status === "received" ||
                                status ===
                                  "partially_received" ||
                                receiveMode) && (
                                <TableCell className="text-right">
                                  {receiveMode ? (
                                    <div className="flex items-center gap-1 justify-end">
                                      <span className="text-xs text-muted-foreground">
                                        {Number(
                                          item.received_quantity,
                                        ) > 0
                                          ? `${item.received_quantity}/`
                                          : ""}
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        max={Math.max(
                                          0,
                                          remaining,
                                        )}
                                        step="any"
                                        className="w-16 rounded border border-border bg-transparent px-1 py-0.5 text-right text-xs"
                                        placeholder="0"
                                        value={
                                          receiveQuantities[
                                            item.id
                                          ] ?? ""
                                        }
                                        onChange={(e) => {
                                          const val = e.target
                                            .value;
                                          setReceiveQuantities(
                                            (prev) => ({
                                              ...prev,
                                              [item.id]:
                                                val === ""
                                                  ? 0
                                                  : Number(
                                                      val,
                                                    ),
                                            }),
                                          );
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-sm">
                                      {item.received_quantity} /{" "}
                                      {item.quantity}
                                    </span>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Receive confirmation */}
                  {receiveMode && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleReceive}
                        disabled={receiving}
                        className={buttonVariants({
                          variant: "default",
                        })}
                      >
                        {receiving
                          ? "Хүлээн авч байна..."
                          : "Хүлээн авсан баталгаажуулах"}
                      </button>
                    </div>
                  )}

                  {/* Notes */}
                  {data.order.notes && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-1">
                        Тэмдэглэл
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {data.order.notes as string}
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
