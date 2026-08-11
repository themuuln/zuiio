"use client";

import { parseCurrencyInput } from "@zuiio/core";
import { InlineEditableField } from "@zuiio/ui";
import { useCallback, useState } from "react";
import { formatCurrency } from "@/lib/utils";

/**
 * Line item row for the drawer v2 UI. Read-only by default; when edit
 * callbacks are provided, quantity and unit price render as inline-editable
 * fields with a live line total.
 */

interface PreviewLineItemRowProps {
  name: string;
  quantity: number;
  unitPrice: number;
  finalPrice: number;
  meta?: string | null;
  onEditQtySave?: (qty: number) => void;
  onEditPriceSave?: (price: number) => void;
}

export function PreviewLineItemRow({
  name,
  quantity,
  unitPrice,
  finalPrice,
  meta,
  onEditQtySave,
  onEditPriceSave,
}: PreviewLineItemRowProps) {
  const editable = !!(onEditQtySave || onEditPriceSave);
  const [draftQty, setDraftQty] = useState<number | null>(null);
  const [draftPrice, setDraftPrice] = useState<number | null>(null);

  const handleQtySave = useCallback(
    (qty: number) => {
      setDraftQty(null);
      onEditQtySave?.(Math.max(1, Math.round(qty)));
    },
    [onEditQtySave],
  );

  const handlePriceSave = useCallback(
    (price: number) => {
      setDraftPrice(null);
      onEditPriceSave?.(Math.max(0, price));
    },
    [onEditPriceSave],
  );

  const effectiveQty = draftQty ?? quantity;
  const effectivePrice = draftPrice ?? unitPrice;
  const liveTotal =
    effectiveQty != null && effectivePrice != null
      ? effectiveQty * effectivePrice
      : finalPrice;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg p-3 transition-colors hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {!editable && (
          <p className="truncate text-xs text-muted-foreground/70">
            {meta ? `${meta} · ` : ""}
            {quantity} × {formatCurrency(unitPrice)}
          </p>
        )}
      </div>

      {editable ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {onEditQtySave && (
            <>
              <InlineEditableField
                value={quantity}
                onSave={handleQtySave}
                onChange={setDraftQty}
                type="number"
                className="w-10 text-center text-xs font-semibold tabular-nums text-foreground"
              />
              <span className="text-xs text-muted-foreground">×</span>
            </>
          )}
          {onEditPriceSave && (
            <InlineEditableField
              value={unitPrice}
              onSave={handlePriceSave}
              onChange={setDraftPrice}
              formatDisplay={formatCurrency}
              parseInput={parseCurrencyInput}
              className="w-20 text-right text-xs font-semibold tabular-nums text-foreground"
            />
          )}
          <span className="ml-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {formatCurrency(liveTotal)}
          </span>
        </div>
      ) : (
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(finalPrice)}
        </span>
      )}
    </div>
  );
}
