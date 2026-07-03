"use client";

import { TriangleAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Typography } from "@/components/ui/typography";
import { formatCurrency } from "@/lib/utils";

/**
 * A reusable part line row for editing a single part item.
 *
 * Handles name, part number, quantity, price, stock badge, and delete.
 * Used in the bay-view detail drawer, wizard, and work-order detail drawer.
 *
 * Price editing uses CurrencyInput (type="text" + inputMode="numeric")
 * to avoid React's broken `<input type="number">` controlled input behavior.
 */
export interface PartLineRowProps {
  /** Part name */
  name: string;
  /** Mongolian name (optional — shown when locale is "mn") */
  nameMn?: string | null;
  /** Part number */
  partNumber?: string;
  /** Quantity */
  quantity: number;
  /** Unit price */
  unitPrice: number;
  /** Final price (unitPrice * quantity) */
  finalPrice: number;
  /** Discount amount in MNT */
  discountAmount?: number;
  /** Discount percentage */
  discountPercent?: number;
  /** Last price from price history (for comparison badge) */
  lastPrice?: number;
  /** Low stock info (optional — shows warning badge) */
  stockInfo?: { quantity: number; threshold: number } | null;
  /** Locale for name display */
  locale?: string;
  /** Disable editing */
  readOnly?: boolean;
  /** Name change callback (wizard allows editing name inline) */
  onNameChange?: (name: string) => void;
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

export function PartLineRow({
  name,
  nameMn,
  partNumber,
  quantity,
  unitPrice,
  finalPrice,
  discountAmount,
  discountPercent,
  lastPrice,
  stockInfo,
  locale = "en",
  readOnly = false,
  onNameChange,
  onQuantityChange,
  onPriceChange,
  onDiscountAmountChange,
  onDelete,
  deleteLabel = "Remove",
  t,
}: PartLineRowProps) {
  const displayName = locale === "mn" && nameMn ? nameMn : name;
  const isLowStock = stockInfo && quantity >= stockInfo.threshold;
  const hasDiscount = (discountAmount ?? 0) > 0 || (discountPercent ?? 0) > 0;

  return (
    <div className="group flex flex-wrap items-center gap-2 p-3 hover:bg-muted/20 rounded-lg transition-colors">
      {/* Name */}
      <div className="flex-1 min-w-[140px]">
        {readOnly || !onNameChange ? (
          <div className="flex items-center gap-1.5">
            <Typography.Text className="text-sm font-medium truncate">
              {displayName}
            </Typography.Text>
            {isLowStock && (
              <TriangleAlert
                className="size-3 text-yellow-500 shrink-0"
                aria-label="Low stock"
              />
            )}
            {partNumber && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                #{partNumber}
              </span>
            )}
          </div>
        ) : (
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-11"
            placeholder="Part name"
            aria-label="Part name"
          />
        )}
        {stockInfo && (
          <span className="text-[10px] text-muted-foreground/60 tabular-nums">
            Stock: {stockInfo.quantity}
          </span>
        )}
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
          placeholder="Price"
          aria-label="Price"
        />
      )}

      {/* Discount (editable when callbacks provided) */}
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
