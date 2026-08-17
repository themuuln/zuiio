"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  CaretDown,
  ImageSquare,
  Package,
  Plus,
  ShoppingCart,
  TextT,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useOrgSettings } from "@/lib/org-settings-context";

const CameraScanner = dynamic(
  () => import("@/components/shop/camera-scanner").then((m) => m.CameraScanner),
  { ssr: false },
);

import { z } from "zod";
import { createProduct } from "@/app/(dashboard)/products/new/actions";
import {
  computeCombinations,
  type LocalVariantData,
  type LocalVariantGroup,
  VariantManagerDrawer,
  VariantSummaryCard,
} from "@/components/products/variant-manager-drawer";
import { buttonVariants } from "@/components/ui/button";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PRESET_CATEGORIES } from "@/lib/constants";
import { useBrands } from "@/lib/query/hooks/use-brands";
import { productKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import { cn } from "@/lib/utils";

const unitGroups = [
  {
    label: "Нийтлэг",
    items: ["ширхэг", "кг", "гр", "л", "мл"] as const,
  },
  {
    label: "Бусад",
    items: ["м", "см", "уут", "хайрцаг", "багц", "хос", "ш"] as const,
  },
];

const productSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, "Нэгж шаардлагатай"),
  category_name: z.string().optional(),
  brand_id: z.string().optional(),
  brand_name: z.string().optional(),
  description: z.string().optional(),
  material_type: z.string().optional(),
  additional_info: z.string().optional(),
  usage_instructions: z.string().optional(),
  care_instructions: z.string().optional(),
  cost_price: z.number().min(0),
  sale_price: z.number().min(0),
  current_stock: z.number().min(0),
  min_stock: z.number().min(0),
  image_url: z.string().optional(),
});

type ProductValues = z.infer<typeof productSchema>;

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5" weight="bold" />
      {label}
    </div>
  );
}

function ProductPreviewCard({
  name,
  sale_price,
  unit,
  image_url,
}: {
  name: string;
  sale_price: number;
  unit: string;
  image_url?: string;
}) {
  const price = sale_price || 0;
  const displayName = name || "Бүтээгдэхүүн";
  const initial = displayName.charAt(0);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted/30">
        {image_url ? (
          <img
            src={image_url}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="text-3xl font-bold text-muted-foreground/25"
            aria-hidden="true"
          >
            {initial}
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
          Сагс
        </span>
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-tight">
          {displayName}
        </p>
        <p className="text-base font-bold tabular-nums tracking-tight">
          {price.toLocaleString()}₮
        </p>
        {unit && (
          <p className="text-xs text-muted-foreground">
            Үлдэгдэл &bull; {unit}
          </p>
        )}
      </div>
    </div>
  );
}

export function ProductCreateDrawer({
  companyType,
  organizationId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  hideTrigger = false,
}: {
  companyType: string;
  organizationId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the trigger button (e.g. when opened via URL navigation). */
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const presets = companyType
    ? (PRESET_CATEGORIES[companyType] ?? [])
    : [...new Set(Object.values(PRESET_CATEGORIES).flat())];
  const { data: brands } = useBrands(organizationId ?? "");
  const { hasVariants, hasBrands, hasCategories } = useOrgSettings();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
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
      brand_name: "",
      description: "",
      material_type: "",
      additional_info: "",
      usage_instructions: "",
      care_instructions: "",
      cost_price: 0,
      sale_price: 0,
      current_stock: 0,
      min_stock: 0,
      image_url: "",
    },
  });

  const handleBarcodeScan = (barcode: string) => {
    setValue("barcode", barcode);
    setIsBarcodeScannerOpen(false);
    return { found: true } as const;
  };

  const [variantGroups, setVariantGroups] = useState<LocalVariantGroup[]>([]);
  const [variantData, setVariantData] = useState<LocalVariantData[]>([]);

  const watchedName = watch("name");
  const watchedCostPrice = watch("cost_price");
  const watchedSalePrice = watch("sale_price");
  const watchedCurrentStock = watch("current_stock");
  const watchedUnit = watch("unit");
  const watchedImageUrl = watch("image_url");

  // Initialize variant data when groups change
  useEffect(() => {
    if (variantGroups.length === 0) {
      setVariantData([]);
      return;
    }
    const combos = computeCombinations(variantGroups);
    setVariantData((prev) => {
      const prevMap = new Map(prev.map((d) => [d.option_ids.join("-"), d]));
      return combos.map((combo) => {
        const key = combo.option_ids.join("-");
        const existing = prevMap.get(key);
        if (existing) return existing;
        return {
          option_ids: combo.option_ids,
          sku: "",
          cost_price: watchedCostPrice ?? 0,
          sale_price: watchedSalePrice ?? 0,
          current_stock: watchedCurrentStock ?? 0,
          image_url: null,
        };
      });
    });
  }, [variantGroups, watchedCostPrice, watchedSalePrice, watchedCurrentStock]);

  const productMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createProduct(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
      return result;
    },
    queryKey: productKeys.all,
    buildOptimistic: (formData) => {
      const brandName = formData.get("brand_name")?.toString() ?? "";
      const matchedBrand = brands?.find(
        (b) => b.name.toLowerCase() === brandName.toLowerCase(),
      );
      return {
        id: `opt-${Date.now()}`,
        name: formData.get("name")?.toString() ?? "",
        sku: formData.get("sku")?.toString() || null,
        barcode: formData.get("barcode")?.toString() || null,
        unit: formData.get("unit")?.toString() ?? "ширхэг",
        category_name: formData.get("category_name")?.toString() || null,
        brand_name: matchedBrand?.name ?? (brandName || null),
        brand_logo_url: matchedBrand?.logo_url ?? null,
        description: formData.get("description")?.toString() || null,
        cost_price: Number(formData.get("cost_price") ?? 0),
        sale_price: Number(formData.get("sale_price") ?? 0),
        current_stock: Number(formData.get("current_stock") ?? 0),
        min_stock: Number(formData.get("min_stock") ?? 0),
        image_url: formData.get("image_url")?.toString() || null,
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
    formData.append("brand_name", data.brand_name ?? "");
    formData.append("description", data.description ?? "");
    formData.append("material_type", data.material_type ?? "");
    formData.append("additional_info", data.additional_info ?? "");
    formData.append("usage_instructions", data.usage_instructions ?? "");
    formData.append("care_instructions", data.care_instructions ?? "");
    formData.append("cost_price", String(data.cost_price));
    formData.append("sale_price", String(data.sale_price));
    formData.append("current_stock", String(data.current_stock));
    formData.append("min_stock", String(data.min_stock));
    formData.append("image_url", data.image_url ?? "");

    // Attach variant data from state
    if (hasVariants) {
      formData.append("variant_groups", JSON.stringify(variantGroups));
      formData.append("variant_data", JSON.stringify(variantData));
    }

    productMutation.mutate(formData, { onSuccess: () => setOpen(false) });
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      panelWidth="46rem"
      trigger={
        hideTrigger ? undefined : (
          <button
            type="button"
            className={buttonVariants({ variant: "default" })}
          >
            <Plus className="size-4" />
            Шинэ бүтээгдэхүүн
          </button>
        )
      }
      title="Шинэ бүтээгдэхүүн"
      description="Каталогтоо бараа нэмээд шууд агуулах болон борлуулалтын урсгалд ашиглана."
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="product-form"
            isPending={productMutation.isPending}
            data-testid="create-product-submit"
          />
        </DrawerFooter>
      }
    >
      <form
        id="product-form"
        onSubmit={handleSubmit(onSubmit)}
        className="relative"
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_156px]">
          {/* ── Left: form fields ── */}
          <div className="space-y-6 min-w-0">
            {/* Basic info */}
            <div className="space-y-4">
              <SectionHeader icon={Package} label="Үндсэн мэдээлэл" />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Нэр</FieldLabel>
                  <Input
                    id="name"
                    required
                    placeholder="Цай 500гр"
                    autoFocus
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="sku">SKU</FieldLabel>
                    <Input
                      id="sku"
                      placeholder="TEA-500"
                      {...register("sku")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="unit">Нэгж</FieldLabel>
                    <Controller
                      name="unit"
                      control={control}
                      render={({ field }) => (
                        <CreatableCombobox
                          name="unit"
                          id="unit"
                          placeholder="ширхэг"
                          initialItems={unitGroups}
                          value={field.value ?? ""}
                          onChange={(next) => field.onChange(next)}
                          emptyLabel="Нэгж байхгүй"
                        />
                      )}
                    />
                    {errors.unit && (
                      <p className="text-xs text-destructive">
                        {errors.unit.message}
                      </p>
                    )}
                  </Field>
                </div>

                {hasCategories && (
                  <Field>
                    <FieldLabel htmlFor="category_name">Ангилал</FieldLabel>
                    <Controller
                      name="category_name"
                      control={control}
                      render={({ field }) => (
                        <CreatableCombobox
                          name="category_name"
                          id="category_name"
                          placeholder="Ангилал сонгох эсвэл бичих"
                          initialItems={presets}
                          value={field.value ?? ""}
                          onChange={(next) => field.onChange(next)}
                          emptyLabel="Ангилал байхгүй"
                        />
                      )}
                    />
                    <FieldDescription>
                      Байгууллагын төрөлд тохирсон ангиллууд санал болгогдоно.
                      Шинэ нэр оруулбал автоматаар үүсгэнэ.
                    </FieldDescription>
                  </Field>
                )}

                {hasBrands && (
                  <Field>
                    <FieldLabel htmlFor="brand_name">Брэнд</FieldLabel>
                    <Controller
                      name="brand_name"
                      control={control}
                      render={({ field }) => (
                        <CreatableCombobox
                          name="brand_name"
                          id="brand_name"
                          placeholder="Брэнд сонгох эсвэл бичих"
                          initialItems={
                            (brands ?? []).map(
                              (b) => b.name,
                            ) as readonly string[]
                          }
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          emptyLabel="Шинээр брэнд үүсгэх"
                        />
                      )}
                    />
                    <FieldDescription>
                      Одоо байгаа брэндээс сонгох эсвэл шинэ нэр бичиж үүсгэнэ
                      үү.
                    </FieldDescription>
                  </Field>
                )}
              </FieldGroup>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <SectionHeader icon={TextT} label="Тайлбар" />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="description">
                    Бүтээгдэхүүний тайлбар
                  </FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="Жишээ нь: Өндөр чанартай, байгалийн гаралтай цай..."
                    rows={3}
                    {...register("description")}
                  />
                  <FieldDescription>
                    Нийтийн дэлгүүр, каталогийн хуудсанд бүтээгдэхүүний тайлбар
                    хэсэгт харагдана.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </div>

            {/* Prices & Stock */}
            <div className="space-y-4">
              <SectionHeader icon={ShoppingCart} label="Үнэ ба үлдэгдэл" />
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="cost_price">Өртөг үнэ</FieldLabel>
                    <Controller
                      control={control}
                      name="cost_price"
                      render={({ field }) => (
                        <CurrencyInput
                          id="cost_price"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sale_price">Зарах үнэ</FieldLabel>
                    <Controller
                      control={control}
                      name="sale_price"
                      render={({ field }) => (
                        <CurrencyInput
                          id="sale_price"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="current_stock">
                    Эхний үлдэгдэл
                  </FieldLabel>
                  <Input
                    id="current_stock"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("current_stock", {
                      valueAsNumber: true,
                    })}
                  />
                  {variantGroups.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Варианттай бүтээгдэхүүний үлдэгдэл нь вариант тус бүрээр
                      тооцогдоно.
                    </p>
                  )}
                </Field>
              </FieldGroup>
            </div>

            {/* Additional — collapsible */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <CaretDown
                  className={cn(
                    "size-3 transition-transform",
                    showMore && "-rotate-180",
                  )}
                  weight="bold"
                />
                Нэмэлт тохиргоо
              </button>
              {showMore && (
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        id="barcode"
                        className="flex-1"
                        placeholder="8654..."
                        {...register("barcode")}
                      />
                      <button
                        type="button"
                        onClick={() => setIsBarcodeScannerOpen(true)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="Камераар скан хийх"
                      >
                        <Camera className="size-4" weight="bold" />
                      </button>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="min_stock">Доод үлдэгдэл</FieldLabel>
                    <Input
                      id="min_stock"
                      type="number"
                      min="0"
                      step="0.01"
                      {...register("min_stock", { valueAsNumber: true })}
                    />
                    <FieldDescription>
                      Үлдэгдэл энэ тооноос доош буувал мэдэгдэл ирнэ.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="image_url">Зураг</FieldLabel>
                    <div className="relative">
                      <ImageSquare className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="image_url"
                        className="pl-9"
                        placeholder="https://... эсвэл зураг хавсаргах"
                        {...register("image_url")}
                      />
                    </div>
                    <FieldDescription>
                      Бүтээгдэхүүний зургийн холбоос. Дэлгүүрийн харагдац болон
                      каталогт харагдана.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="material_type">Материал</FieldLabel>
                    <Input
                      id="material_type"
                      placeholder="Жишээ нь: хөвөн, арьс, хуванцар"
                      {...register("material_type")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="additional_info">
                      Нэмэлт мэдээлэл
                    </FieldLabel>
                    <Textarea
                      id="additional_info"
                      placeholder="Жин, хэмжээ, багцалсан хэлбэр гэх мэт"
                      rows={2}
                      {...register("additional_info")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="usage_instructions">
                      Ашиглах заавар
                    </FieldLabel>
                    <Textarea
                      id="usage_instructions"
                      placeholder="Хэрэглэх арга, заавар"
                      rows={2}
                      {...register("usage_instructions")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="care_instructions">
                      Арчилгааны заавар
                    </FieldLabel>
                    <Textarea
                      id="care_instructions"
                      placeholder="Угаах, арчлах, хадгалах заавар"
                      rows={2}
                      {...register("care_instructions")}
                    />
                  </Field>
                </FieldGroup>
              )}
            </div>

            {/* Variants */}
            {hasVariants && (
              <>
                <VariantManagerDrawer
                  groups={variantGroups}
                  onGroupsChange={setVariantGroups}
                  defaultValues={{
                    cost_price: watchedCostPrice ?? 0,
                    sale_price: watchedSalePrice ?? 0,
                    current_stock: watchedCurrentStock ?? 0,
                  }}
                  variantData={variantData}
                  onVariantsChange={setVariantData}
                  inline
                />
                <VariantSummaryCard
                  groups={variantGroups}
                  variantData={variantData}
                />
              </>
            )}
          </div>

          {/* ── Right: preview card ── */}
          <div className="hidden md:block">
            <div className="sticky top-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Урьдчилсан харагдац
              </p>
              <ProductPreviewCard
                name={watchedName}
                sale_price={watchedSalePrice ?? 0}
                unit={watchedUnit}
                image_url={watchedImageUrl}
              />
            </div>
          </div>
        </div>

        <ErrorBanner error={productMutation.error} />
      </form>

      {isBarcodeScannerOpen && (
        <CameraScanner
          onScan={handleBarcodeScan}
          onClose={() => setIsBarcodeScannerOpen(false)}
        />
      )}
    </DrawerLayout>
  );
}
