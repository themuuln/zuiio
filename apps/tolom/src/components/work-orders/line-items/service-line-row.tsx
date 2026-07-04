"use client";

import { parseCurrencyInput } from "@zuiio/core";
import { useCallback, useState } from "react";
import { InlineEditableField } from "@/components/bay-view-v2/_inline-editable-field";
import { Typography } from "@/components/ui/typography";
import { formatCurrency } from "@/lib/utils";

/**
 * A service line row displaying item name, quantity, unit price, and total.
 *
 * When edit callbacks are provided (editable mode), quantity and unit price
 * become inline-editable fields. Otherwise renders as read-only.
 */
export interface ServiceLineRowProps {
  /** Service name */
  name: string;
  /** Mongolian name (optional — shown when locale is "mn") */
  nameMn?: string | null;
  /** Quantity */
  quantity?: number;
  /** Unit price (before discounts) — shown in editable mode */
  unitPrice?: number;
  /** Final price (quantity × unitPrice − discounts) */
  finalPrice: number;
  /** Locale for name display */
  locale?: string;
  /** Called when quantity is saved (enables editable mode) */
  onEditQtySave?: (id: string, qty: number) => Promise<void>;
  /** Called when price is saved (enables editable mode) */
  onEditPriceSave?: (id: string, price: number) => Promise<void>;
  /** Service ID — required when edit callbacks are provided */
  serviceId?: string;
}

export function ServiceLineRow({
  name,
  nameMn,
  quantity,
  unitPrice,
  finalPrice,
  locale = "en",
  onEditQtySave,
  onEditPriceSave,
  serviceId,
}: ServiceLineRowProps) {
  const displayName = locale === "mn" && nameMn ? nameMn : name;

  const isEditable = !!(onEditQtySave || onEditPriceSave) && !!serviceId;

  // Optimistic drafts for live displayTotal preview while editing
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
      if (serviceId && onEditQtySave) {
        void onEditQtySave(serviceId, Math.max(1, Math.round(qty)));
      }
    },
    [serviceId, onEditQtySave],
  );

  const handlePriceSave = useCallback(
    (price: number) => {
      setDraftPrice(null);
      if (serviceId && onEditPriceSave) {
        void onEditPriceSave(serviceId, Math.max(0, price));
      }
    },
    [serviceId, onEditPriceSave],
  );

  // Use optimistic drafts while editing for live preview, fall back to props
  const effectiveQty = draftQty ?? quantity;
  const effectivePrice = draftPrice ?? unitPrice;

  const displayTotal =
    isEditable && effectiveQty != null && effectivePrice != null
      ? formatCurrency(effectiveQty * effectivePrice)
      : formatCurrency(finalPrice);

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-lg">
      <Typography.Text className="text-sm font-medium truncate min-w-0 flex-1">
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
