"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateGiftCard } from "@/app/(dashboard)/gift-cards/actions";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { giftCardKeys } from "@/lib/query/keys";
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";

const giftCardEditSchema = z.object({
  code: z
    .string()
    .min(1, "Код шаардлагатай")
    .regex(/^[a-zA-Z0-9]+$/, "Код зөвхөн үсэг, тоо орно"),
  currency_code: z.enum(["MNT", "USD"]).default("MNT"),
  recipient_name: z.string().optional().default(""),
  recipient_email: z.string().optional().default(""),
  sender_name: z.string().optional().default(""),
  message: z.string().optional().default(""),
  expires_at: z.string().optional().default(""),
  is_active: z.boolean().default(true),
});

type GiftCardEditValues = z.infer<typeof giftCardEditSchema>;

export interface GiftCardEditData {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  currency_code: "MNT" | "USD";
  recipient_name: string | null;
  recipient_email: string | null;
  sender_name: string | null;
  message: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export function GiftCardEditDrawer({
  giftCard,
  open,
  onOpenChange,
}: {
  giftCard: GiftCardEditData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GiftCardEditValues>({
    resolver: zodResolver(giftCardEditSchema) as Resolver<GiftCardEditValues>,
    defaultValues: {
      code: giftCard.code,
      currency_code: giftCard.currency_code,
      recipient_name: giftCard.recipient_name ?? "",
      recipient_email: giftCard.recipient_email ?? "",
      sender_name: giftCard.sender_name ?? "",
      message: giftCard.message ?? "",
      expires_at: giftCard.expires_at ?? "",
      is_active: giftCard.is_active,
    },
  });

  const editMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateGiftCard(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: giftCardKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
    buildOptimistic: (formData) => ({
      id: formData.get("id")?.toString() ?? "",
      code: formData.get("code")?.toString() ?? "",
      initial_balance: giftCard.initial_balance,
      current_balance: giftCard.current_balance,
      currency_code:
        (formData.get("currency_code")?.toString() as "MNT" | "USD") ??
        "MNT",
      is_active: formData.get("is_active") === "true",
      recipient_name: formData.get("recipient_name")?.toString() ?? null,
      recipient_email: formData.get("recipient_email")?.toString() ?? null,
      sender_name: formData.get("sender_name")?.toString() ?? null,
      message: formData.get("message")?.toString() ?? null,
      expires_at: formData.get("expires_at")?.toString() ?? null,
    }),
  });

  const onSubmit = (data: GiftCardEditValues) => {
    if (editMutation.isPending) return;

    const formData = new FormData();
    formData.append("id", giftCard.id);
    formData.append("code", data.code.toUpperCase());
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

    editMutation.mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success("Бэлгийн карт амжилттай шинэчлэгдсэн.");
      },
    });
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Бэлгийн карт засах"
      description={giftCard.code}
      panelWidth="32rem"
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => onOpenChange(false)} />
          <DrawerSubmit
            form="edit-gift-card-form"
            isPending={editMutation.isPending}
            label="Хадгалах"
            loadingLabel="Хадгалж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="edit-gift-card-form"
      >
        <FieldGroup>
          {/* Balance display (read-only) */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Үлдэгдэл</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatCurrency(giftCard.current_balance)}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Анхны: {formatCurrency(giftCard.initial_balance)} &middot;{" "}
              {giftCard.currency_code}
            </p>
          </div>

          <Field>
            <FieldLabel>Код</FieldLabel>
            <Input
              placeholder="Жишээ: GIFT2024"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-xs text-destructive">
                {errors.code.message}
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

        <ErrorBanner error={editMutation.error} />
      </form>
    </DrawerLayout>
  );
}
