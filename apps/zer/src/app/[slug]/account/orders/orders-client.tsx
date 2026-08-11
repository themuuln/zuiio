"use client";

import { Receipt } from "@phosphor-icons/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useStoreSession } from "../use-store-session";
import { DELIVERY_STATUS_LABELS, STATUS_LABELS } from "./order-labels";

export type MyOrder = {
  id: string;
  invoice_number: string | null;
  total_amount: number;
  status: string | null;
  created_at: string | null;
  delivery_type: "delivery" | "pickup" | null;
  delivery_status: string | null;
  external_tracking_id: string | null;
  items: Array<{
    product_id: string | null;
    name: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
};

export function OrdersClient({ slug }: { slug: string }) {
  const { t } = useI18n();
  const { state } = useStoreSession();
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const supabase = createClient();
    const result = (await supabase.rpc("get_my_orders")) as {
      data: MyOrder[] | null;
      error: { message: string } | null;
    };
    if (result.error) {
      capture(result.error, { context: "orders: get_my_orders" });
      setError(result.error.message);
      return;
    }
    setOrders(result.data ?? []);
  }, []);

  useEffect(() => {
    if (state.status !== "account") return;
    let cancelled = false;
    loadOrders().catch((err) => {
      capture(err, { context: "orders: get_my_orders" });
      if (!cancelled) setError(t("storeAccount.error.generic"));
    });
    return () => {
      cancelled = true;
    };
  }, [state.status, t, loadOrders]);

  const handleCancel = async (order: MyOrder) => {
    if (!window.confirm("Захиалга цуцлах уу?")) return;
    setCancellingId(order.id);
    try {
      const supabase = createClient() as SupabaseClient;
      const { error: rpcError } = await supabase.rpc("cancel_my_order", {
        p_slug: slug,
        p_order_id: order.id,
      });
      if (rpcError) throw rpcError;
      toast.success("Захиалга цуцалсан");
      await loadOrders();
    } catch (err) {
      capture(err, { context: "orders: cancel order" });
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
      setCancellingId(null);
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
          <Link href={`/${slug}/account`}>
            {t("storeAccount.orders.loginCta")}
          </Link>
        </Button>
      </div>
    );
  }

  if (state.status === "account" && orders === null && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("storeAccount.orders.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("storeAccount.login.description")}
        </p>
      </div>

      {error && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {orders && orders.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Receipt className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("storeAccount.orders.empty")}
          </p>
        </div>
      )}

      {orders?.map((order) => (
        <div
          key={order.id}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">
                {order.invoice_number ?? order.id.slice(0, 8)}
              </span>
              {order.created_at && (
                <span className="text-xs text-muted-foreground">
                  {formatDate(order.created_at)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {order.delivery_type === "delivery" && order.delivery_status && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {DELIVERY_STATUS_LABELS[order.delivery_status] ??
                    order.delivery_status}
                </span>
              )}
              {order.status && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              )}
              <span className="text-sm font-bold tabular-nums">
                {formatCurrency(Number(order.total_amount ?? 0))}
              </span>
              {order.status === "pending" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={cancellingId === order.id}
                  onClick={() => handleCancel(order)}
                >
                  {cancellingId === order.id ? (
                    <Spinner className="size-3.5" />
                  ) : null}
                  Захиалга цуцлах
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href={`/${slug}/account/orders/${order.id}`}>
                  {t("storeAccount.orders.detail")}
                </Link>
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-border/60">
            {order.items.map((item, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: line items are a static snapshot, no stable id
                key={`${item.product_id ?? "item"}-${index}`}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {item.name ?? "—"}{" "}
                  <span className="text-xs text-muted-foreground/60">
                    ×{item.quantity}
                  </span>
                </span>
                <span className="ml-3 shrink-0 font-medium tabular-nums">
                  {formatCurrency(Number(item.total_price ?? 0))}
                </span>
              </li>
            ))}
            {order.items.length === 0 && (
              <li className="px-4 py-2.5 text-sm text-muted-foreground">
                {t("storeAccount.orders.items")}: —
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
