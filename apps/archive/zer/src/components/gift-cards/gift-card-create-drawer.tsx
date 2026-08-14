"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createGiftCard } from "@/app/(dashboard)/gift-cards/actions";
import { Button } from "@/components/ui/button";
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
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatRouteDate } from "@/lib/format";
import { giftCardKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

const giftCardSchema = z.object({
  code: z
    .string()
    .min(1, "Код шаардлагатай")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Код зөвхөн үсэг, тоо, зураас, доогуур зураас агуулж болно",
    ),
  initial_balance: z.number().min(0.01, "Үлдэгдэл 0-ээс их байх ёстой"),
  currency_code: z.enum(["MNT", "USD"]).default("MNT"),
  recipient_name: z.string().optional().default(""),
  recipient_email: z.string().optional().default(""),
  sender_name: z.string().optional().default(""),
  message: z.string().optional().default(""),
  expires_at: z.string().optional().default(""),
  is_active: z.boolean().default(true),
});

type GiftCardValues = z.infer<typeof giftCardSchema>;

export type GiftCardCreateData = GiftCardValues;

export function GiftCardCreateDrawer({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GiftCardValues>({
    resolver: zodResolver(giftCardSchema) as Resolver<GiftCardValues>,
    defaultValues: {
      code: "",
      initial_balance: 0,
      currency_code: "MNT",
      recipient_name: "",
      recipient_email: "",
      sender_name: "",
      message: "",
      expires_at: "",
      is_active: true,
    },
  });

  const giftCardMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createGiftCard(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: giftCardKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      code: formData.get("code")?.toString() ?? "",
      initial_balance: Number(formData.get("initial_balance") ?? 0),
      current_balance: Number(formData.get("initial_balance") ?? 0),
      currency_code: formData.get("currency_code")?.toString() ?? "MNT",
      is_active: formData.get("is_active") === "true",
      issued_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }),
  });

  const onSubmit = (data: GiftCardValues) => {
    if (giftCardMutation.isPending) return;

    const formData = new FormData();
    formData.append("code", data.code.toUpperCase());
    formData.append("initial_balance", String(data.initial_balance));
    formData.append("currency_code", data.currency_code);
    formData.append("is_active", String(data.is_active));

    if (data.recipient_name) {
      formData.append("recipient_name", data.recipient_name);
    }
    if (data.recipient_email) {
      formData.append("recipient_email", data.recipient_email);
    }
    if (data.sender_name) {
      formData.append("sender_name", data.sender_name);
    }
    if (data.message) {
      formData.append("message", data.message);
    }
    if (data.expires_at) {
      formData.append("expires_at", data.expires_at);
    }

    giftCardMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        toast.success("Бэлгийн карт амжилттай үүсгэгдсэн.");
      },
    });
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
      title="Шинэ бэлгийн карт"
      description="Бэлгийн картын тохиргоо"
      trigger={
        <Button variant="default" size="sm">
          Шинэ бэлгийн карт
        </Button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="gift-card-form"
            isPending={giftCardMutation.isPending}
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="gift-card-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Код</FieldLabel>
            <Input placeholder="Жишээ: GIFT2024" {...register("code")} />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>Анхны үлдэгдэл</FieldLabel>
            <Controller
              control={control}
              name="initial_balance"
              render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.initial_balance && (
              <p className="text-xs text-destructive">
                {errors.initial_balance.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>Валют</FieldLabel>
            <Controller
              control={control}
              name="currency_code"
              render={({ field }) => (
                <NativeSelect
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value="MNT">MNT</option>
                  <option value="USD">USD</option>
                </NativeSelect>
              )}
            />
            {errors.currency_code && (
              <p className="text-xs text-destructive">
                {errors.currency_code.message}
              </p>
            )}
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                Хүлээн авагчийн нэр{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Input
                placeholder="Хүлээн авагчийн нэр"
                {...register("recipient_name")}
              />
            </Field>
            <Field>
              <FieldLabel>
                Хүлээн авагчийн и-мэйл{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Input
                type="email"
                placeholder="email@example.com"
                {...register("recipient_email")}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                Илгээгчийн нэр{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Input
                placeholder="Илгээгчийн нэр"
                {...register("sender_name")}
              />
            </Field>
            <Field>
              <FieldLabel>
                Дуусах огноо{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Controller
                control={control}
                name="expires_at"
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
              Мэдээлэл{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Textarea
              placeholder="Бэлгийн картын мэдээлэл..."
              {...register("message")}
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

        <ErrorBanner error={giftCardMutation.error} />
      </form>
    </SlideInDrawer>
  );
}
