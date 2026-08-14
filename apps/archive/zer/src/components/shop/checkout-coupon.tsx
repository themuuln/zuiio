"use client";

import { X } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { validateCouponCode } from "@/app/(dashboard)/shop/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CheckoutCouponProps {
  cartTotal: number;
  onDiscountApplied: (
    discountAmount: number,
    couponId: string,
    couponCode: string,
  ) => void;
  onDiscountRemoved: () => void;
  contactId?: string | null;
}

export function CheckoutCoupon({
  cartTotal,
  onDiscountApplied,
  onDiscountRemoved,
  contactId,
}: CheckoutCouponProps) {
  const [code, setCode] = useState("");
  const [isApplied, setIsApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setIsPending(true);
    try {
      const result = await validateCouponCode(
        trimmed,
        cartTotal,
        contactId ?? undefined,
      );
      if (!result.valid || result.error) {
        toast.error(result.error || "Купон хэрэглэх боломжгүй байна.");
        return;
      }
      setIsApplied(true);
      setDiscountAmount(result.discount_amount);
      setAppliedCode(trimmed);
      onDiscountApplied(result.discount_amount, result.coupon_id, trimmed);
    } catch {
      toast.error("Купоны код шалгахад алдаа гарлаа.");
    } finally {
      setIsPending(false);
    }
  };

  const handleRemove = () => {
    setIsApplied(false);
    setDiscountAmount(0);
    setCode("");
    setAppliedCode("");
    onDiscountRemoved();
  };

  if (isApplied) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              Купон хэрэглэсэн
            </span>
            <span className="text-xs text-muted-foreground">{appliedCode}</span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              -{discountAmount.toLocaleString()}₮
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Купон арилгах"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <span className="mb-3 block text-xs font-medium text-muted-foreground">
        Купон код
      </span>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Код оруулах"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleApply}
          disabled={!code.trim() || isPending}
        >
          {isPending ? "..." : "Хэрэглэх"}
        </Button>
      </div>
    </div>
  );
}
