"use client";

import { Trash } from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";
import { Controller } from "react-hook-form";
import type { SelectedVariant } from "@/components/products/variant-picker";
import { VariantPicker } from "@/components/products/variant-picker";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

export interface LineItemProduct {
  id: string;
  name: string;
  current_stock: number | null;
  unit: string | null;
  [key: string]: unknown;
}

interface LineItemRowProps<TProduct extends LineItemProduct> {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  products: TProduct[];
  getProductId: (p: TProduct) => string;
  getProductLabel: (p: TProduct) => string;
  getProductStockLabel?: (p: TProduct) => string | null;
  onProductSelect: (product: TProduct | null, index: number) => void;
  /** Called when a variant is selected/deselected. */
  onVariantSelect?: (variant: SelectedVariant | null, index: number) => void;
  variantSelections: Record<number, SelectedVariant | null>;
  setVariantSelections: Dispatch<
    SetStateAction<Record<number, SelectedVariant | null>>
  >;
  canRemove: boolean;
  onRemove: () => void;
  /** Field name prefix, defaults to "items" */
  itemsPrefix?: string;
  /** Price field name, defaults to "unit_price" */
  priceField?: string;
  /** Price input label, defaults to "Нэгж үнэ" */
  priceLabel?: string;
  /** Show the description text field */
  showDescription?: boolean;
  /** Show the reason text field (returns only) */
  showReason?: boolean;
  /** Per-row search query state for the product combobox */
  productQueries?: string[];
  setProductQueries?: Dispatch<SetStateAction<string[]>>;
}

/**
 * Shared line item row for transactional drawers (invoices, quotations, purchases, returns, sales).
 *
 * Renders:
 * - Product combobox (with optional stock info)
 * - Variant picker (when product has variants)
 * - Optional description field
 * - Quantity input
 * - Price/unit cost input
 * - Row total display
 * - Remove button
 */
export function LineItemRow<TProduct extends LineItemProduct>({
  index,
  control,
  register,
  watch,
  setValue,
  errors,
  products,
  getProductId,
  getProductLabel,
  getProductStockLabel,
  onProductSelect,
  onVariantSelect,
  variantSelections: _variantSelections,
  setVariantSelections,
  canRemove,
  onRemove,
  itemsPrefix = "items",
  priceField = "unit_price",
  priceLabel = "Нэгж үнэ",
  showDescription = false,
  showReason = false,
  productQueries,
  setProductQueries,
}: LineItemRowProps<TProduct>) {
  const selectedProduct = products.find(
    (p) => getProductId(p) === watch(`${itemsPrefix}.${index}.product_id`),
  );
  const quantity = watch(`${itemsPrefix}.${index}.quantity`) ?? 0;
  const price = watch(`${itemsPrefix}.${index}.${priceField}`) ?? 0;

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
      <div className="flex-1 min-w-[140px]">
        <FieldLabel className="mb-1 text-xs">Бүтээгдэхүүн</FieldLabel>
        <Controller
          control={control}
          name={`${itemsPrefix}.${index}.product_id`}
          render={({ field: productField }) => {
            const inputValue =
              productQueries?.[index] !== undefined
                ? productQueries[index]
                : "";
            const onInputChange = setProductQueries
              ? (v: string) =>
                  setProductQueries((prev) => {
                    const next = [...prev];
                    next[index] = v;
                    return next;
                  })
              : () => {};

            return (
              <Combobox
                items={products}
                value={
                  products.find(
                    (p) => getProductId(p) === productField.value,
                  ) ?? null
                }
                onValueChange={(next: TProduct | null) => {
                  productField.onChange(next ? getProductId(next) : null);
                  setVariantSelections((prev) => ({
                    ...prev,
                    [index]: null,
                  }));
                  setValue(`${itemsPrefix}.${index}.variant_id`, undefined);
                  onProductSelect(next, index);
                  if (setProductQueries) {
                    setProductQueries((prev) => {
                      const next_q = [...prev];
                      next_q[index] = "";
                      return next_q;
                    });
                  }
                }}
                itemToStringValue={(p: TProduct | null) =>
                  p ? getProductId(p) : ""
                }
                itemToStringLabel={(p: TProduct | null) =>
                  p ? getProductLabel(p) : ""
                }
                inputValue={inputValue}
                onInputValueChange={onInputChange}
              >
                <ComboboxInput
                  placeholder="Сонгох"
                  showTrigger
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Бүтээгдэхүүн байхгүй</ComboboxEmpty>
                  <ComboboxList>
                    {(p: TProduct) => {
                      const stockLabel = getProductStockLabel?.(p);
                      return (
                        <ComboboxItem key={getProductId(p)}>
                          {getProductLabel(p)}
                          {stockLabel && ` (${stockLabel})`}
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            );
          }}
        />
        {selectedProduct && (
          <div className="mt-1">
            <VariantPicker
              productId={getProductId(selectedProduct)}
              onSelect={(variant) => {
                setVariantSelections((prev) => ({
                  ...prev,
                  [index]: variant,
                }));
                setValue(
                  `${itemsPrefix}.${index}.variant_id`,
                  variant?.variant_id ?? undefined,
                );
                onVariantSelect?.(variant, index);
              }}
            />
          </div>
        )}
      </div>

      {showDescription && (
        <div className="flex-1 min-w-[140px]">
          <FieldLabel className="mb-1 text-xs">Тайлбар</FieldLabel>
          <Input
            placeholder="Бүтээгдэхүүний нэр"
            {...register(`${itemsPrefix}.${index}.description`)}
          />
          {(errors as any).items?.[index]?.description && (
            <p className="text-xs text-destructive">
              {(errors as any).items[index]?.description?.message}
            </p>
          )}
        </div>
      )}

      <div className="w-20">
        <FieldLabel className="mb-1 text-xs">Тоо</FieldLabel>
        <Input
          type="number"
          min="0.01"
          step="any"
          {...register(`${itemsPrefix}.${index}.quantity`, {
            valueAsNumber: true,
          })}
        />
      </div>

      <div className="w-28">
        <FieldLabel className="mb-1 text-xs">{priceLabel}</FieldLabel>
        <Controller
          control={control}
          name={`${itemsPrefix}.${index}.${priceField}`}
          render={({ field }) => (
            <CurrencyInput value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      {showReason && (
        <div className="w-full min-w-[200px]">
          <FieldLabel className="mb-1 text-xs">Шалтгаан</FieldLabel>
          <Input
            placeholder="Буцаалтын шалтгаан"
            {...register(`${itemsPrefix}.${index}.reason`)}
          />
        </div>
      )}

      <div className="flex items-center gap-1 pb-1">
        <span className="text-sm font-medium whitespace-nowrap">
          {formatCurrency(quantity * price)}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="size-8 flex items-center justify-center text-destructive hover:bg-muted rounded"
          >
            <Trash className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Computes total from watched form items.
 * Works with both `unit_price` and `unit_cost` field names.
 */
export function computeLineItemsTotal(
  items:
    | Array<{ quantity?: number; unit_price?: number; unit_cost?: number }>
    | undefined,
): number {
  if (!items) return 0;
  return items.reduce((sum, item) => {
    const price = item.unit_price ?? item.unit_cost ?? 0;
    return sum + (item.quantity ?? 0) * price;
  }, 0);
}
