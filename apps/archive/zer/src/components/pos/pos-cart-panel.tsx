"use client";

import {
  Minus,
  Plus,
  ShoppingCart,
  Trash,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { NumericKeypad } from "@/components/shop/numeric-keypad";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/format";
import { cartCount, cartSubtotal, lineTotal, type PosLine } from "@/lib/pos";

/**
 * Register cart: touch quantity steppers, per-line price override (tap the
 * price → keypad), remove, and the charge action.
 */
export function PosCartPanel({
  lines,
  onIncrement,
  onDecrement,
  onRemove,
  onEditPrice,
  onClear,
  onCharge,
}: {
  lines: PosLine[];
  onIncrement: (index: number) => void;
  onDecrement: (index: number) => void;
  onRemove: (index: number) => void;
  onEditPrice: (index: number, unitPrice: number) => void;
  onClear: () => void;
  onCharge: () => void;
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);

  const editLine = editIndex !== null ? lines[editIndex] : null;
  const editingIndex = editIndex;

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Захиалга</h2>
          {count > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {count}
            </span>
          )}
        </div>
        {lines.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 text-xs text-muted-foreground"
          >
            <Trash className="size-3.5" />
            Цэвэрлэх
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="divide-y divide-border/60">
          {lines.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Бүтээгдэхүүн нэмээрэй
            </p>
          ) : (
            lines.map((line, index) => (
              <div
                key={`${line.productId}-${line.variantId ?? ""}`}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {line.productName}
                  </p>
                  {line.variantLabel && (
                    <p className="truncate text-xs text-muted-foreground">
                      {line.variantLabel}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditIndex(index)}
                    className="mt-0.5 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-semibold text-primary hover:bg-primary/10"
                    aria-label={`${line.productName} үнэ засах`}
                  >
                    {formatCurrency(line.unitPrice)}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{line.unit ?? "ш"}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-lg text-base"
                    onClick={() => onDecrement(index)}
                    aria-label={`${line.productName} тоо хасах`}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {line.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-lg text-base"
                    onClick={() => onIncrement(index)}
                    aria-label={`${line.productName} тоо нэмэх`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>

                <div className="w-20 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(lineTotal(line))}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground"
                  onClick={() => onRemove(index)}
                  aria-label={`${line.productName} хасах`}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Нийт дүн</span>
          <span className="text-lg font-bold tabular-nums">
            {formatCurrency(subtotal)}
          </span>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={lines.length === 0}
          onClick={onCharge}
          className="h-12 w-full rounded-xl text-base"
        >
          Төлбөр авах
        </Button>
      </div>

      {/* Per-line price override (discounts) via touch keypad */}
      <Dialog
        open={editingIndex !== null}
        onOpenChange={(open) => {
          if (!open) setEditIndex(null);
        }}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editLine ? editLine.productName : ""} — үнэ
            </DialogTitle>
          </DialogHeader>
          {editLine && editingIndex !== null && (
            <PriceEditor
              initialPrice={editLine.unitPrice}
              onConfirm={(price) => {
                onEditPrice(editingIndex, price);
                setEditIndex(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function PriceEditor({
  initialPrice,
  onConfirm,
}: {
  initialPrice: number;
  onConfirm: (price: number) => void;
}) {
  const [value, setValue] = useState(String(initialPrice));
  const parsed = Number.parseFloat(value);

  return (
    <div className="space-y-3">
      <p className="text-center text-2xl font-bold tabular-nums">
        {formatCurrency(Number.isNaN(parsed) ? 0 : parsed)}
      </p>
      <NumericKeypad
        value={value}
        onChange={setValue}
        onConfirm={() => {
          if (!Number.isNaN(parsed)) onConfirm(parsed);
        }}
        confirmLabel="Хадгалах"
      />
    </div>
  );
}
