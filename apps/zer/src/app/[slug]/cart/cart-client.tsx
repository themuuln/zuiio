"use client";

import {
  CheckCircle,
  Minus,
  Package,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import type { SupabaseClient } from "@supabase/supabase-js";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
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
  { value: "qpay", label: "QPay" },
  { value: "bank_transfer", label: "Банкны шилжүүлэг" },
] as const;

export type CartOrg = {
  name: string;
  slug: string;
  currency: string;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryFeeAmount: number | null;
  freeDeliveryThreshold: number | null;
};

export type StorefrontBranch = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
};

export type PaymentInstructions = {
  bank_name?: string | null;
  bank_account?: string | null;
  account_name?: string | null;
  qpay_qr_url?: string | null;
} | null;

export type SubmittedOrder = {
  order_id: string;
  status: string;
  total_amount: number;
  delivery_fee?: number | null;
  discount_amount?: number | null;
  gift_card_amount?: number | null;
  payment_instructions?: PaymentInstructions;
};

type DeliveryType = "delivery" | "pickup" | null;

function defaultDeliveryType(org: CartOrg): DeliveryType {
  if (org.pickupEnabled && !org.deliveryEnabled) return "pickup";
  if (org.deliveryEnabled && !org.pickupEnabled) return "delivery";
  if (org.pickupEnabled) return "pickup";
  return null;
}

export function CartClient({
  slug,
  organization,
  branches = [],
}: {
  slug: string;
  organization: CartOrg;
  branches?: StorefrontBranch[];
}) {
  return (
    <StorefrontCartProvider>
      <CartView slug={slug} organization={organization} branches={branches} />
    </StorefrontCartProvider>
  );
}

function CartView({
  slug,
  organization,
  branches,
}: {
  slug: string;
  organization: CartOrg;
  branches: StorefrontBranch[];
}) {
  const { items, total, removeItem, updateQuantity, clear } =
    useStorefrontCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(() =>
    defaultDeliveryType(organization),
  );
  const [pickupBranchSlug, setPickupBranchSlug] = useState("");
  const [address, setAddress] = useState("");
  const [addressNote, setAddressNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<SubmittedOrder | null>(null);
  // Created once per checkout session and reused across retries so the RPC
  // returns the same order instead of creating a duplicate.
  const idempotencyKeyRef = useRef<string | null>(null);
  // The cart is cleared on success, so snapshot the pre-clear subtotal and the
  // submitted delivery type for the confirmation breakdown.
  const submittedSubtotalRef = useRef(0);
  const submittedDeliveryTypeRef = useRef<DeliveryType>(null);

  const showDeliveryChoice =
    organization.deliveryEnabled || organization.pickupEnabled;
  const showBranchPicker = deliveryType === "pickup" && branches.length > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedCoupon = couponCode.trim();
    const trimmedGiftCard = giftCardCode.trim();
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
    if (deliveryType === "delivery" && !address.trim()) {
      setError("Хүргэлтийн хаягаа оруулна уу.");
      return;
    }

    if (idempotencyKeyRef.current === null) {
      idempotencyKeyRef.current = createIdempotencyKey();
    }

    setSubmitting(true);
    try {
      // submit_shop_order's delivery/coupon/gift-card params were added by the
      // backend migration after the generated types snapshot; call through the
      // untyped client until types regenerate (repo pattern for new RPC args).
      const supabase = createClient() as SupabaseClient;
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
          p_delivery_type: deliveryType,
          p_address: deliveryType === "delivery" ? address.trim() : null,
          p_address_note:
            deliveryType === "delivery" && addressNote.trim()
              ? addressNote.trim()
              : null,
          p_contact_email: trimmedEmail || null,
          p_coupon_code: trimmedCoupon || null,
          p_gift_card_code: trimmedGiftCard || null,
          p_pickup_branch_slug:
            deliveryType === "pickup" ? pickupBranchSlug || null : null,
        },
      );
      if (rpcError) throw rpcError;

      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (!row) {
        throw new Error("submit_shop_order returned no order row");
      }

      submittedSubtotalRef.current = Number(total);
      submittedDeliveryTypeRef.current = deliveryType;
      clear();
      setOrder(row);
    } catch (err) {
      capture(err, { context: "storefront: submit order" });
      // Keep cart intact; retry uses the same idempotency key.
      // PostgREST surfaces server-raised, user-facing Mongolian messages
      // (coupon / gift-card / stock errors) in the RPC error's `message` field
      // — surface those verbatim instead of the generic fallback. Always
      // rendered as text content, never dangerouslySetInnerHTML, and never a
      // stack trace.
      const message =
        err && typeof err === "object" && "message" in err ? err.message : null;
      setError(
        typeof message === "string" && message.trim() !== ""
          ? message
          : "Захиалга илгээхэд алдаа гарлаа. Холболтоо шалгаад дахин оролдоно уу.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    const subtotal = submittedSubtotalRef.current;
    const discount = Number(order.discount_amount ?? 0);
    const deliveryFee = Number(order.delivery_fee ?? 0);
    const giftCard = Number(order.gift_card_amount ?? 0);
    const instructions = order.payment_instructions;
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
                <span className="text-muted-foreground">Барааны дүн</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(subtotal)} {organization.currency}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Хямдрал</span>
                  <span className="font-medium tabular-nums text-emerald-600">
                    −{formatCurrency(discount)} {organization.currency}
                  </span>
                </div>
              )}
              {deliveryFee > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Хүргэлт</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(deliveryFee)} {organization.currency}
                  </span>
                </div>
              ) : submittedDeliveryTypeRef.current === "delivery" ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Хүргэлт</span>
                  <span className="font-medium text-emerald-600">Үнэгүй</span>
                </div>
              ) : null}
              {giftCard > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Бэлгийн карт</span>
                  <span className="font-medium tabular-nums text-emerald-600">
                    −{formatCurrency(giftCard)} {organization.currency}
                  </span>
                </div>
              )}
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
              {instructions && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium">Төлбөрийн мэдээлэл</p>
                  {instructions.qpay_qr_url ? (
                    // biome-ignore lint/performance/noImgElement: external QPay QR image
                    <img
                      src={instructions.qpay_qr_url}
                      alt="QPay QR код"
                      className="mx-auto mt-2 size-40 rounded-lg"
                    />
                  ) : (
                    (instructions.bank_name ||
                      instructions.bank_account ||
                      instructions.account_name) && (
                      <div className="mt-2 space-y-1 text-sm">
                        {instructions.bank_name && (
                          <p>
                            <span className="text-muted-foreground">
                              Банк:{" "}
                            </span>
                            {instructions.bank_name}
                          </p>
                        )}
                        {instructions.bank_account && (
                          <p>
                            <span className="text-muted-foreground">
                              Данс:{" "}
                            </span>
                            {instructions.bank_account}
                          </p>
                        )}
                        {instructions.account_name && (
                          <p>
                            <span className="text-muted-foreground">
                              Данс эзэмшигч:{" "}
                            </span>
                            {instructions.account_name}
                          </p>
                        )}
                      </div>
                    )
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Төлбөр хийсний дараа манай ажилтнууд захиалгыг
                    баталгаажуулна.
                  </p>
                </div>
              )}
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
                    <Label htmlFor="checkout-email">Имэйл</Label>
                    <Input
                      id="checkout-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                    />
                  </div>
                  {showDeliveryChoice && (
                    <div className="flex flex-col gap-2">
                      <Label>Хүлээн авах арга</Label>
                      <RadioGroup
                        value={deliveryType ?? undefined}
                        onValueChange={(value) =>
                          setDeliveryType(
                            value === "delivery" || value === "pickup"
                              ? value
                              : null,
                          )
                        }
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        {organization.pickupEnabled && (
                          <label
                            htmlFor="checkout-pickup"
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
                          >
                            <RadioGroupItem
                              value="pickup"
                              id="checkout-pickup"
                            />
                            Дэлгүүрээс авах
                          </label>
                        )}
                        {organization.deliveryEnabled && (
                          <label
                            htmlFor="checkout-delivery"
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
                          >
                            <RadioGroupItem
                              value="delivery"
                              id="checkout-delivery"
                            />
                            Хүргүүлэх
                          </label>
                        )}
                      </RadioGroup>
                    </div>
                  )}
                  {showBranchPicker && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="checkout-branch">Салбар сонгох</Label>
                      <Select
                        value={pickupBranchSlug}
                        onValueChange={(v) => setPickupBranchSlug(v ?? "")}
                      >
                        <SelectTrigger id="checkout-branch">
                          <SelectValue placeholder="Салбар сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.slug} value={branch.slug}>
                              {branch.address
                                ? `${branch.name} — ${branch.address}`
                                : branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {deliveryType === "delivery" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="checkout-address">Хаяг</Label>
                        <Textarea
                          id="checkout-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="СБД, 1-р хороо, ..."
                          rows={3}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="checkout-address-note">
                          Нэмэлт мэдээлэл
                        </Label>
                        <Input
                          id="checkout-address-note"
                          value={addressNote}
                          onChange={(e) => setAddressNote(e.target.value)}
                          placeholder="Орц, давхар, тоот"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="checkout-coupon">Купон код</Label>
                    <Input
                      id="checkout-coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Купон код"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="checkout-gift-card">
                      Бэлгийн картын код
                    </Label>
                    <Input
                      id="checkout-gift-card"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      placeholder="Бэлгийн картын код"
                      autoComplete="off"
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
