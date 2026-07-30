"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateCoupon } from "@/app/(dashboard)/coupons/actions";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatRouteDate } from "@/lib/format";
import { couponKeys } from "@/lib/query/keys";
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";

const couponEditSchema = z.object({
  code: z
    .string()
    .min(1, "Код шаардлагатай")
    .regex(/^[a-zA-Z0-9]+$/, "Код зөвхөн үсэг, тоо орно"),
  discount_type: z.enum(["percentage", "fixed_amount"]),
  discount_value: z.number().min(0.01, "Утга 0-ээс их байх ёстой"),
  min_purchase_amount: z.number().min(0).default(0),
  max_discount_amount: z.number().min(0).optional(),
  valid_from: z.string().min(1, "Хүчинтэй эхлэх огноо шаардлагатай"),
  valid_until: z.string().optional(),
  usage_limit: z.number().min(0).optional(),
  per_customer_limit: z
    .number()
    .min(1, "Хязгаар 1-ээс багагүй байх ёстой")
    .default(1),
  applies_to: z.enum(["all", "selected_products", "selected_categories"]),
  is_active: z.boolean().default(true),
  description: z.string().optional(),
});

type CouponEditValues = z.infer<typeof couponEditSchema>;

export interface CouponEditData {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  per_customer_limit: number;
  applies_to: "all" | "selected_products" | "selected_categories";
  is_active: boolean;
  description: string | null;
}

export function CouponEditDrawer({
  coupon,
  open,
  onOpenChange,
}: {
  coupon: CouponEditData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CouponEditValues>({
    resolver: zodResolver(couponEditSchema) as Resolver<CouponEditValues>,
    defaultValues: {
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase_amount: coupon.min_purchase_amount,
      max_discount_amount: coupon.max_discount_amount ?? undefined,
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until ?? "",
      usage_limit: coupon.usage_limit ?? undefined,
      per_customer_limit: coupon.per_customer_limit,
      applies_to: coupon.applies_to,
      is_active: coupon.is_active,
      description: coupon.description ?? "",
    },
  });

  const discountType = watch("discount_type");

  const updateMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateCoupon(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: couponKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
    buildOptimistic: (formData) => ({
      code: formData.get("code")?.toString() ?? "",
      discount_type:
        (formData.get("discount_type")?.toString() as
          | "percentage"
          | "fixed_amount") ?? "percentage",
      discount_value: Number(formData.get("discount_value") ?? 0),
      min_purchase_amount: Number(formData.get("min_purchase_amount") ?? 0),
      max_discount_amount: formData.has("max_discount_amount")
        ? Number(formData.get("max_discount_amount"))
        : null,
      valid_from: formData.get("valid_from")?.toString() ?? "",
      valid_until: formData.get("valid_until")?.toString() || null,
      usage_limit: formData.has("usage_limit")
        ? Number(formData.get("usage_limit"))
        : null,
      per_customer_limit: Number(formData.get("per_customer_limit") ?? 1),
      applies_to:
        (formData.get("applies_to")?.toString() as
          | "all"
          | "selected_products"
          | "selected_categories") ?? "all",
      is_active: formData.get("is_active")?.toString() === "true",
      description: formData.get("description")?.toString() || null,
    }),
  });

  const onSubmit = (data: CouponEditValues) => {
    if (updateMutation.isPending) return;

    const formData = new FormData();
    formData.append("id", coupon.id);
    formData.append("code", data.code.toUpperCase());
    formData.append("discount_type", data.discount_type);
    formData.append("discount_value", String(data.discount_value));
    formData.append("min_purchase_amount", String(data.min_purchase_amount));
    if (
      data.max_discount_amount !== undefined &&
      data.max_discount_amount > 0
    ) {
      formData.append(
        "max_discount_amount",
        String(data.max_discount_amount),
      );
    }
    formData.append("valid_from", data.valid_from);
    formData.append("valid_until", data.valid_until ?? "");
    formData.append("per_customer_limit", String(data.per_customer_limit));
    formData.append("applies_to", data.applies_to);
    formData.append("is_active", String(data.is_active));
    formData.append("description", data.description ?? "");
    if (data.usage_limit !== undefined && data.usage_limit > 0) {
      formData.append("usage_limit", String(data.usage_limit));
    }

    updateMutation.mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success("Купон амжилттай шинэчлэгдсэн.");
      },
    });
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Купон засах"
      description={coupon.code}
      panelWidth="32rem"
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => onOpenChange(false)} />
          <DrawerSubmit
            form="edit-coupon-form"
            isPending={updateMutation.isPending}
            label="Хадгалах"
            loadingLabel="Хадгалж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="edit-coupon-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Код</FieldLabel>
            <Input
              placeholder="Жишээ: SUMMER2024"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-xs text-destructive">
                {errors.code.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>Хямдралын төрөл</FieldLabel>
            <Controller
              control={control}
              name="discount_type"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-2"
                >
                  <label
                    htmlFor="ec-type-percentage"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value="percentage"
                      id="ec-type-percentage"
                    />
                    Хувь
                  </label>
                  <label
                    htmlFor="ec-type-fixed"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value="fixed_amount"
                      id="ec-type-fixed"
                    />
                    Тогтмол дүн
                  </label>
                </RadioGroup>
              )}
            />
          </Field>

          <Field>
            <FieldLabel>Хямдралын утга</FieldLabel>
            <div className="relative">
              <Input
                type="number"
                min="0.01"
                step="any"
                placeholder="0"
                {...register("discount_value", { valueAsNumber: true })}
              />
              {discountType === "percentage" && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              )}
            </div>
            {errors.discount_value && (
              <p className="text-xs text-destructive">
                {errors.discount_value.message}
              </p>
            )}
          </Field>

          {discountType === "percentage" && (
            <Field>
              <FieldLabel>
                Хамгийн их хямдралын дүн{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Controller
                control={control}
                name="max_discount_amount"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          )}

          <Field>
            <FieldLabel>
              Хамгийн бага захиалгын дүн{" "}
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
            <FieldLabel>Хамаарах хүрээ</FieldLabel>
            <Controller
              control={control}
              name="applies_to"
              render={({ field }) => (
                <NativeSelect
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value="all">Бүх бараа</option>
                  <option value="selected_products">Сонгосон бараа</option>
                  <option value="selected_categories">
                    Сонгосон ангилал
                  </option>
                </NativeSelect>
              )}
            />
          </Field>

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
              {...register("usage_limit", { valueAsNumber: true })}
            />
          </Field>

          <Field>
            <FieldLabel>Нэг хэрэглэгчийн хязгаар</FieldLabel>
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="1"
              {...register("per_customer_limit", { valueAsNumber: true })}
            />
            {errors.per_customer_limit && (
              <p className="text-xs text-destructive">
                {errors.per_customer_limit.message}
              </p>
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
              placeholder="Купоны дэлгэрэнгүй мэдээлэл..."
              {...register("description")}
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

        <ErrorBanner error={updateMutation.error} />
      </form>
    </DrawerLayout>
  );
}
