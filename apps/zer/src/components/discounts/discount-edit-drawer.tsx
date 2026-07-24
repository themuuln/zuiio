"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { NotePencil } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateDiscount } from "@/app/(dashboard)/discounts/actions";
import { buttonVariants } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatRouteDate } from "@/lib/format";
import { discountKeys } from "@/lib/query/keys";
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";

const discountEditSchema = z.object({
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

type DiscountEditValues = z.infer<typeof discountEditSchema>;

export interface DiscountEditData {
  id: string;
  name: string;
  description: string | null;
  type: "percentage" | "fixed_amount";
  value: number;
  applies_to: "all" | "selected_products" | "selected_categories";
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  usage_limit: number | null;
}

export function DiscountEditDrawer({
  discount,
}: {
  discount: DiscountEditData;
}) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<DiscountEditValues>({
    resolver: zodResolver(discountEditSchema) as Resolver<DiscountEditValues>,
    defaultValues: {
      name: discount.name,
      description: discount.description ?? "",
      type: discount.type,
      value: discount.value,
      applies_to: discount.applies_to,
      min_purchase_amount: discount.min_purchase_amount,
      valid_from: discount.valid_from,
      valid_until: discount.valid_until ?? "",
      usage_limit: discount.usage_limit ?? undefined,
      is_active: discount.is_active,
    },
  });

  const updateMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateDiscount(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: discountKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
    buildOptimistic: (formData) => ({
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() || null,
      type: (formData.get("type")?.toString() ?? "percentage") as
        | "percentage"
        | "fixed_amount",
      value: Number(formData.get("value") ?? 0),
      applies_to: (formData.get("applies_to")?.toString() ?? "all") as
        | "all"
        | "selected_products"
        | "selected_categories",
      min_purchase_amount: Number(formData.get("min_purchase_amount") ?? 0),
      valid_from: formData.get("valid_from")?.toString() ?? "",
      valid_until: formData.get("valid_until")?.toString() || null,
      is_active: formData.get("is_active")?.toString() === "true",
      usage_limit: formData.has("usage_limit")
        ? Number(formData.get("usage_limit"))
        : null,
    }),
  });

  const onSubmit = (data: DiscountEditValues) => {
    const formData = new FormData();
    formData.append("id", discount.id);
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
    formData.append("conditions", JSON.stringify([]));

    updateMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Хямдрал амжилттай шинэчлэгдсэн.");
      },
    });
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          title="Засах"
        >
          <NotePencil className="size-3.5" />
        </button>
      }
      title="Хямдрал засах"
      description={discount.name}
      panelWidth="32rem"
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="edit-discount-form"
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
        id="edit-discount-form"
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
                    htmlFor="discount-type-percentage"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value="percentage"
                      id="discount-type-percentage"
                    />
                    Хувь
                  </label>
                  <label
                    htmlFor="discount-type-fixed"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value="fixed_amount"
                      id="discount-type-fixed"
                    />
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
                  onChange={(e) => field.onChange(e.target.value)}
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
              {...register("usage_limit", { valueAsNumber: true })}
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
      </form>
    </DrawerLayout>
  );
}
