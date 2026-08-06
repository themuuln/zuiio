"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { capture } from "@zuiio/capture";
import { useEffect, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createDiscount } from "@/app/(dashboard)/discounts/actions";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatRouteDate } from "@/lib/format";
import { discountKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import { createClient } from "@/lib/supabase/client";

const discountSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed_amount"]),
  value: z.number().min(0.01, "Утга 0-ээс их байх ёстой"),
  applies_to: z.enum(["all", "selected_products", "selected_categories"]),
  min_purchase_amount: z.number().min(0).default(0),
  valid_from: z.string().min(1, "Хүчинтэй эхлэх огноо шаардлагатай"),
  valid_until: z.string().optional(),
  usage_limit: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
});

type DiscountValues = z.infer<typeof discountSchema>;

interface ConditionItem {
  condition_type: "product" | "category";
  condition_value: string;
  label: string;
}

export function DiscountCreateDrawer({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  products,
  categories,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  products?: Array<{ id: string; name: string }>;
  categories?: Array<{ id: string; name: string }>;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  // Conditions for selected_products / selected_categories
  const [conditions, setConditions] = useState<ConditionItem[]>([]);

  // Product/category search queries
  const [productQuery, setProductQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");

  // Locally fetched products/categories if not provided
  const [localProducts, setLocalProducts] = useState<Array<{
    id: string;
    name: string;
  }> | null>(null);
  const [localCategories, setLocalCategories] = useState<Array<{
    id: string;
    name: string;
  }> | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<DiscountValues>({
    resolver: zodResolver(discountSchema) as Resolver<DiscountValues>,
    defaultValues: {
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      applies_to: "all",
      min_purchase_amount: 0,
      valid_from: new Date().toISOString().slice(0, 10),
      valid_until: "",
      usage_limit: undefined,
      is_active: true,
    },
  });

  const appliesTo = watch("applies_to");

  // Fetch products/categories on demand when drawer opens
  useEffect(() => {
    if (!open) return;
    if (products || localProducts) return;

    async function fetchData() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userData.user.id)
        .single();

      if (profileError) capture(profileError);
      if (!profile?.organization_id) return;

      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name")
          .eq("organization_id", profile.organization_id)
          .is("deleted_at", null)
          .order("name"),
        supabase
          .from("categories")
          .select("id, name")
          .eq("organization_id", profile.organization_id)
          .order("name"),
      ]);
      if (productsRes.error) capture(productsRes.error);
      if (categoriesRes.error) capture(categoriesRes.error);

      if (productsRes.data) setLocalProducts(productsRes.data);
      if (categoriesRes.data) setLocalCategories(categoriesRes.data);
    }

    fetchData();
  }, [open, products, localProducts]);

  const effectiveProducts = products ?? localProducts ?? [];
  const effectiveCategories = categories ?? localCategories ?? [];

  // Filter products by search query
  const trimmedProductQuery = productQuery.trim().toLowerCase();
  const filteredProducts = trimmedProductQuery
    ? effectiveProducts.filter((p) =>
        p.name.toLowerCase().includes(trimmedProductQuery),
      )
    : effectiveProducts;

  // Filter categories by search query
  const trimmedCategoryQuery = categoryQuery.trim().toLowerCase();
  const filteredCategories = trimmedCategoryQuery
    ? effectiveCategories.filter((c) =>
        c.name.toLowerCase().includes(trimmedCategoryQuery),
      )
    : effectiveCategories;

  // Add/remove condition items
  const addProductCondition = (product: { id: string; name: string }) => {
    if (conditions.some((c) => c.condition_value === product.id)) return;
    setConditions((prev) => [
      ...prev,
      {
        condition_type: "product",
        condition_value: product.id,
        label: product.name,
      },
    ]);
    setProductQuery("");
  };

  const addCategoryCondition = (category: { id: string; name: string }) => {
    if (conditions.some((c) => c.condition_value === category.id)) return;
    setConditions((prev) => [
      ...prev,
      {
        condition_type: "category",
        condition_value: category.id,
        label: category.name,
      },
    ]);
    setCategoryQuery("");
  };

  const removeCondition = (conditionValue: string) => {
    setConditions((prev) =>
      prev.filter((c) => c.condition_value !== conditionValue),
    );
  };

  // Check if products are already selected
  const selectedProductIds = conditions
    .filter((c) => c.condition_type === "product")
    .map((c) => c.condition_value);

  const selectedCategoryIds = conditions
    .filter((c) => c.condition_type === "category")
    .map((c) => c.condition_value);

  const discountMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createDiscount(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: discountKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      name: formData.get("name")?.toString() ?? "",
      type: formData.get("type")?.toString() ?? "percentage",
      value: Number(formData.get("value") ?? 0),
      applies_to: formData.get("applies_to")?.toString() ?? "all",
      is_active: formData.get("is_active") === "true",
      valid_from: formData.get("valid_from")?.toString() ?? "",
      created_at: new Date().toISOString(),
    }),
  });

  const onSubmit = (data: DiscountValues) => {
    if (discountMutation.isPending) return;

    if (
      (data.applies_to === "selected_products" ||
        data.applies_to === "selected_categories") &&
      conditions.length === 0
    ) {
      toast.error(
        data.applies_to === "selected_products"
          ? "Бүтээгдэхүүн сонгоно уу."
          : "Ангилал сонгоно уу.",
      );
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description ?? "");
    formData.append("type", data.type);
    formData.append("value", String(data.value));
    formData.append("applies_to", data.applies_to);
    formData.append("min_purchase_amount", String(data.min_purchase_amount));
    formData.append("valid_from", data.valid_from);
    formData.append("valid_until", data.valid_until ?? "");
    formData.append("is_active", String(data.is_active));
    if (data.usage_limit !== undefined && data.usage_limit > 0) {
      formData.append("usage_limit", String(data.usage_limit));
    }

    // Serialize conditions
    if (
      data.applies_to === "selected_products" ||
      data.applies_to === "selected_categories"
    ) {
      formData.append(
        "conditions",
        JSON.stringify(
          conditions.map((c) => ({
            condition_type: c.condition_type,
            condition_value: c.condition_value,
          })),
        ),
      );
    }

    discountMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setConditions([]);
        toast.success("Хямдрал амжилттай үүсгэгдсэн.");
      },
    });
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setConditions([]);
          reset();
        }
      }}
      title="Шинэ хямдрал"
      description="Бүтээгдэхүүний хямдрал болон урамшууллын тохиргоо"
      trigger={
        <Button variant="default" size="sm">
          Шинэ хямдрал
        </Button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel
            onClick={() => {
              setOpen(false);
              setConditions([]);
            }}
          />
          <DrawerSubmit
            form="discount-form"
            isPending={discountMutation.isPending}
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="discount-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Нэр</FieldLabel>
            <Input placeholder="Жишээ: Зуны хямдрал" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>
              Тайлбар{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Textarea
              placeholder="Хямдралын дэлгэрэнгүй мэдээлэл..."
              {...register("description")}
            />
          </Field>

          <Field>
            <FieldLabel>Төрөл</FieldLabel>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-2"
                >
                  <label
                    htmlFor="dc-type-percentage"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value="percentage"
                      id="dc-type-percentage"
                    />
                    Хувь
                  </label>
                  <label
                    htmlFor="dc-type-fixed"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="fixed_amount" id="dc-type-fixed" />
                    Тогтмол дүн
                  </label>
                </RadioGroup>
              )}
            />
          </Field>

          <Field>
            <FieldLabel>Утга</FieldLabel>
            <div className="relative">
              <Input
                type="number"
                min="0.01"
                step="any"
                placeholder="0"
                {...register("value", { valueAsNumber: true })}
              />
              {watch("type") === "percentage" && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              )}
            </div>
            {errors.value && (
              <p className="text-xs text-destructive">{errors.value.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>Хамаарах хүрээ</FieldLabel>
            <Controller
              control={control}
              name="applies_to"
              render={({ field }) => (
                <NativeSelect
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    // Clear conditions when switching to "all"
                    if (e.target.value === "all") {
                      setConditions([]);
                    }
                  }}
                >
                  <option value="all">Бүх бүтээгдэхүүн</option>
                  <option value="selected_products">
                    Сонгосон бүтээгдэхүүн
                  </option>
                  <option value="selected_categories">Сонгосон ангилал</option>
                </NativeSelect>
              )}
            />
          </Field>

          {/* Multi-select for products */}
          {appliesTo === "selected_products" && (
            <Field>
              <FieldLabel>Бүтээгдэхүүн сонгох</FieldLabel>
              <Combobox
                items={filteredProducts}
                value={null}
                onValueChange={(item: { id: string; name: string } | null) => {
                  if (item) addProductCondition(item);
                }}
                itemToStringLabel={(
                  item: { id: string; name: string } | null,
                ) => item?.name ?? ""}
                inputValue={productQuery}
                onInputValueChange={setProductQuery}
              >
                <ComboboxInput
                  placeholder="Бүтээгдэхүүн хайх..."
                  showTrigger
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Бүтээгдэхүүн байхгүй</ComboboxEmpty>
                  <ComboboxList>
                    {(item: { id: string; name: string }) => {
                      const isSelected = selectedProductIds.includes(item.id);
                      return (
                        <ComboboxItem
                          key={item.id}
                          value={item.id}
                          className={isSelected ? "bg-accent" : ""}
                        >
                          {isSelected ? "✓ " : ""}
                          {item.name}
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {/* Selected products as tags */}
              {conditions.filter((c) => c.condition_type === "product").length >
                0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {conditions
                    .filter((c) => c.condition_type === "product")
                    .map((cond) => (
                      <span
                        key={cond.condition_value}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                      >
                        {cond.label}
                        <button
                          type="button"
                          onClick={() => removeCondition(cond.condition_value)}
                          className="ml-0.5 text-primary/60 hover:text-primary"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </Field>
          )}

          {/* Multi-select for categories */}
          {appliesTo === "selected_categories" && (
            <Field>
              <FieldLabel>Ангилал сонгох</FieldLabel>
              <Combobox
                items={filteredCategories}
                value={null}
                onValueChange={(item: { id: string; name: string } | null) => {
                  if (item) addCategoryCondition(item);
                }}
                itemToStringLabel={(
                  item: { id: string; name: string } | null,
                ) => item?.name ?? ""}
                inputValue={categoryQuery}
                onInputValueChange={setCategoryQuery}
              >
                <ComboboxInput
                  placeholder="Ангилал хайх..."
                  showTrigger
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Ангилал байхгүй</ComboboxEmpty>
                  <ComboboxList>
                    {(item: { id: string; name: string }) => {
                      const isSelected = selectedCategoryIds.includes(item.id);
                      return (
                        <ComboboxItem
                          key={item.id}
                          value={item.id}
                          className={isSelected ? "bg-accent" : ""}
                        >
                          {isSelected ? "✓ " : ""}
                          {item.name}
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {/* Selected categories as tags */}
              {conditions.filter((c) => c.condition_type === "category")
                .length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {conditions
                    .filter((c) => c.condition_type === "category")
                    .map((cond) => (
                      <span
                        key={cond.condition_value}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                      >
                        {cond.label}
                        <button
                          type="button"
                          onClick={() => removeCondition(cond.condition_value)}
                          className="ml-0.5 text-primary/60 hover:text-primary"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </Field>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Хүчинтэй эхлэх</FieldLabel>
              <Controller
                control={control}
                name="valid_from"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date ? formatRouteDate(date) : "")
                    }
                  />
                )}
              />
              {errors.valid_from && (
                <p className="text-xs text-destructive">
                  {errors.valid_from.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel>
                Хүчинтэй дуусах{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Controller
                control={control}
                name="valid_until"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date ? formatRouteDate(date) : "")
                    }
                    placeholder="Дуусах огноо"
                  />
                )}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>
              Хамгийн бага дүн{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Controller
              control={control}
              name="min_purchase_amount"
              render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>

          <Field>
            <FieldLabel>
              Ашиглах хязгаар{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Хязгааргүй"
              {...register("usage_limit", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number(value),
              })}
            />
          </Field>

          <Field>
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FieldLabel className="mb-0">Идэвхтэй</FieldLabel>
            </div>
          </Field>
        </FieldGroup>

        <ErrorBanner error={discountMutation.error} />
      </form>
    </SlideInDrawer>
  );
}
