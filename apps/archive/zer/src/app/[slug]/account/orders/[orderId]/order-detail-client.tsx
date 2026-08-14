"use client";

import {
  ArrowLeft,
  Check,
  Circle,
  Envelope,
  MapPin,
  Phone,
  Receipt,
  Truck,
  User,
} from "@phosphor-icons/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  StorefrontCartProvider,
  useStorefrontCart,
} from "@/components/storefront/cart-context";
import { useStorefrontBase } from "@/components/storefront/storefront-base-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useStoreSession } from "../../use-store-session";
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  STATUS_LABELS,
} from "../order-labels";

/**
 * Response shape of the `get_public_order` RPC (backend contract):
 * `{ order: OrderDetail }` — signed-in buyer's own order, enforced
 * server-side via `auth.uid() = store_account_id`; any other caller gets
 * null ("not found").
 */
export type OrderDetailItem = {
  product_id: string | null;
  name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant_labels?: string[] | null;
};

export type OrderDetailDelivery = {
  status: string | null;
  external_tracking_id: string | null;
  assigned_to_name?: string | null;
};

/**
 * One entry of `sales.status_history` (backend contract): the event status,
 * when it happened and (optionally) who set it. Populated for submit / cancel
 * / staff flips.
 */
export type StatusHistoryEntry = {
  status: string;
  at: string;
  by?: string | null;
};

export type OrderDetail = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  created_at: string | null;
  total_amount: number;
  original_amount: number | null;
  discount_amount: number | null;
  delivery_fee: number | null;
  gift_card_amount: number | null;
  payment_method: string | null;
  currency_code: string | null;
  delivery_type: "delivery" | "pickup" | null;
  delivery_address: string | null;
  delivery_note: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  delivery: OrderDetailDelivery | null;
  status_history?: StatusHistoryEntry[] | null;
  items: OrderDetailItem[];
};

type TimelineStep = {
  label: string;
  done: boolean;
  at?: string | null;
};

/**
 * Deterministic status timeline fallback — used only when the backend has not
 * yet recorded a `status_history` for the order. Steps are derived from the
 * current order/delivery status, so no timestamps are shown.
 */
function buildTimelineSteps(order: OrderDetail): TimelineStep[] {
  const completed = order.status === "completed";
  const isDelivery = order.delivery_type === "delivery";
  const deliveryStatus = order.delivery?.status ?? null;

  const steps: TimelineStep[] = [
    { label: "Захиалга үүссэн", done: true },
    { label: "Баталгаажсан", done: completed },
  ];

  if (isDelivery) {
    const inTransit =
      deliveryStatus === "in_transit" || deliveryStatus === "delivered";
    const delivered = deliveryStatus === "delivered";
    steps.push({ label: "Хүргэлтэнд гарсан", done: inTransit });
    steps.push({ label: "Хүргэгдсэн", done: delivered });
  } else {
    // Pickup flow — the order is ready for pickup once it is completed.
    steps.push({ label: "Бэлэн болсон", done: completed });
  }

  return steps;
}

/**
 * Timeline from `sales.status_history` when present: every recorded event is
 * a completed step with its own timestamp (the history is a log of what
 * happened, including cancellations). Falls back to the deterministic steps
 * when the history is empty.
 */
function buildHistorySteps(order: OrderDetail): TimelineStep[] {
  const history = Array.isArray(order.status_history)
    ? order.status_history
    : [];
  if (history.length === 0) return buildTimelineSteps(order);
  return history.map((entry) => ({
    label: STATUS_LABELS[entry.status] ?? entry.status,
    done: true,
    at: entry.at ?? null,
  }));
}

/**
 * Re-adds the order's line items to the storefront cart (localStorage-backed
 * via StorefrontCartProvider) and navigates to the cart page. In-stock
 * awareness is intentionally skipped — the server rejects the order at
 * submit time if an item is unavailable.
 */
function ReorderButton({ items }: { items: OrderDetailItem[] }) {
  const { addItem } = useStorefrontCart();
  const router = useRouter();
  const base = useStorefrontBase();

  // Items whose product was deleted have a null product_id and cannot be
  // re-added — drop them and narrow the type for the loop below.
  const reorderable: Array<OrderDetailItem & { product_id: string }> = [];
  for (const item of items) {
    if (item.product_id) {
      reorderable.push({ ...item, product_id: item.product_id });
    }
  }
  if (reorderable.length === 0) return null;

  const handleReorder = () => {
    for (const item of reorderable) {
      addItem({
        productId: item.product_id,
        name: item.name ?? "Бүтээгдэхүүн",
        unitPrice: Number(item.unit_price ?? 0),
        unit: "ширхэг",
        maxStock: Number.POSITIVE_INFINITY,
        quantity: item.quantity,
        variantLabels:
          Array.isArray(item.variant_labels) && item.variant_labels.length > 0
            ? item.variant_labels.join(", ")
            : undefined,
      });
    }
    router.push(`${base}/cart`);
  };

  return (
    <Button type="button" variant="outline" onClick={handleReorder}>
      Дахин захиалах
    </Button>
  );
}

export function OrderDetailClient({
  slug,
  order: initialOrder,
}: {
  slug: string;
  order: OrderDetail;
}) {
  const { t } = useI18n();
  const { state } = useStoreSession();
  const base = useStorefrontBase();
  // Local copy so cancellation can refetch and re-render the detail.
  const [order, setOrder] = useState<OrderDetail>(initialOrder);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm("Захиалга цуцлах уу?")) return;
    setCancelling(true);
    try {
      const supabase = createClient() as SupabaseClient;
      const { error: rpcError } = await supabase.rpc("cancel_my_order", {
        p_slug: slug,
        p_order_id: order.id,
      });
      if (rpcError) throw rpcError;
      toast.success("Захиалга цуцалсан");
      // Refetch the fresh detail so the status badge + timeline update.
      const result = (await supabase.rpc("get_public_order", {
        p_slug: slug,
        p_order_id: order.id,
      })) as {
        data: { order: OrderDetail } | null;
        error: { message: string } | null;
      };
      if (result.error) throw result.error;
      if (result.data?.order) setOrder(result.data.order);
    } catch (err) {
      capture(err, { context: "storefront: cancel order" });
      let message: unknown = null;
      if (err && typeof err === "object" && "message" in err) {
        message = err.message;
      }
      toast.error(
        typeof message === "string" && message.trim() !== ""
          ? message
          : "Захиалга цуцлахад алдаа гарлаа. Дахин оролдоно уу.",
      );
    } finally {
      setCancelling(false);
    }
  };

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (state.status === "signedOut") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-16 text-center">
        <Receipt className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-bold tracking-tight">
          {t("storeAccount.orders.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("storeAccount.orders.loginRequired")}
        </p>
        <Button asChild size="lg">
          <Link href={`${base}/account`}>
            {t("storeAccount.orders.loginCta")}
          </Link>
        </Button>
      </div>
    );
  }

  const steps = buildHistorySteps(order);
  // The current step is the furthest reached one — last step that is done.
  const currentIndex = steps.reduce(
    (current, step, index) => (step.done ? index : current),
    0,
  );
  const isDelivery = order.delivery_type === "delivery";
  const deliveryStatus = order.delivery?.status ?? null;
  const originalAmount = order.original_amount ?? order.total_amount;
  const discount = order.discount_amount ?? 0;
  const deliveryFee = order.delivery_fee ?? 0;
  const giftCard = order.gift_card_amount ?? 0;
  const showDeliveryCard =
    order.delivery_type !== null || order.delivery !== null;

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href={`${base}/account/orders`}>
          <ArrowLeft className="size-4" />
          {t("storeAccount.orderDetail.backToOrders")}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {order.invoice_number ?? order.id.slice(0, 8)}
          </h1>
          {order.created_at && (
            <p className="text-sm text-muted-foreground">
              {formatDate(order.created_at)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {order.status && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          )}
          {isDelivery && deliveryStatus && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {DELIVERY_STATUS_LABELS[deliveryStatus] ?? deliveryStatus}
            </span>
          )}
          {order.status === "pending" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling && <Spinner className="size-3.5" />}
              Захиалга цуцлах
            </Button>
          )}
          <StorefrontCartProvider>
            <ReorderButton items={order.items} />
          </StorefrontCartProvider>
        </div>
      </div>

      {/* Status timeline */}
      <Card>
        <CardTitle className="px-6 text-sm font-semibold">Төлөв</CardTitle>
        <CardContent>
          <ol className="space-y-0">
            {steps.map((step, index) => {
              const isCurrent = index === currentIndex;
              const isDone = step.done;
              return (
                <li key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCurrent
                            ? "border-primary text-primary"
                            : "border-border text-muted-foreground",
                      )}
                    >
                      {isDone ? (
                        <Check className="size-3.5" weight="bold" />
                      ) : (
                        <Circle className="size-2.5" weight="fill" />
                      )}
                    </span>
                    {index < steps.length - 1 && (
                      <span
                        className={cn(
                          "w-px flex-1",
                          step.done ? "bg-primary/40" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "pb-6 text-sm",
                      isCurrent || isDone
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <p>{step.label}</p>
                    {step.at && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(step.at)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Delivery info */}
      {showDeliveryCard && (
        <Card>
          <CardTitle className="px-6 text-sm font-semibold">
            Хүргэлтийн мэдээлэл
          </CardTitle>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              {isDelivery ? (
                <Truck className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="font-medium">
                {DELIVERY_TYPE_LABELS[order.delivery_type ?? "delivery"]}
              </span>
            </div>
            {isDelivery && order.delivery_address && (
              <p className="text-muted-foreground">{order.delivery_address}</p>
            )}
            {isDelivery && order.delivery_note && (
              <p className="text-muted-foreground">
                Тэмдэглэл: {order.delivery_note}
              </p>
            )}
            {deliveryStatus && (
              <p className="text-muted-foreground">
                Төлөв:{" "}
                {DELIVERY_STATUS_LABELS[deliveryStatus] ?? deliveryStatus}
              </p>
            )}
            {order.delivery?.external_tracking_id && (
              <p className="text-muted-foreground">
                Ангид: {order.delivery.external_tracking_id}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Line items */}
      <Card>
        <CardTitle className="px-6 text-sm font-semibold">
          {t("storeAccount.orders.items")}
        </CardTitle>
        <CardContent>
          {order.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("storeAccount.orders.items")}: —
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {order.items.map((item, index) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: line items are a static snapshot, no stable id
                  key={`${item.product_id ?? "item"}-${index}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {item.name ?? "—"}
                    <span className="text-xs text-muted-foreground/60">
                      {" "}
                      ×{item.quantity}
                    </span>
                    {Array.isArray(item.variant_labels) &&
                      item.variant_labels.length > 0 && (
                        <span className="block truncate text-xs text-muted-foreground/60">
                          {item.variant_labels.join(", ")}
                        </span>
                      )}
                  </span>
                  <span className="w-20 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(Number(item.unit_price ?? 0))}
                  </span>
                  <span className="w-20 shrink-0 text-right font-medium tabular-nums">
                    {formatCurrency(Number(item.total_price ?? 0))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardTitle className="px-6 text-sm font-semibold">Төлбөр</CardTitle>
        <CardContent className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Барааны дүн</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(originalAmount)}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Хямдрал</span>
              <span className="font-medium text-emerald-600 tabular-nums">
                −{formatCurrency(discount)}
              </span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Хүргэлтийн төлбөр</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(deliveryFee)}
              </span>
            </div>
          )}
          {giftCard > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Бэлгийн карт</span>
              <span className="font-medium text-emerald-600 tabular-nums">
                −{formatCurrency(giftCard)}
              </span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex items-center justify-between">
            <span className="font-semibold">Нийт дүн</span>
            <span className="font-bold tabular-nums">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
          {order.payment_method && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Төлбөрийн арга</span>
              <span className="font-medium">
                {PAYMENT_METHOD_LABELS[order.payment_method] ??
                  order.payment_method}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact info */}
      <Card>
        <CardTitle className="px-6 text-sm font-semibold">
          Холбоо барих
        </CardTitle>
        <CardContent className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <User className="size-4 shrink-0" />
              Нэр
            </span>
            <span className="font-medium">{order.contact_name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-4 shrink-0" />
              Утас
            </span>
            <span className="font-medium">{order.contact_phone ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Envelope className="size-4 shrink-0" />
              Имэйл
            </span>
            <span className="truncate font-medium">
              {order.contact_email ?? "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
