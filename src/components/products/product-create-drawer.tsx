"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Barcode, Package, Plus, Tag, X } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createProduct } from "@/app/(dashboard)/products/new/actions";
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
import { productKeys } from "@/lib/query/keys";

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

const initialCategories = ["Хоол, ундаа", "Спорт хоол", "Хувцас", "Creatine"];

export function ProductCreateDrawer({ companyType }: { companyType: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const presets = PRESET_CATEGORIES[companyType] ?? [];

  const productMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createProduct(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: productKeys.all() });
      const snapshot = queryClient.getQueriesData({
        queryKey: productKeys.all(),
      });

      // Build optimistic product from form data
      const name = formData.get("name")?.toString() ?? "";
      const sku = formData.get("sku")?.toString() ?? "";
      const barcode = formData.get("barcode")?.toString() ?? "";
      const unit = formData.get("unit")?.toString() ?? "ширхэг";
      const categoryName = formData.get("category_name")?.toString() ?? "";
      const costPrice = Number(formData.get("cost_price") ?? 0);
      const salePrice = Number(formData.get("sale_price") ?? 0);
      const currentStock = Number(formData.get("current_stock") ?? 0);
      const minStock = Number(formData.get("min_stock") ?? 0);

      const optimisticProduct = {
        id: `opt-${Date.now()}`,
        name,
        sku: sku || null,
        barcode: barcode || null,
        unit,
        category_name: categoryName || null,
        cost_price: costPrice,
        sale_price: salePrice,
        current_stock: currentStock,
        min_stock: minStock,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueriesData(
        { queryKey: productKeys.all(), type: "active" },
        (oldData: unknown) => {
          if (Array.isArray(oldData)) {
            return [optimisticProduct, ...oldData];
          }
          return oldData;
        },
      );

      return { snapshot };
    },
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err.message || "Бүтээгдэхүүн үүсгэхэд алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
    },
  });

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
    ...new Set([...initialCategories, ...presets]),
  ]);
  const categoryExactMatch =
    loweredCategoryQuery === "" ||
    allCategoryNames.some((c) => c.toLowerCase() === loweredCategoryQuery);
  const categoryItems: string[] =
    trimmedCategoryQuery !== "" && !categoryExactMatch
      ? [...allCategoryNames, categoryQuery.trim()]
      : allCategoryNames;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (productMutation.isPending) return;
    const formData = new FormData(e.currentTarget);
    productMutation.mutate(formData);
  };

  return (
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className={buttonVariants({ variant: "default" })}>
        <Plus className="size-4" />
        Шинэ бүтээгдэхүүн
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    Шинэ бүтээгдэхүүн
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    Каталогтоо бараа нэмээд шууд агуулах болон борлуулалтын
                    урсгалд ашиглана.
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="name">Нэр</FieldLabel>
                      <div className="relative">
                        <Package className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="name"
                          name="name"
                          required
                          className="pl-9"
                          placeholder="Цай 500гр"
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sku">SKU</FieldLabel>
                      <div className="relative">
                        <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="sku"
                          name="sku"
                          className="pl-9"
                          placeholder="TEA-500"
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
                      <div className="relative">
                        <Barcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="barcode"
                          name="barcode"
                          className="pl-9"
                          placeholder="8654..."
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="unit">Нэгж</FieldLabel>
                      <Combobox
                        name="unit"
                        items={unitItems}
                        defaultValue="ширхэг"
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
                          id="unit"
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
                      <FieldLabel htmlFor="category_name">Ангилал</FieldLabel>
                      <Combobox
                        name="category_name"
                        items={categoryItems}
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
                          id="category_name"
                          placeholder="Ангилал сонгох эсвэл бичих"
                          showTrigger
                          className="w-full"
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>Ангилал байхгүй</ComboboxEmpty>
                          <ComboboxList>
                            {(item: string) => (
                              <ComboboxItem key={item} value={item}>
                                {allCategoryNames.includes(item) ||
                                initialCategories.includes(item as any)
                                  ? item
                                  : `"${item}" үүсгэх`}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      <FieldDescription>
                        Байгууллагын төрөлд тохирсон ангиллууд санал болгогдоно.
                        Шинэ нэр оруулбал автоматаар үүсгэнэ.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="cost_price">Өртөг үнэ</FieldLabel>
                      <Input
                        id="cost_price"
                        name="cost_price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sale_price">Зарах үнэ</FieldLabel>
                      <Input
                        id="sale_price"
                        name="sale_price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="current_stock">
                        Эхний үлдэгдэл
                      </FieldLabel>
                      <Input
                        id="current_stock"
                        name="current_stock"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="min_stock">Доод үлдэгдэл</FieldLabel>
                      <Input
                        id="min_stock"
                        name="min_stock"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                      />
                    </Field>
                  </FieldGroup>
                </div>

                {productMutation.error ? (
                  <div className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {productMutation.error.message}
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
                    disabled={productMutation.isPending}
                    className={buttonVariants({ variant: "default" })}
                  >
                    {productMutation.isPending ? "Хадгалах..." : "Хадгалах"}
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
