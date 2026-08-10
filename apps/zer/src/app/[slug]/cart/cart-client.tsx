"use client";

import {
  CheckCircle,
  Minus,
  Package,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  StorefrontCartProvider,
  useStorefrontCart,
} from "@/components/storefront/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/format";
import { getCartItemKey } from "@/lib/shop-cart";
import { buildOrderItems, createIdempotencyKey } from "@/lib/storefront-order";
import { createClient } from "@/lib/supabase/client";

const STATUS_LABELS: Record<string, string> = {
  completed: "Гүйцэтгэсэн",
  pending: "Хүлээгдэж буй",
  cancelled: "Цуцалсан",
  refunded: "Буцаагдсан",
  failed: "Амжилтгүй",
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Бэлэн" },
  { value: "card", label: "Карт" },
] as const;

export type CartOrg = {
  name: string;
  slug: string;
  currency: string;
};

export type SubmittedOrder = {
  order_id: string;
  status: string;
  total_amount: number;
};

export function CartClient({
  slug,
  organization,
}: {
  slug: string;
  organization: CartOrg;
}) {
  return (
    <StorefrontCartProvider>
      <CartView slug={slug} organization={organization} />
    </StorefrontCartProvider>
  );
}

function CartView({
  slug,
  organization,
}: {
  slug: string;
  organization: CartOrg;
}) {
  const { items, total, removeItem, updateQuantity, clear } =
    useStorefrontCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<SubmittedOrder | null>(null);
  // Created once per checkout session and reused across retries so the RPC
  // returns the same order instead of creating a duplicate.
  const idempotencyKeyRef = useRef<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      setError("Нэрээ оруулна уу.");
      return;
    }
    if (!/^\d{8,12}$/.test(trimmedPhone)) {
      setError("Утасны дугаар 8-12 оронтой тоо байх ёстой.");
      return;
    }
    if (items.length === 0) {
      setError("Сагс хоосон байна.");
      return;
    }

    if (idempotencyKeyRef.current === null) {
      idempotencyKeyRef.current = createIdempotencyKey();
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "submit_shop_order",
        {
          p_org_slug: slug,
          p_items: buildOrderItems(items),
          p_payment_method: paymentMethod,
          p_contact_name: trimmedName,
          p_contact_phone: trimmedPhone,
          p_currency_code: organization.currency,
          p_idempotency_key: idempotencyKeyRef.current,
        },
      );
      if (rpcError) throw rpcError;

      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (!row) {
        throw new Error("submit_shop_order returned no order row");
      }

      clear();
      setOrder(row);
    } catch (err) {
      capture(err, { context: "storefront: submit order" });
      // Keep cart intact; retry uses the same idempotency key.
      setError(
        "Захиалга илгээхэд алдаа гарлаа. Холболтоо шалгаад дахин оролдоно уу.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-3xl p-4 sm:p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="size-8 text-emerald-500" />
                <div>
                  <CardTitle>Захиалга амжилттай үүслээ</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Захиалгын дугаар: {order.order_id}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Нийт дүн</span>
                <span className="font-bold tabular-nums">
                  {formatCurrency(Number(order.total_amount ?? 0))}{" "}
                  {organization.currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Төлөв</span>
                <span>{STATUS_LABELS[order.status] ?? order.status}</span>
              </div>
              <Separator />
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button asChild>
                  <Link href={`/${slug}/account/orders`}>Захиалгын түүх</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/${slug}/products`}>Худалдаа үргэлжлүүлэх</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Сагс
          </h1>
          <p className="text-sm text-muted-foreground">{organization.name}</p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <Package className="size-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Сагс хоосон байна</p>
              <Button asChild variant="outline">
                <Link href={`/${slug}/products`}>Бүтээгдэхүүн үзэх</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Бүтээгдэхүүнүүд</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => {
                  const key = getCartItemKey(item);
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-4 rounded-lg border border-border/80 bg-card/50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        {item.variantLabels && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.variantLabels}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatCurrency(Number(item.unitPrice))}{" "}
                          {organization.currency} / {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled={item.quantity <= 1}
                          aria-label="Тоо хэмжээ хасах"
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          aria-label="Тоо хэмжээ нэмэх"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      <div className="w-28 text-right text-sm font-semibold tabular-nums">
                        {formatCurrency(Number(item.unitPrice) * item.quantity)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`${item.name} сагснаас хасах`}
                        onClick={() => removeItem(key)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  );
                })}

                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Нийт</span>
                  <span className="text-lg font-bold tabular-nums">
                    {formatCurrency(Number(total))} {organization.currency}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Худалдан авалт</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                  noValidate
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="checkout-name">Нэр</Label>
                    <Input
                      id="checkout-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Таны нэр"
                      autoComplete="name"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="checkout-phone">Утас</Label>
                    <Input
                      id="checkout-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="99112233"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Төлбөрийн хэлбэр</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v ?? "cash")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Төлбөрийн хэлбэр сонгох" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting || items.length === 0}
                  >
                    {submitting && <Spinner className="mr-2" />}
                    {submitting ? "Илгээж байна..." : "Худалдан авалт"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
