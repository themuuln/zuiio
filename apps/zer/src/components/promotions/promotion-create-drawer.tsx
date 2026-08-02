"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import { useEffect, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createPromotion } from "@/app/(dashboard)/promotions/actions";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatRouteDate } from "@/lib/format";
import { promotionKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import { createClient } from "@/lib/supabase/client";

const PROMOTION_TYPE_OPTIONS = [
  { value: "1+1", label: "1+1" },
  { value: "2+1", label: "2+1" },
  { value: "threshold_discount", label: "Босго хямдрал" },
  { value: "bundle_discount", label: "Багц хямдрал" },
  { value: "free_shipping", label: "Үнэгүй хүргэлт" },
] as const;

function mapFormTypeToDbType(
  formType: string,
): "buy_x_get_y" | "threshold_discount" | "free_shipping" | "bundle_discount" {
  if (formType === "1+1" || formType === "2+1") return "buy_x_get_y";
  return formType as "threshold_discount" | "free_shipping" | "bundle_discount";
}

const promotionSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  description: z.string().optional(),
  type: z.enum([
    "1+1",
    "2+1",
    "threshold_discount",
    "bundle_discount",
    "free_shipping",
  ]),
  is_active: z.boolean().default(true),
  priority: z.number().min(0).default(0),
  stackable: z.boolean().default(false),
  valid_from: z.string().min(1, "Хүчинтэй эхлэх огноо шаардлагатай"),
  valid_until: z.string().optional(),
  usage_limit: z.number().min(0).optional(),
});

type PromotionValues = z.infer<typeof promotionSchema>;

interface ConditionItem {
  condition_type:
    | "min_quantity"
    | "min_amount"
    | "specific_products"
    | "specific_categories";
  condition_value: string;
  operator: "eq" | "gte" | "lte";
  label: string;
}

interface RewardItem {
  reward_type:
    | "free_product"
    | "percentage_discount"
    | "fixed_discount"
    | "free_shipping";
  reward_value: string;
  reward_product_id: string | null;
  reward_product_label: string;
  reward_max_count: string;
}

export type PromotionCreateData = PromotionValues & {
  conditions: ConditionItem[];
  rewards: RewardItem[];
};

export function PromotionCreateDrawer({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  products,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  products?: Array<{ id: string; name: string }>;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  // Conditions
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  // Rewards
  const [rewards, setRewards] = useState<RewardItem[]>([]);

  // Product search
  const [productQuery, setProductQuery] = useState("");

  // Locally fetched products if not provided
  const [localProducts, setLocalProducts] = useState<Array<{
    id: string;
    name: string;
  }> | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PromotionValues>({
    resolver: zodResolver(promotionSchema) as Resolver<PromotionValues>,
    defaultValues: {
      name: "",
      description: "",
      type: "1+1",
      is_active: true,
      priority: 0,
      stackable: false,
      valid_from: new Date().toISOString().slice(0, 10),
      valid_until: "",
      usage_limit: undefined,
    },
  });

  // Fetch products on demand when drawer opens
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

      const productsRes = await supabase
        .from("products")
        .select("id, name")
        .eq("organization_id", profile.organization_id)
        .is("deleted_at", null)
        .order("name");

      if (productsRes.error) capture(productsRes.error);
      if (productsRes.data) setLocalProducts(productsRes.data);
    }

    fetchData();
  }, [open, products, localProducts]);

  const effectiveProducts = products ?? localProducts ?? [];

  // Filter products by search query
  const trimmedProductQuery = productQuery.trim().toLowerCase();
  const filteredProducts = trimmedProductQuery
    ? effectiveProducts.filter((p) =>
        p.name.toLowerCase().includes(trimmedProductQuery),
      )
    : effectiveProducts;

  // Condition management
  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      {
        condition_type: "min_quantity",
        condition_value: "",
        operator: "gte",
        label: "Тоо хэмжээ ≥ х",
      },
    ]);
  };

  const updateCondition = (
    index: number,
    field: keyof ConditionItem,
    value: string,
  ) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  // Reward management
  const addReward = () => {
    setRewards((prev) => [
      ...prev,
      {
        reward_type: "percentage_discount",
        reward_value: "",
        reward_product_id: null,
        reward_product_label: "",
        reward_max_count: "",
      },
    ]);
  };

  const updateReward = (
    index: number,
    field: keyof RewardItem,
    value: string | null,
  ) => {
    setRewards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeReward = (index: number) => {
    setRewards((prev) => prev.filter((_, i) => i !== index));
  };

  const addRewardProduct = (
    index: number,
    product: { id: string; name: string },
  ) => {
    setRewards((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        reward_product_id: product.id,
        reward_product_label: product.name,
      };
      return next;
    });
    setProductQuery("");
  };

  const clearRewardProduct = (index: number) => {
    setRewards((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        reward_product_id: null,
        reward_product_label: "",
      };
      return next;
    });
  };

  const promotionMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createPromotion(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: promotionKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      name: formData.get("name")?.toString() ?? "",
      type: formData.get("type")?.toString() ?? "buy_x_get_y",
      is_active: formData.get("is_active") === "true",
      priority: Number(formData.get("priority") ?? 0),
      stackable: formData.get("stackable") === "true",
      valid_from: formData.get("valid_from")?.toString() ?? "",
      created_at: new Date().toISOString(),
    }),
  });

  const onSubmit = (data: PromotionValues) => {
    if (promotionMutation.isPending) return;

    if (conditions.length === 0) {
      toast.error("Дор хаяж нэг нөхцөл оруулна уу.");
      return;
    }

    if (rewards.length === 0) {
      toast.error("Дор хаяж нэг урамшуулал оруулна уу.");
      return;
    }

    const invalidCondition = conditions.find((c) => !c.condition_value);
    if (invalidCondition) {
      toast.error("Нөхцөлийн утга хоосон байна.");
      return;
    }

    const invalidReward = rewards.find((r) => !r.reward_value);
    if (invalidReward) {
      toast.error("Урамшууллын утга хоосон байна.");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description ?? "");
    formData.append("type", mapFormTypeToDbType(data.type));
    formData.append("is_active", String(data.is_active));
    formData.append("priority", String(data.priority));
    formData.append("stackable", String(data.stackable));
    formData.append("valid_from", data.valid_from);
    formData.append("valid_until", data.valid_until ?? "");
    if (data.usage_limit !== undefined && data.usage_limit > 0) {
      formData.append("usage_limit", String(data.usage_limit));
    }

    // Serialize conditions — each element must be an individual JSON string
    formData.append(
      "conditions",
      JSON.stringify(
        conditions.map((c) =>
          JSON.stringify({
            condition_type: c.condition_type,
            condition_value: c.condition_value,
            operator: c.operator,
          }),
        ),
      ),
    );

    // Serialize rewards — each element must be an individual JSON string
    formData.append(
      "rewards",
      JSON.stringify(
        rewards.map((r) =>
          JSON.stringify({
            reward_type: r.reward_type,
            reward_value: r.reward_value,
            reward_product_id: r.reward_product_id,
            reward_max_count: r.reward_max_count || null,
          }),
        ),
      ),
    );

    promotionMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setConditions([]);
        setRewards([]);
        reset();
        toast.success("Урамшуулал амжилттай үүсгэгдсэн.");
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
          setRewards([]);
          reset();
        }
      }}
      title="Шинэ урамшуулал"
      description="Урамшууллын тохиргоо"
      trigger={
        <Button variant="default" size="sm">
          Шинэ урамшуулал
        </Button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel
            onClick={() => {
              setOpen(false);
              setConditions([]);
              setRewards([]);
            }}
          />
          <DrawerSubmit
            form="promotion-form"
            isPending={promotionMutation.isPending}
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="promotion-form"
      >
        <FieldGroup>
          {/* Basic fields */}
          <Field>
            <FieldLabel>Нэр</FieldLabel>
            <Input
              placeholder="Жишээ: Зуны супер урамшуулал"
              {...register("name")}
            />
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
              placeholder="Урамшууллын дэлгэрэнгүй мэдээлэл..."
              {...register("description")}
            />
          </Field>

          {/* Type */}
          <Field>
            <FieldLabel>Төрөл</FieldLabel>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <NativeSelect
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {PROMOTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </NativeSelect>
              )}
            />
          </Field>

          {/* Priority & Stackable */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Эрэмбэ</FieldLabel>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                {...register("priority", { valueAsNumber: true })}
              />
              {errors.priority && (
                <p className="text-xs text-destructive">
                  {errors.priority.message}
                </p>
              )}
            </Field>

            <Field>
              <div className="flex h-full items-end pb-2">
                <div className="flex items-center gap-3">
                  <Controller
                    control={control}
                    name="stackable"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <FieldLabel className="mb-0">Давхцуулах</FieldLabel>
                </div>
              </div>
            </Field>
          </div>

          {/* Validity dates */}
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

          {/* Usage limit */}
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

        {/* ---- Conditions Section ---- */}
        <div className="border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Нөхцөлүүд</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCondition}
            >
              <Plus weight="bold" className="mr-1 size-3.5" />
              Нөхцөл нэмэх
            </Button>
          </div>

          {conditions.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Нөхцөл нэмээгүй байна. Дор хаяж нэг нөхцөл оруулна уу.
            </p>
          )}

          <div className="space-y-2">
            {conditions.map((cond, index) => (
              <div
                key={index}
                className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="min-w-[140px] flex-1 space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Төрөл
                  </label>
                  <NativeSelect
                    value={cond.condition_type}
                    onChange={(e) =>
                      updateCondition(index, "condition_type", e.target.value)
                    }
                    className="w-full"
                  >
                    <option value="min_quantity">Мин. тоо хэмжээ</option>
                    <option value="min_amount">Мин. дүн</option>
                    <option value="specific_products">
                      Тодорхой бүтээгдэхүүн
                    </option>
                    <option value="specific_categories">
                      Тодорхой ангилал
                    </option>
                  </NativeSelect>
                </div>

                <div className="w-20 space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Оператор
                  </label>
                  <NativeSelect
                    value={cond.operator}
                    onChange={(e) =>
                      updateCondition(index, "operator", e.target.value)
                    }
                    className="w-full"
                  >
                    <option value="gte">≥</option>
                    <option value="lte">≤</option>
                    <option value="eq">=</option>
                  </NativeSelect>
                </div>

                <div className="min-w-[100px] flex-1 space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Утга
                  </label>
                  <Input
                    placeholder={
                      cond.condition_type === "min_quantity"
                        ? "Тоо"
                        : cond.condition_type === "min_amount"
                          ? "Дүн"
                          : "ID"
                    }
                    value={cond.condition_value}
                    onChange={(e) =>
                      updateCondition(index, "condition_value", e.target.value)
                    }
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => removeCondition(index)}
                >
                  <Trash weight="bold" className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Rewards Section ---- */}
        <div className="border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Урамшуулалууд</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addReward}
            >
              <Plus weight="bold" className="mr-1 size-3.5" />
              Урамшуулал нэмэх
            </Button>
          </div>

          {rewards.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Урамшуулал нэмээгүй байна. Дор хаяж нэг урамшуулал оруулна уу.
            </p>
          )}

          <div className="space-y-2">
            {rewards.map((reward, index) => (
              <div
                key={index}
                className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="min-w-[140px] flex-1 space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Төрөл
                  </label>
                  <NativeSelect
                    value={reward.reward_type}
                    onChange={(e) =>
                      updateReward(index, "reward_type", e.target.value)
                    }
                    className="w-full"
                  >
                    <option value="percentage_discount">%-ийн хямдрал</option>
                    <option value="fixed_discount">
                      Тогтмол дүнгийн хямдрал
                    </option>
                    <option value="free_product">Үнэгүй бүтээгдэхүүн</option>
                    <option value="free_shipping">Үнэгүй хүргэлт</option>
                  </NativeSelect>
                </div>

                <div className="w-28 space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    {reward.reward_type === "percentage_discount"
                      ? "Хувь"
                      : "Утга"}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={reward.reward_value}
                    onChange={(e) =>
                      updateReward(index, "reward_value", e.target.value)
                    }
                  />
                </div>

                {reward.reward_type === "free_product" && (
                  <div className="min-w-[160px] flex-1 space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Бүтээгдэхүүн
                    </label>
                    {reward.reward_product_id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                          {reward.reward_product_label}
                          <button
                            type="button"
                            onClick={() => clearRewardProduct(index)}
                            className="ml-0.5 text-primary/60 hover:text-primary"
                          >
                            ×
                          </button>
                        </span>
                      </div>
                    ) : (
                      <Combobox
                        items={filteredProducts}
                        value={null}
                        onValueChange={(
                          item: { id: string; name: string } | null,
                        ) => {
                          if (item) addRewardProduct(index, item);
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
                            {(item: { id: string; name: string }) => (
                              <ComboboxItem key={item.id} value={item.id}>
                                {item.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    )}
                  </div>
                )}

                {reward.reward_type === "free_product" && (
                  <div className="w-20 space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Макс тоо
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="1"
                      value={reward.reward_max_count}
                      onChange={(e) =>
                        updateReward(index, "reward_max_count", e.target.value)
                      }
                    />
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => removeReward(index)}
                >
                  <Trash weight="bold" className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <ErrorBanner error={promotionMutation.error} />
      </form>
    </SlideInDrawer>
  );
}
