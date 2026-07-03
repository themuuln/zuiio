"use client";

import { Trash2 } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Typography } from "@/components/ui/typography";
import { formatCurrency } from "@/lib/utils";

/**
 * A reusable service line row for editing a single service item.
 *
 * Handles quantity, price, discount, and final price display.
 * Used in the bay-view detail drawer, wizard, and work-order detail drawer.
 *
 * @remarks
 * Price editing uses CurrencyInput (type="text" + inputMode="numeric")
 * to avoid React's broken `<input type="number">` controlled input behavior
 * where intermediate states (e.g. typing "1" before "2") get lost.
 */
export interface ServiceLineRowProps {
  /** Service name */
  name: string;
  /** Mongolian name (optional — shown when locale is "mn") */
  nameMn?: string | null;
  /** Quantity */
  quantity: number;
  /** Unit price */
  unitPrice: number;
  /** Final price (unitPrice * quantity - discounts) */
  finalPrice: number;
  /** Discount amount in MNT */
  discountAmount?: number;
  /** Discount percentage */
  discountPercent?: number;
  /** Last price from price history (for comparison badge) */
  lastPrice?: number;
  /** Locale for name display */
  locale?: string;
  /** Disable editing */
  readOnly?: boolean;
  /** Quantity change callback */
  onQuantityChange?: (qty: number) => void;
  /** Price change callback */
  onPriceChange?: (price: number) => void;
  /** Discount amount change callback */
  onDiscountAmountChange?: (amount: number) => void;
  /** Discount percent change callback */
  onDiscountPercentChange?: (percent: number) => void;
  /** Delete callback */
  onDelete?: () => void;
  /** Delete button aria label */
  deleteLabel?: string;
  /** Translations function for dynamic labels */
  t?: (key: string) => string;
}

export function ServiceLineRow({
  name,
  nameMn,
  quantity,
  unitPrice,
  finalPrice,
  discountAmount,
  discountPercent,
  lastPrice,
  locale = "en",
  readOnly = false,
  onQuantityChange,
  onPriceChange,
  onDiscountAmountChange,
  onDiscountPercentChange,
  onDelete,
  deleteLabel = "Remove",
  t,
}: ServiceLineRowProps) {
  const displayName = locale === "mn" && nameMn ? nameMn : name;
  const hasDiscount = (discountAmount ?? 0) > 0 || (discountPercent ?? 0) > 0;
  // Label for translations
  const tt = t ?? ((k: string) => k);

  return (
    <div className="group flex flex-wrap items-center gap-2 p-3 hover:bg-muted/20 rounded-lg transition-colors">
      {/* Name */}
      <div className="flex-1 min-w-[120px]">
        <Typography.Text className="text-sm font-medium truncate block">
          {displayName}
        </Typography.Text>
        {lastPrice && lastPrice > 0 && lastPrice !== unitPrice && (
          <Typography.Text
            className={`text-[11px] ${unitPrice <= lastPrice ? "text-green-600" : "text-amber-600"}`}
          >
            {unitPrice <= lastPrice ? "✓ " : "↑ "}
            {`Last: ${formatCurrency(lastPrice)}`}
          </Typography.Text>
        )}
      </div>

      {/* Quantity */}
      {readOnly ? (
        <span className="text-sm text-muted-foreground min-w-[3ch] text-center">
          {quantity}
        </span>
      ) : (
        <NumericInput
          value={quantity}
          onChange={(qty) => onQuantityChange?.(Math.max(1, Math.round(qty)))}
          min={1}
          size="lg"
          align="center"
          className="w-16"
          aria-label="Quantity"
        />
      )}

      {/* Unit Price */}
      {readOnly ? (
        <span className="text-sm font-semibold tabular-nums min-w-[5rem] text-right">
          {formatCurrency(unitPrice)}
        </span>
      ) : (
        <CurrencyInput
          value={unitPrice}
          onChange={onPriceChange}
          size="lg"
          className="w-28"
          aria-label="Price"
        />
      )}

      {/* Discount */}
      {!readOnly && onDiscountAmountChange && (
        <CurrencyInput
          value={discountAmount ?? 0}
          onChange={onDiscountAmountChange}
          size="lg"
          className="w-24"
          placeholder="Disc."
          aria-label="Discount"
        />
      )}

      {/* Final price */}
      <span
        className={`w-24 text-right text-sm font-semibold tabular-nums shrink-0 ${hasDiscount ? "text-primary" : ""}`}
      >
        {formatCurrency(finalPrice)}
      </span>

      {/* Delete */}
      {!readOnly && onDelete && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDelete}
          className="min-w-[44px]"
          aria-label={deleteLabel}
        >
          <Trash2 className="size-5 text-destructive" />
        </Button>
      )}
    </div>
  );
}
