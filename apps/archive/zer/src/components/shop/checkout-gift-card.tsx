"use client";

import { X } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { validateGiftCardCode } from "@/app/(dashboard)/shop/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CheckoutGiftCardProps {
  cartTotal: number;
  onGiftCardApplied: (amount: number, cardId: string) => void;
  onGiftCardRemoved: () => void;
}

export function CheckoutGiftCard({
  cartTotal,
  onGiftCardApplied,
  onGiftCardRemoved,
}: CheckoutGiftCardProps) {
  const [code, setCode] = useState("");
  const [isApplied, setIsApplied] = useState(false);
  const [giftCardAmount, setGiftCardAmount] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");
  const [_appliedCardId, setAppliedCardId] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setIsPending(true);
    try {
      const result = await validateGiftCardCode(trimmed, cartTotal);
      if (!result.valid || result.error) {
        toast.error(result.error || "Бэлгийн карт хэрэглэх боломжгүй байна.");
        return;
      }
      if (result.redeemable_amount <= 0) {
        toast.error("Бэлгийн картаар төлөх дүн байхгүй байна.");
        return;
      }
      setIsApplied(true);
      setGiftCardAmount(result.redeemable_amount);
      setRemainingBalance(result.current_balance - result.redeemable_amount);
      setAppliedCode(trimmed);
      setAppliedCardId(result.gift_card_id);
      onGiftCardApplied(result.redeemable_amount, result.gift_card_id);
    } catch {
      toast.error("Бэлгийн картын код шалгахад алдаа гарлаа.");
    } finally {
      setIsPending(false);
    }
  };

  const handleRemove = () => {
    setIsApplied(false);
    setGiftCardAmount(0);
    setRemainingBalance(0);
    setCode("");
    setAppliedCode("");
    setAppliedCardId("");
    onGiftCardRemoved();
  };

  if (isApplied) {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/20">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              Бэлгийн карт хэрэглэсэн
            </span>
            <span className="text-xs text-muted-foreground">{appliedCode}</span>
            <span className="text-lg font-bold text-violet-700 dark:text-violet-400">
              -{giftCardAmount.toLocaleString()}₮
            </span>
            {remainingBalance > 0 && (
              <span className="text-xs text-muted-foreground">
                Үлдэгдэл: {remainingBalance.toLocaleString()}₮
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Бэлгийн карт арилгах"
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
        Бэлгийн карт
      </span>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Картын код оруулах"
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
