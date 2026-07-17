"use client";

import {
  Bank,
  CaretDown,
  CaretUp,
  CashRegister,
  CreditCard,
  FileText,
  ShoppingCart,
  User,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createShopSale } from "@/app/(dashboard)/shop/actions";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { CustomerPicker } from "@/components/shop/customer-picker";
import { StaffPicker } from "@/components/shop/staff-picker";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  type CurrencyOption,
  CurrencySelector,
} from "@/components/ui/currency-selector";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useOrgSettings } from "@/lib/org-settings-context";
import { productKeys, saleKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
};

const paymentMethods = [
  { value: "card", label: "Карт", icon: CreditCard },
  { value: "bank_transfer", label: "Данс", icon: Bank },
  { value: "cash", label: "Бэлэн", icon: CashRegister },
  { value: "invoice", label: "Нэхэмжлэл", icon: FileText },
] as const;

/** Colors for each payment method when selected */
const paymentColors: Record<
  string,
  { border: string; bg: string; text: string; ring: string }
> = {
  card: {
    border: "border-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
  },
  bank_transfer: {
    border: "border-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/20",
  },
  cash: {
    border: "border-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
  },
  invoice: {
    border: "border-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
  },
};

/** Quick amount presets based on common Mongolian banknote denominations */
const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

/**
 * Checkout form rendered inside the checkout drawer.
 * `onClose` closes the drawer (called on success before navigating to the receipt).
 */
export function CheckoutForm({
  onClose,
  onReceiptOpen,
  onStateChange,
}: {
  onClose?: () => void;
  onReceiptOpen?: (saleId: string) => void;
  onStateChange?: (state: {
    isFormValid: boolean;
    isPending: boolean;
    totalAmount: number;
  }) => void;
}) {
  const { items, totalAmount, clearCart } = useCart();
  const { hasCheckoutCustomer, hasCheckoutQuickAmounts, hasReceiptDrawer } =
    useOrgSettings();
  const router = useRouter();
  // Fetch contacts (skipped when the org doesn't register customers at checkout)
  const { data: contacts = [] } = useQuery({
    queryKey: ["checkout", "contacts"],
    enabled: hasCheckoutCustomer,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, phone")
        .eq("type", "customer")
        .order("name");
      if (error) {
        capture(error, { context: "[checkout] fetch contacts" });
        throw error;
      }
      return data ?? [];
    },
  });

  // Fetch available currencies
  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const response = await fetch("/api/currencies");
      const result = await response.json();
      return result.currencies ?? [];
    },
  });

  // Customer state
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [orderExpanded, setOrderExpanded] = useState(true);

  // Payment state — paid amount defaults to the full total so the common
  // exact-payment sale is a single Enter press.
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>({
    id: "mnt",
    code: "MNT",
    name: "Монгол төгрөг",
    symbol: "₮",
    exchange_rate: 1.0,
    is_default: true,
  });
  const [paidAmountStr, setPaidAmountStr] = useState(() => String(totalAmount));
  const paidInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus after the drawer's open animation / focus manager settles.
    const timer = setTimeout(() => {
      paidInputRef.current?.focus();
      paidInputRef.current?.select();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Hidden fields refs
  const itemsInputRef = useRef<HTMLInputElement>(null);
  const paymentMethodInputRef = useRef<HTMLInputElement>(null);
  const paidAmountInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const customerPhoneInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const paidAmount = Number(paidAmountStr) || 0;
  const change = paidAmount > totalAmount ? paidAmount - totalAmount : 0;
  const isExactAmount = paidAmount === totalAmount;

  const isFormValid =
    items.length > 0 && !!paymentMethod && paidAmount >= totalAmount;

  const handleSelectContact = (contact: Contact | null) => {
    setSelectedContactId(contact?.id ?? null);
  };

  const handleNameChange = (name: string) => {
    setCustomerName(name);
  };

  const handlePhoneChange = (phone: string) => {
    setCustomerPhone(phone);
  };

  // Set hidden fields before form submission
  const queryClient = useQueryClient();

  const handleFormSubmit = (formData: FormData) => {
    formData.set(
      "items",
      JSON.stringify(
        items.map((i) => ({
          productId: i.productId,
          name: i.name,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          unit: i.unit,
          variantId: i.variantId,
        })),
      ),
    );
    formData.set("payment_method", paymentMethod);
    formData.set("paid_amount", String(paidAmount));
    if (customerName) {
      formData.set("customer_name", customerName);
      if (customerPhone) {
        formData.set("customer_phone", customerPhone);
      }
    }
  };

  // useMutation wrapping createShopSale with optimistic updates
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createShopSale(undefined, formData);
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: saleKeys.all() });
      await queryClient.cancelQueries({ queryKey: productKeys.all() });

      const previousSales = queryClient.getQueriesData({
        queryKey: saleKeys.all(),
      });
      const previousProducts = queryClient.getQueriesData({
        queryKey: productKeys.all(),
      });

      const itemsRaw = formData.get("items")?.toString();
      if (itemsRaw) {
        try {
          const cartItems = JSON.parse(itemsRaw) as Array<{
            productId: string;
            name: string;
            unitPrice: number;
            quantity: number;
          }>;
          const totalAmount = cartItems.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0,
          );
          const paid = Number(formData.get("paid_amount") ?? 0);
          const payMethod =
            formData.get("payment_method")?.toString() || "cash";
          const custName = formData.get("customer_name")?.toString();

          const optimisticSale = {
            id: `opt-${Date.now()}`,
            total_amount: totalAmount,
            paid_amount: paid,
            payment_method: payMethod,
            status: "completed",
            sale_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            contact_id: null,
            contacts: custName ? { name: custName } : null,
          };

          queryClient.setQueriesData(
            { queryKey: saleKeys.all(), type: "active" },
            (oldData: unknown) => {
              if (Array.isArray(oldData)) {
                return [optimisticSale, ...oldData];
              }
              return oldData;
            },
          );

          queryClient.setQueriesData(
            { queryKey: productKeys.all(), type: "active" },
            (oldData: unknown) => {
              if (Array.isArray(oldData)) {
                return oldData.map((product: Record<string, unknown>) => {
                  const cartItem = cartItems.find(
                    (i) => i.productId === product.id,
                  );
                  if (cartItem) {
                    return {
                      ...product,
                      current_stock: Math.max(
                        0,
                        Number(product.current_stock ?? 0) - cartItem.quantity,
                      ),
                    };
                  }
                  return product;
                });
              }
              return oldData;
            },
          );
        } catch (e) {
          capture(e, { context: "checkout: parse optimistic items" });
          // Items parsing failed — skip optimistic update
        }
      }

      return { previousSales, previousProducts };
    },
    onSuccess: (data) => {
      if (data?.saleId) {
        clearCart();
        onClose?.();
        if (hasReceiptDrawer) {
          if (onReceiptOpen) {
            onReceiptOpen(data.saleId);
          } else {
            router.push(`/shop/receipt/${data.saleId}`);
          }
        }
        // If hasReceiptDrawer is false, just close — no receipt shown
      }
    },
    onError: (err, _formData, context) => {
      if (context?.previousSales) {
        for (const [key, data] of context.previousSales) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousProducts) {
        for (const [key, data] of context.previousProducts) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err?.message || "Алдаа гарлаа");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
    },
  });

  // Report form state upward so CheckoutDrawer can render the footer button
  useEffect(() => {
    onStateChange?.({
      isFormValid,
      isPending: mutation.isPending,
      totalAmount,
    });
  }, [isFormValid, mutation.isPending, totalAmount, onStateChange]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mutation.isPending) return;
    const formData = new FormData(e.currentTarget);
    handleFormSubmit(formData);
    mutation.mutate(formData);
  };

  // Guard: empty cart (skip while the just-completed sale clears the cart)
  if (items.length === 0 && !mutation.isSuccess) {
    return (
      <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShoppingCart className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Сагс хоосон</EmptyTitle>
          <EmptyDescription>
            Төлбөр тооцоо хийхийн тулд сагсандаа бүтээгдэхүүн нэмнэ үү.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" size="lg" onClick={onClose}>
            Бараа үзэх
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <form
      id="checkout-form"
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      {/* Hidden fields */}
      <input type="hidden" name="items" ref={itemsInputRef} />
      <input type="hidden" name="payment_method" ref={paymentMethodInputRef} />
      <input type="hidden" name="paid_amount" ref={paidAmountInputRef} />
      <input type="hidden" name="customer_name" ref={customerNameInputRef} />
      <input type="hidden" name="customer_phone" ref={customerPhoneInputRef} />
      <input type="hidden" name="currency_code" value={selectedCurrency.code} />
      <input
        type="hidden"
        name="currency_symbol"
        value={selectedCurrency.symbol}
      />
      <input
        type="hidden"
        name="exchange_rate"
        value={selectedCurrency.exchange_rate}
      />
      <div className="rounded-xl border border-border bg-card">
        {/* Total row — always visible */}
        <button
          type="button"
          onClick={() => setOrderExpanded(!orderExpanded)}
          aria-expanded={orderExpanded}
          aria-controls="checkout-order-items"
          className="flex w-full items-center justify-between rounded-xl px-4 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              Нийт дүн
            </span>
            <span className="text-2xl font-bold tabular-nums">
              {totalAmount.toLocaleString()}
              {selectedCurrency.symbol}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {items.length} төрлийн {totalQty} ширхэг
            </span>
            {orderExpanded ? (
              <CaretUp className="size-4" />
            ) : (
              <CaretDown className="size-4" />
            )}
          </div>
        </button>

        {/* Expanded item list */}
        {orderExpanded && (
          <>
            <Separator />
            <div
              id="checkout-order-items"
              className="flex flex-col gap-1.5 px-4 py-3"
            >
              {items.map((item) => {
                const lineTotal = item.unitPrice * item.quantity;
                return (
                  <div
                    key={`${item.productId}-${item.variantId ?? ""}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {item.name}{" "}
                      <span className="text-xs text-muted-foreground/60">
                        ×{item.quantity}
                      </span>
                    </span>
                    <span className="ml-3 shrink-0 font-medium tabular-nums">
                      {lineTotal.toLocaleString()}
                      {selectedCurrency.symbol}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* === PAYMENT METHOD === */}
      <div className="rounded-xl border border-border bg-card p-4">
        <span className="mb-3 block text-xs font-medium text-muted-foreground">
          Төлбөрийн хэлбэр
        </span>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value: string) => setPaymentMethod(value)}
          aria-label="Төлбөрийн хэлбэр"
          className="grid grid-cols-4 gap-2"
        >
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = paymentMethod === method.value;
            const color = paymentColors[method.value];
            return (
              <Label
                key={method.value}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition-all",
                  isSelected
                    ? cn(color.border, color.bg, "shadow-sm")
                    : "border-border hover:bg-muted/50",
                )}
              >
                <RadioGroupItem value={method.value} className="sr-only" />
                <Icon
                  className={cn(
                    "size-5",
                    isSelected ? color.text : "text-muted-foreground",
                  )}
                  weight={isSelected ? "fill" : "regular"}
                />
                <span
                  className={cn(
                    "font-medium",
                    isSelected ? color.text : "text-muted-foreground",
                  )}
                >
                  {method.label}
                </span>
              </Label>
            );
          })}
        </RadioGroup>
        {/* Currency selector — only show if org has multiple currencies */}
        {currencies.length > 1 && (
          <div className="mt-3">
            <span className="mb-2 block text-xs font-medium text-muted-foreground">
              Валют
            </span>
            <CurrencySelector
              value={selectedCurrency.id}
              onChange={setSelectedCurrency}
              currencies={currencies}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* === PAID AMOUNT === */}
      <div className="rounded-xl border border-border bg-card p-4">
        <span className="mb-3 block text-xs font-medium text-muted-foreground">
          Төлсөн дүн
        </span>

        {/* Amount input — auto-focused, defaults to the full total */}
        <div className="relative">
          <input
            ref={paidInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-label="Төлсөн дүн"
            value={
              paidAmountStr === "" ? "" : Number(paidAmountStr).toLocaleString()
            }
            onChange={(e) => {
              setPaidAmountStr(e.target.value.replace(/\D/g, "").slice(0, 12));
            }}
            onFocus={(e) => e.target.select()}
            className="h-14 w-full rounded-xl border border-border bg-background pl-4 pr-10 text-right text-2xl font-bold tabular-nums transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
            {selectedCurrency.symbol}
          </span>
        </div>

        {/* Quick amount presets */}
        {hasCheckoutQuickAmounts && (
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Exact amount button */}
            <button
              type="button"
              onClick={() => setPaidAmountStr(String(totalAmount))}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                isExactAmount
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              Яг дүн
            </button>
            {QUICK_AMOUNTS.map((amount) => {
              const isSelected = paidAmount === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setPaidAmountStr(String(amount))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium tabular-nums transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {amount.toLocaleString()}
                  {selectedCurrency.symbol}
                </button>
              );
            })}
          </div>
        )}

        {/* Change display */}
        {paidAmount > totalAmount && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/20">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Өөрчлөлт
            </span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {change.toLocaleString()}
              {selectedCurrency.symbol}
            </span>
          </div>
        )}
      </div>
      {/* === CUSTOMER (collapsible, hidden for orgs without checkout CRM) === */}
      {hasCheckoutCustomer && (
        <Collapsible open={customerOpen} onOpenChange={setCustomerOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-expanded={customerOpen}
              aria-controls="checkout-customer-section"
            >
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {customerName || "Харилцагч"}
                </span>
                {customerName && (
                  <span className="text-xs text-muted-foreground">
                    ({customerPhone || "утасгүй"})
                  </span>
                )}
              </div>
              {customerOpen ? (
                <CaretUp className="size-4 text-muted-foreground" />
              ) : (
                <CaretDown className="size-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div
              id="checkout-customer-section"
              className="rounded-xl border border-border bg-card p-4"
            >
              <CustomerPicker
                contacts={contacts}
                selectedContactId={selectedContactId}
                customerName={customerName}
                customerPhone={customerPhone}
                onSelectContact={handleSelectContact}
                onNameChange={handleNameChange}
                onPhoneChange={handlePhoneChange}
              />
              <div className="mt-4">
                <span className="mb-2 block text-xs font-medium text-muted-foreground">
                  Борлуулагч
                </span>
                <StaffPicker />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      {/* Error message */}
      {mutation.error && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {mutation.error.message}
        </div>
      )}
    </form>
  );
}
