"use client";

import { Drawer } from "@base-ui/react/drawer";
import { zodResolver } from "@hookform/resolvers/zod";
import { Barcode, Package, Plus, Tag, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { createProduct } from "@/app/(dashboard)/products/new/actions";
import { buttonVariants } from "@/components/ui/button";
import { type LocalVariantGroup, VariantManagerDrawer } from "@/components/products/variant-manager-drawer";
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
import { useBrands } from "@/lib/query/hooks/use-brands";
import { productKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

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

const productSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, "Нэгж шаардлагатай"),
  category_name: z.string().optional(),
  brand_id: z.string().optional(),
  cost_price: z.number().min(0),
  sale_price: z.number().min(0),
  current_stock: z.number().min(0),
  min_stock: z.number().min(0),
});

type ProductValues = z.infer<typeof productSchema>;

export function ProductCreateDrawer({
  companyType,
  organizationId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  companyType: string;
  organizationId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const presets = PRESET_CATEGORIES[companyType] ?? [];
  const { data: brands } = useBrands(organizationId ?? "");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      unit: "ширхэг",
      category_name: "",
      brand_id: "",
      cost_price: 0,
      sale_price: 0,
      current_stock: 0,
      min_stock: 0,
    },
  });

  const [variantGroups, setVariantGroups] = useState<LocalVariantGroup[]>([]);
  const hasVariants = variantGroups.length > 0;

  const productMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createProduct(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: productKeys.all,
    buildOptimistic: (formData) => {
      const brandId = formData.get("brand_id")?.toString() ?? "";
      const selectedBrand = brands?.find((b) => b.id === brandId);
      return {
        id: `opt-${Date.now()}`,
        name: formData.get("name")?.toString() ?? "",
        sku: formData.get("sku")?.toString() || null,
        barcode: formData.get("barcode")?.toString() || null,
        unit: formData.get("unit")?.toString() ?? "ширхэг",
        category_name: formData.get("category_name")?.toString() || null,
        brand_id: brandId || null,
        brand_name: selectedBrand?.name ?? null,
        brand_logo_url: selectedBrand?.logo_url ?? null,
        cost_price: Number(formData.get("cost_price") ?? 0),
        sale_price: Number(formData.get("sale_price") ?? 0),
        current_stock: Number(formData.get("current_stock") ?? 0),
        min_stock: Number(formData.get("min_stock") ?? 0),
        created_at: new Date().toISOString(),
      };
    },
  });

  const onSubmit = (data: ProductValues) => {
    if (productMutation.isPending) return;
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("sku", data.sku ?? "");
    formData.append("barcode", data.barcode ?? "");
    formData.append("unit", data.unit);
    formData.append("category_name", data.category_name ?? "");
    formData.append("brand_id", data.brand_id ?? "");
    formData.append("cost_price", String(data.cost_price));
    formData.append("sale_price", String(data.sale_price));
    formData.append("current_stock", String(data.current_stock));
    formData.append("min_stock", String(data.min_stock));

    // Attach variant data if present
    if (hasVariants) {
      const combinations = computeVariantCombinations(variantGroups);
      const variants = combinations.map((combo) => {
        const key = combo.option_ids.join("-");
        return {
          sku: (formData.get(`v_sku_${key}`) as string) ?? "",
          cost_price: Number(formData.get(`v_cost_${key}`) ?? 0),
          sale_price: Number(formData.get(`v_price_${key}`) ?? 0),
          current_stock: Number(formData.get(`v_stock_${key}`) ?? 0),
          option_ids: combo.option_ids,
        };
      });
      formData.append("variant_groups", JSON.stringify(variantGroups));
      formData.append("variant_data", JSON.stringify(variants));
    }

    productMutation.mutate(formData, { onSuccess: () => setOpen(false) });
  };

  // --- Unit combobox (creatable) ---
  const [unitQuery, setUnitQuery] = useState("");
  const trimmedUnitQuery = unitQuery.trim();
  const loweredUnitQuery = trimmedUnitQuery.toLowerCase();
  const [allUnits, setAllUnits] = useState<string[]>([...initialUnits]);
  const unitLabelMatch =
    loweredUnitQuery === "" ||
    allUnits.some((u) => u.toLowerCase().includes(loweredUnitQuery));
  const unitItems: string[] =
    trimmedUnitQuery !== "" && !unitLabelMatch
      ? [...allUnits, unitQuery.trim()]
      : allUnits;

  // --- Category combobox (creatable) ---
  function computeVariantCombinations(
    groups: LocalVariantGroup[],
  ): { option_ids: string[]; option_labels: string }[] {
    if (groups.length === 0) return [];
    const optionLists = groups.map((g) =>
      g.options.map((o) => ({ id: o.id, value: o.value })),
    );
    function cartesian(
      lists: { id: string; value: string }[][],
    ): { option_ids: string[]; option_labels: string }[] {
      if (lists.length === 0) return [{ option_ids: [], option_labels: "" }];
      const [first, ...rest] = lists;
      const restCombos = cartesian(rest);
      return first.flatMap((item) =>
        restCombos.map((combo) => ({
          option_ids: [item.id, ...combo.option_ids],
          option_labels: [
            item.value,
            ...(combo.option_labels ? [combo.option_labels] : []),
          ].join(" / "),
        })),
      );
    }
    return cartesian(optionLists);
  }

  const [categoryQuery, setCategoryQuery] = useState("");
  const trimmedCategoryQuery = categoryQuery.trim();
  const loweredCategoryQuery = trimmedCategoryQuery.toLowerCase();
  const [allCategoryNames, setAllCategoryNames] = useState<string[]>([
    ...new Set([...initialCategories, ...presets]),
  ]);
  const categoryLabelMatch =
    loweredCategoryQuery === "" ||
    allCategoryNames.some((c) =>
      c.toLowerCase().includes(loweredCategoryQuery),
    );
  const categoryItems: string[] =
    trimmedCategoryQuery !== "" && !categoryLabelMatch
      ? [...allCategoryNames, categoryQuery.trim()]
      : allCategoryNames;

  return (
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className={buttonVariants({ variant: "default" })}>
        <Plus className="size-4" />
        Шинэ бүтээгдэхүүн
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.1] z-40 [--bleed:3rem] dark:[--backdrop-opacity:0.4] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] z-50 supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none">
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid gap-5">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="name">Нэр</FieldLabel>
                      <div className="relative">
                        <Package className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="name"
                          required
                          className="pl-9"
                          placeholder="Цай 500гр"
                          {...register("name")}
                        />
                      </div>
                      {errors.name && (
                        <p className="text-xs text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sku">SKU</FieldLabel>
                      <div className="relative">
                        <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="sku"
                          className="pl-9"
                          placeholder="TEA-500"
                          {...register("sku")}
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
                      <div className="relative">
                        <Barcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="barcode"
                          className="pl-9"
                          placeholder="8654..."
                          {...register("barcode")}
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="unit">Нэгж</FieldLabel>
                      <Controller
                        name="unit"
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            name="unit"
                            items={unitItems}
                            value={field.value}
                            onValueChange={(next: string | null) => {
                              if (next && !allUnits.includes(next)) {
                                setAllUnits((prev) => [...prev, next]);
                              }
                              setUnitQuery("");
                              field.onChange(next ?? "");
                            }}
                            itemToStringLabel={(item: string | null) =>
                              item
                                ? allUnits.includes(item)
                                  ? item
                                  : `"${item}" үүсгэх`
                                : ""
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
                                    initialUnits.includes(item)
                                      ? item
                                      : `"${item}" үүсгэх`}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        )}
                      />
                      {errors.unit && (
                        <p className="text-xs text-destructive">
                          {errors.unit.message}
                        </p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="category_name">Ангилал</FieldLabel>
                      <Controller
                        name="category_name"
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            name="category_name"
                            items={categoryItems}
                            value={field.value}
                            onValueChange={(next: string | null) => {
                              if (next && !allCategoryNames.includes(next)) {
                                setAllCategoryNames((prev) => [...prev, next]);
                              }
                              setCategoryQuery("");
                              field.onChange(next ?? "");
                            }}
                            itemToStringLabel={(item: string | null) =>
                              item
                                ? allCategoryNames.includes(item)
                                  ? item
                                  : `"${item}" үүсгэх`
                                : ""
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
                                    initialCategories.includes(item)
                                      ? item
                                      : `"${item}" үүсгэх`}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        )}
                      />
                      <FieldDescription>
                        Байгууллагын төрөлд тохирсон ангиллууд санал болгогдоно.
                        Шинэ нэр оруулбал автоматаар үүсгэнэ.
                      </FieldDescription>
                      {errors.category_name && (
                        <p className="text-xs text-destructive">
                          {errors.category_name.message}
                        </p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="brand_id">Брэнд</FieldLabel>
                      <Controller
                        name="brand_id"
                        control={control}
                        render={({ field }) => {
                          const brandItems: {
                            id: string;
                            name: string;
                            logo_url: string | null;
                          }[] = brands ?? [];
                          const selectedBrand = brandItems.find(
                            (b) => b.id === field.value,
                          );
                          return (
                            <Combobox
                              name="brand_id"
                              items={brandItems}
                              value={
                                brandItems.find((b) => b.id === field.value) ??
                                null
                              }
                              onValueChange={(
                                next: {
                                  id: string;
                                  name: string;
                                  logo_url: string | null;
                                } | null,
                              ) => field.onChange(next?.id ?? "")}
                              itemToStringLabel={(item) => item?.name ?? ""}
                              inputValue={selectedBrand?.name ?? ""}
                              onInputValueChange={() => {}}
                            >
                              <ComboboxInput
                                id="brand_id"
                                placeholder="Брэнд сонгох"
                                showTrigger
                                className="w-full"
                              />
                              <ComboboxContent>
                                <ComboboxEmpty>Брэнд байхгүй</ComboboxEmpty>
                                <ComboboxList>
                                  {(item: {
                                    id: string;
                                    name: string;
                                    logo_url: string | null;
                                  }) => (
                                    <ComboboxItem key={item.id} value={item.id}>
                                      {item.logo_url ? (
                                        <img
                                          src={item.logo_url}
                                          alt={item.name}
                                          className="mr-2 inline-block size-4 rounded object-contain dark:invert"
                                        />
                                      ) : null}
                                      {item.name}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          );
                        }}
                      />
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="cost_price">Өртөг үнэ</FieldLabel>
                      <Input
                        id="cost_price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                        {...register("cost_price", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sale_price">Зарах үнэ</FieldLabel>
                      <Input
                        id="sale_price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                        {...register("sale_price", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="current_stock">
                        Эхний үлдэгдэл
                      </FieldLabel>
                      <Input
                        id="current_stock"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                        {...register("current_stock", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="min_stock">Доод үлдэгдэл</FieldLabel>
                      <Input
                        id="min_stock"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                        {...register("min_stock", { valueAsNumber: true })}
                      />
                    </Field>
                  </FieldGroup>
                </div>

                <VariantManagerDrawer
                  groups={variantGroups}
                  onGroupsChange={setVariantGroups}
                />

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
