"use client";

import {
  Bank,
  CashRegister,
  CreditCard,
  FileText,
  ShoppingCart,
  Spinner,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { createShopSale } from "@/app/(dashboard)/shop/actions";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { CustomerPicker } from "@/components/shop/customer-picker";
import { NumericKeypad } from "@/components/shop/numeric-keypad";
import { Button } from "@/components/ui/button";
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
import { createClient } from "@/lib/supabase/client";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
};

const paymentMethods = [
  { value: "cash", label: "Бэлэн", icon: CashRegister },
  { value: "card", label: "Карт", icon: CreditCard },
  { value: "bank_transfer", label: "Данс", icon: Bank },
  { value: "invoice", label: "Нэхэмжлэл", icon: FileText },
] as const;

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Customer state
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmountStr, setPaidAmountStr] = useState("0");
  const [showKeypad, setShowKeypad] = useState(false);

  // Hidden fields ref for setting form values programmatically
  const itemsInputRef = useRef<HTMLInputElement>(null);
  const paymentMethodInputRef = useRef<HTMLInputElement>(null);
  const paidAmountInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const customerPhoneInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const paidAmount = Number(paidAmountStr) || 0;
  const change = paidAmount > totalAmount ? paidAmount - totalAmount : 0;

  const isFormValid =
    items.length > 0 && paymentMethod && paidAmount >= totalAmount;

  // Fetch contacts on mount
  useEffect(() => {
    async function fetchContacts() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("contacts")
          .select("id, name, phone")
          .eq("type", "customer")
          .order("name");
        if (data) {
          setContacts(data);
        }
      } catch {
        // Silently fail — contacts are optional for walk-in
      }
    }
    fetchContacts();
  }, []);

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

  const [state, formAction, isPending] = useActionState(
    async (prev: { error?: string } | undefined, formData: FormData) => {
      handleFormSubmit(formData);
      return createShopSale(prev, formData);
    },
    undefined,
  );

  // On successful sale, clear cart and navigate to receipt
  useEffect(() => {
    if (state && "saleId" in state && state.saleId) {
      clearCart();
      router.push(`/shop/receipt/${state.saleId}`);
    }
  }, [state, clearCart, router]);

  // Guard: empty cart
  if (items.length === 0) {
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
          <Button render={<Link href="/shop" />} size="lg">
            Бараа үзэх
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-5 pb-28"
    >
      <h1 className="text-lg font-semibold">Төлбөр тооцоо</h1>

      {/* Hidden fields — set dynamically before submission */}
      <input type="hidden" name="items" ref={itemsInputRef} />
      <input type="hidden" name="payment_method" ref={paymentMethodInputRef} />
      <input type="hidden" name="paid_amount" ref={paidAmountInputRef} />
      <input type="hidden" name="customer_name" ref={customerNameInputRef} />
      <input type="hidden" name="customer_phone" ref={customerPhoneInputRef} />

      {/* Customer section */}
      <section className="flex flex-col gap-3">
        <CustomerPicker
          contacts={contacts}
          selectedContactId={selectedContactId}
          customerName={customerName}
          customerPhone={customerPhone}
          onSelectContact={handleSelectContact}
          onNameChange={handleNameChange}
          onPhoneChange={handlePhoneChange}
        />
      </section>

      {/* Order summary */}
      <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <span className="text-sm font-medium text-muted-foreground">
          Захиалга
        </span>
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">
                {item.name}{" "}
                <span className="text-xs text-muted-foreground/60">
                  ×{item.quantity}
                </span>
              </span>
              <span className="font-medium tabular-nums">
                {(item.unitPrice * item.quantity).toLocaleString()}₮
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 border-t border-border pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Нийт дүн</span>
            <span className="text-lg font-bold tabular-nums">
              {totalAmount.toLocaleString()}₮
            </span>
          </div>
        </div>
      </section>

      {/* Payment method */}
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Төлбөрийн хэлбэр
        </span>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value: string) => setPaymentMethod(value)}
          className="grid grid-cols-2 gap-2"
        >
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Label
                key={method.value}
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-xs transition-colors has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
              >
                <RadioGroupItem value={method.value} className="sr-only" />
                <Icon className="size-5" />
                <span>{method.label}</span>
              </Label>
            );
          })}
        </RadioGroup>
      </section>

      {/* Paid amount */}
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Төлсөн дүн
        </span>

        {/* Amount display — clickable to open keypad */}
        <button
          type="button"
          className="flex h-[56px] w-full items-center justify-end rounded-xl border border-border bg-card px-4 text-right text-2xl font-bold tabular-nums"
          onClick={() => setShowKeypad(!showKeypad)}
        >
          {paidAmount.toLocaleString()}₮
        </button>

        {/* Numeric keypad */}
        {showKeypad && (
          <NumericKeypad
            value={paidAmountStr}
            onChange={(v) => setPaidAmountStr(v)}
            onConfirm={() => setShowKeypad(false)}
            confirmLabel="Батлах"
          />
        )}

        {/* Change display */}
        {paidAmount > totalAmount && (
          <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 dark:bg-green-950/20">
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Өөрчлөлт
            </span>
            <span className="text-lg font-bold text-green-700 dark:text-green-400 tabular-nums">
              {change.toLocaleString()}₮
            </span>
          </div>
        )}
      </section>

      {/* Error message */}
      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        size="lg"
        className="sticky bottom-24 mt-2 h-[56px] w-full text-sm font-semibold"
        disabled={!isFormValid || isPending}
      >
        {isPending ? (
          <>
            <Spinner className="mr-2 size-4 animate-spin" />
            Үүсгэж байна...
          </>
        ) : (
          "Борлуулалт үүсгэх"
        )}
      </Button>
    </form>
  );
}
