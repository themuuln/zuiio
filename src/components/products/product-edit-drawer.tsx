"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Barcode, NotePencil, Package, Tag, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { updateProduct } from "@/app/(dashboard)/products/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PRESET_CATEGORIES } from "@/lib/constants";

export interface ProductEditData {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  category_name: string | null;
  cost_price: number | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
}

// Collect all preset categories across all company types
const allPresetCategories = [
  ...new Set(Object.values(PRESET_CATEGORIES).flat()),
];

const initialUnits = [
  "ширхэг",
  "кг",
  "гр",
  "л",
  "мл",
  "м",
  "см",
  "уут",
  "хайрцаг",
  "багц",
  "хос",
  "ш",
];

const initialCategoryNames = allPresetCategories;

export function ProductEditDrawer({
  product,
  children,
}: {
  product: ProductEditData;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateProduct, undefined);
  const router = useRouter();

  // --- Unit combobox (creatable) ---
  const [unitQuery, setUnitQuery] = useState("");
  const trimmedUnitQuery = unitQuery.trim();
  const loweredUnitQuery = trimmedUnitQuery.toLowerCase();
  const [allUnits, setAllUnits] = useState<string[]>([...initialUnits]);
  const unitExactMatch =
    loweredUnitQuery === "" ||
    allUnits.some((u) => u.toLowerCase() === loweredUnitQuery);
  const unitItems: string[] =
    trimmedUnitQuery !== "" && !unitExactMatch
      ? [...allUnits, unitQuery.trim()]
      : allUnits;

  // --- Category combobox (creatable) ---
  const [categoryQuery, setCategoryQuery] = useState("");
  const trimmedCategoryQuery = categoryQuery.trim();
  const loweredCategoryQuery = trimmedCategoryQuery.toLowerCase();
  const [allCategoryNames, setAllCategoryNames] = useState<string[]>([
    ...initialCategoryNames,
  ]);
  const categoryExactMatch =
    loweredCategoryQuery === "" ||
    allCategoryNames.some((c) => c.toLowerCase() === loweredCategoryQuery);
  const categoryItems: string[] =
    trimmedCategoryQuery !== "" && !categoryExactMatch
      ? [...allCategoryNames, categoryQuery.trim()]
      : allCategoryNames;

  useEffect(() => {
    if (state && "success" in state) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={setOpen}>
      {children ? (
        <Drawer.Trigger className="w-full">{children}</Drawer.Trigger>
      ) : (
        <Drawer.Trigger
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
        >
          <NotePencil className="size-3.5" />
        </Drawer.Trigger>
      )}
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    Бүтээгдэхүүн засах
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {product.name}
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <form action={formAction} className="space-y-5">
                <input type="hidden" name="id" value={product.id} />

                <div className="grid gap-5">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="edit-name">Нэр</FieldLabel>
                      <div className="relative">
                        <Package className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="edit-name"
                          name="name"
                          required
                          className="pl-9"
                          defaultValue={product.name}
                          placeholder="Цай 500гр"
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-sku">SKU</FieldLabel>
                      <div className="relative">
                        <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="edit-sku"
                          name="sku"
                          className="pl-9"
                          defaultValue={product.sku ?? ""}
                          placeholder="TEA-500"
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-barcode">Barcode</FieldLabel>
                      <div className="relative">
                        <Barcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="edit-barcode"
                          name="barcode"
                          className="pl-9"
                          defaultValue={product.barcode ?? ""}
                          placeholder="8654..."
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-unit">Нэгж</FieldLabel>
                      <Combobox
                        name="unit"
                        items={unitItems}
                        defaultValue={product.unit ?? "ширхэг"}
                        onValueChange={(next: string | null) => {
                          if (next && !allUnits.includes(next)) {
                            setAllUnits((prev) => [...prev, next]);
                          }
                          setUnitQuery("");
                        }}
                        itemToStringLabel={(item: string) =>
                          allUnits.includes(item) ? item : `"${item}" үүсгэх`
                        }
                        inputValue={unitQuery}
                        onInputValueChange={setUnitQuery}
                      >
                        <ComboboxInput
                          id="edit-unit"
                          placeholder="ширхэг"
                          showTrigger
                          className="w-full"
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>Нэгж байхгүй</ComboboxEmpty>
                          <ComboboxList>
                            {(item: string) => (
                              <ComboboxItem key={item} value={item}>
                                {allUnits.includes(item) ||
                                initialUnits.includes(item as any)
                                  ? item
                                  : `"${item}" үүсгэх`}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-category_name">
                        Ангилал
                      </FieldLabel>
                      <Combobox
                        name="category_name"
                        items={categoryItems}
                        defaultValue={product.category_name ?? ""}
                        onValueChange={(next: string | null) => {
                          if (next && !allCategoryNames.includes(next)) {
                            setAllCategoryNames((prev) => [...prev, next]);
                          }
                          setCategoryQuery("");
                        }}
                        itemToStringLabel={(item: string) =>
                          allCategoryNames.includes(item)
                            ? item
                            : `"${item}" үүсгэх`
                        }
                        inputValue={categoryQuery}
                        onInputValueChange={setCategoryQuery}
                      >
                        <ComboboxInput
                          id="edit-category_name"
                          placeholder="Ундаа, хүнс, ахуйн бараа"
                          showTrigger
                          className="w-full"
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>Ангилал байхгүй</ComboboxEmpty>
                          <ComboboxList>
                            {(item: string) => (
                              <ComboboxItem key={item} value={item}>
                                {allCategoryNames.includes(item) ||
                                initialCategoryNames.includes(item as any)
                                  ? item
                                  : `"${item}" үүсгэх`}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      <FieldDescription>
                        Шинэ нэр оруулбал ангиллыг автоматаар үүсгэнэ.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="edit-cost_price">
                        Өртөг үнэ
                      </FieldLabel>
                      <Input
                        id="edit-cost_price"
                        name="cost_price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={product.cost_price ?? 0}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-sale_price">
                        Зарах үнэ
                      </FieldLabel>
                      <Input
                        id="edit-sale_price"
                        name="sale_price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={product.sale_price ?? 0}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-min_stock">
                        Доод үлдэгдэл
                      </FieldLabel>
                      <Input
                        id="edit-min_stock"
                        name="min_stock"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={product.min_stock ?? 0}
                      />
                    </Field>
                  </FieldGroup>
                </div>

                {state?.error ? (
                  <div className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {state.error}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3">
                  <Drawer.Close
                    className={buttonVariants({
                      variant: "outline",
                    })}
                  >
                    Цуцлах
                  </Drawer.Close>
                  <button
                    type="submit"
                    disabled={pending}
                    className={buttonVariants({ variant: "default" })}
                  >
                    Хадгалах
                  </button>
                </div>
              </form>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
