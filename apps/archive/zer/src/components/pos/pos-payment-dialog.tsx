"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { NumericKeypad } from "@/components/shop/numeric-keypad";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import {
  computeChange,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/pos";

export type PosPaymentResult = {
  method: PaymentMethod;
  /** Cash tendered; for non-cash methods this is the total. */
  tendered: number;
  customerName?: string;
  customerPhone?: string;
};

/**
 * Register payment: method chips, touch keypad for cash tendered with
 * change calculation, optional customer, and the charge action.
 */
export function PosPaymentDialog({
  open,
  total,
  onOpenChange,
  onConfirm,
  isSubmitting,
  error,
}: {
  open: boolean;
  total: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: PosPaymentResult) => void;
  isSubmitting?: boolean;
  error?: string | null;
}) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Reset state every time the dialog opens for a fresh transaction.
  useEffect(() => {
    if (open) {
      setMethod("cash");
      setTendered("");
      setCustomerName("");
      setCustomerPhone("");
    }
  }, [open]);

  const tenderedValue = Number.parseFloat(tendered);
  const isCash = method === "cash";
  const paid = isCash ? tenderedValue : total;
  // Empty keypad on open parses to NaN — show 0 change, never "₮ NaN".
  const change = Number.isFinite(paid) ? computeChange(paid, total) : 0;
  const canConfirm = !isSubmitting && !Number.isNaN(paid) && paid >= total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Төлбөр</DialogTitle>
          <DialogDescription className="sr-only">
            Төлбөрийн арга болон дүнг оруулна уу
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
          <span className="text-sm text-muted-foreground">Нийт</span>
          <span className="text-2xl font-bold tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((m) => (
            <Button
              key={m}
              type="button"
              variant={method === m ? "default" : "outline"}
              onClick={() => setMethod(m)}
              className="h-11 rounded-xl text-sm"
              aria-pressed={method === m}
            >
              {PAYMENT_METHOD_LABELS[m]}
            </Button>
          ))}
        </div>

        {isCash ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <NumericKeypad
              value={tendered}
              onChange={setTendered}
              maxValue={1_000_000_000}
              className="sm:w-56"
            />
            <div className="flex flex-col justify-between gap-2 sm:w-32">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => setTendered(String(total))}
              >
                Бүрэн дүн
              </Button>
              <div className="rounded-xl border p-3 text-center">
                <p className="text-xs text-muted-foreground">Хариулт</p>
                <p
                  data-testid="pos-change"
                  className="text-lg font-bold tabular-nums text-emerald-600"
                >
                  {formatCurrency(change)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border p-3 text-center">
            <p className="text-xs text-muted-foreground">Төлөх дүн</p>
            <p className="text-xl font-bold tabular-nums">
              {formatCurrency(total)}
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pos-customer-name">Харилцагч (нэмэлт)</Label>
            <Input
              id="pos-customer-name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Нэр"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pos-customer-phone">Утас (нэмэлт)</Label>
            <Input
              id="pos-customer-phone"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Утас"
              inputMode="tel"
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="button"
          size="lg"
          disabled={!canConfirm}
          onClick={() =>
            onConfirm({
              method,
              tendered: isCash ? paid : total,
              ...(customerName.trim()
                ? { customerName: customerName.trim() }
                : {}),
              ...(customerPhone.trim()
                ? { customerPhone: customerPhone.trim() }
                : {}),
            })
          }
          className="h-12 w-full rounded-xl text-base"
        >
          {isSubmitting ? "Хадгалж байна…" : "Батлах"}
          {!isSubmitting && <CaretRight className="size-4" />}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
