"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { formatMNT } from "@/lib/utils";
import { InlineEditableField } from "./_inline-editable-field";

interface WorkOrderListHeaderProps {
  name: string;
  qty: string;
  price: string;
}

export function WorkOrderListHeader({
  name,
  qty,
  price,
}: WorkOrderListHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-1 mb-1 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
      <div className="flex-1">{name}</div>
      <div className="text-right min-w-[2ch]">{qty}</div>
      <div className="w-20 text-right">{price}</div>
      <div className="w-7" />
    </div>
  );
}

interface WorkOrderRowProps {
  /** Primary name text */
  name: string;
  /** Optional subtitle line (e.g. stock info, category) */
  subtitle?: React.ReactNode;
  /** Optional badge/icon shown next to the name */
  badge?: React.ReactNode;
  /** Quantity value */
  quantity: number;
  /** Final price value */
  price: number;
  /** Called when quantity is saved */
  onQtySave: (qty: number) => void;
  /** Called when price is saved */
  onPriceSave: (price: number) => void;
  /** Called when delete button is clicked */
  onDelete: () => void;
  /** Accessible label for delete button */
  deleteLabel?: string;
}

export function WorkOrderRow({
  name,
  subtitle,
  badge,
  quantity,
  price,
  onQtySave,
  onPriceSave,
  onDelete,
  deleteLabel = "Remove",
}: WorkOrderRowProps) {
  return (
    <div className="group flex items-center gap-2 rounded-md p-2 hover:bg-muted/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Typography.Text className="text-sm font-medium truncate">
            {name}
          </Typography.Text>
          {badge}
        </div>
        {subtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">{subtitle}</div>
        )}
      </div>
      <div className="text-right min-w-[2ch]">
        <InlineEditableField
          value={quantity}
          formatDisplay={(v) => String(v)}
          onSave={onQtySave}
          className="justify-end text-xs text-muted-foreground"
          inputClassName="text-center"
        />
      </div>
      <div className="w-20 text-right">
        <InlineEditableField
          value={price}
          formatDisplay={(v) => formatMNT(v)}
          onSave={onPriceSave}
          className="font-semibold"
        />
      </div>
      <div className="w-7 flex justify-center">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDelete}
          className="text-destructive/60 hover:text-destructive size-6 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
          aria-label={deleteLabel}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  );
}
