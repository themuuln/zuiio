"use client";

import { parseCurrencyInput } from "@zuiio/core";
import { useCallback, useState } from "react";
import { InlineEditableField } from "@zuiio/ui";
import { Typography } from "@/components/ui/typography";
import { cn, formatCurrency } from "@/lib/utils";

/**
 * Shared work-order line item row for services and parts.
 *
 * When edit callbacks and a line item id are provided, quantity and unit price
 * render as inline-editable fields. Otherwise the row renders read-only with the
 * final line total.
 */
export interface LineItemRowProps {
  /** Item display name */
  name: string;
  /** Mongolian name (optional — shown when locale is "mn") */
  nameMn?: string | null;
  /** Quantity */
  quantity?: number;
  /** Unit price before discounts */
  unitPrice?: number;
  /** Discount amount applied to the line */
  discountAmount?: number;
  /** Discount percentage applied to the line */
  discountPercentage?: number;
  /** Final price after quantity and discounts */
  finalPrice: number;
  /** Locale for name display */
  locale?: string;
  /** Line item id — required when edit callbacks are provided */
  lineItemId?: string;
  /** Called when quantity is saved */
  onEditQtySave?: (id: string, qty: number) => Promise<void>;
  /** Called when unit price is saved */
  onEditPriceSave?: (id: string, price: number) => Promise<void>;
  /** When true, service name is not truncated (use in fullscreen) */
  noTruncate?: boolean;
  /** Auto-focus the price input on mount (for newly added items) */
  autoFocusPrice?: boolean;
}

export function LineItemRow({
  name,
  nameMn,
  quantity,
  unitPrice,
  discountAmount,
  discountPercentage,
  finalPrice,
  locale = "en",
  lineItemId,
  onEditQtySave,
  onEditPriceSave,
  noTruncate,
  autoFocusPrice,
}: LineItemRowProps) {
  const displayName = locale === "mn" && nameMn ? nameMn : name;
  const isEditable = !!lineItemId && !!(onEditQtySave || onEditPriceSave);

  const [draftQty, setDraftQty] = useState<number | null>(null);
  const [draftPrice, setDraftPrice] = useState<number | null>(null);

  const handleQtyChange = useCallback((val: number) => {
    setDraftQty(val);
  }, []);

  const handlePriceChange = useCallback((val: number) => {
    setDraftPrice(val);
  }, []);

  const handleQtySave = useCallback(
    (qty: number) => {
      setDraftQty(null);
      if (lineItemId && onEditQtySave) {
        void onEditQtySave(lineItemId, Math.max(1, Math.round(qty)));
      }
    },
    [lineItemId, onEditQtySave],
  );

  const handlePriceSave = useCallback(
    (price: number) => {
      setDraftPrice(null);
      if (lineItemId && onEditPriceSave) {
        void onEditPriceSave(lineItemId, Math.max(0, price));
      }
    },
    [lineItemId, onEditPriceSave],
  );

  const effectiveQty = draftQty ?? quantity;
  const effectivePrice = draftPrice ?? unitPrice;
  const liveTotal =
    effectiveQty != null && effectivePrice != null
      ? Math.max(
          0,
          effectiveQty *
            effectivePrice *
            (1 - Number(discountPercentage ?? 0) / 100) -
            Number(discountAmount ?? 0),
        )
      : finalPrice;
  const displayTotal = formatCurrency(isEditable ? liveTotal : finalPrice);

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-lg">
      <Typography.Text
        className={cn(
          "text-sm font-medium min-w-0 flex-1",
          !noTruncate && "truncate",
        )}
      >
        {displayName}
      </Typography.Text>

      {isEditable ? (
        <div className="flex items-center gap-1.5 shrink-0">
          {onEditQtySave && quantity != null && (
            <>
              <InlineEditableField
                value={quantity}
                onSave={handleQtySave}
                onChange={handleQtyChange}
                type="number"
                className="w-10 text-center text-xs font-semibold tabular-nums"
              />
              <span className="text-xs text-muted-foreground">×</span>
            </>
          )}
          {onEditPriceSave && unitPrice != null && (
            <InlineEditableField
              value={unitPrice}
              onSave={handlePriceSave}
              onChange={handlePriceChange}
              formatDisplay={formatCurrency}
              parseInput={parseCurrencyInput}
              type="number"
              className="w-16 text-right text-xs font-semibold tabular-nums"
              autoFocus={autoFocusPrice}
            />
          )}
          <span className="text-xs font-semibold tabular-nums text-muted-foreground ml-0.5">
            {displayTotal}
          </span>
        </div>
      ) : (
        <span className="text-sm font-semibold tabular-nums shrink-0">
          {formatCurrency(finalPrice)}
        </span>
      )}
    </div>
  );
}
