"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createWebhook } from "@/app/(dashboard)/webhooks/actions";
import { Button } from "@/components/ui/button";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Switch } from "@/components/ui/switch";
import { webhookKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import { cn } from "@/lib/utils";

const webhookSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  url: z.string().url("URL буруу байна"),
  secret: z.string().optional(),
  is_active: z.boolean().default(true),
});

type WebhookValues = z.infer<typeof webhookSchema>;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  "sale.created": "Борлуулалт үүссэн",
  "sale.updated": "Борлуулалт шинэчлэгдсэн",
  "expense.created": "Зарлага үүссэн",
  "invoice.created": "Нэхэмжлэх үүссэн",
  "invoice.paid": "Нэхэмжлэх төлөгдсөн",
  "product.created": "Бүтээгдэхүүн үүссэн",
  "product.updated": "Бүтээгдэхүүн шинэчлэгдсэн",
  "stock.low": "Үлдэгдэл дуусах дөхсөн",
  "review.submitted": "Сэтгэгдэл илгээгдсэн",
  "blog.published": "Блог нийтэлсэн",
};

export function WebhookCreateDrawer({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  eventTypes,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  eventTypes: string[];
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WebhookValues>({
    resolver: zodResolver(webhookSchema) as Resolver<WebhookValues>,
    defaultValues: {
      name: "",
      url: "",
      secret: "",
      is_active: true,
    },
  });

  const webhookMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createWebhook(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: webhookKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      name: formData.get("name")?.toString() ?? "",
      url: formData.get("url")?.toString() ?? "",
      secret: formData.get("secret")?.toString() ?? null,
      event_types: (formData.get("event_types")?.toString() ?? "")
        .split(",")
        .filter(Boolean),
      is_active: formData.get("is_active") === "true",
      created_at: new Date().toISOString(),
      updated_at: null,
      delivery_count: 0,
      failed_count: 0,
    }),
  });

  const toggleEvent = (eventType: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventType)
        ? prev.filter((e) => e !== eventType)
        : [...prev, eventType],
    );
  };

  const onSubmit = (data: WebhookValues) => {
    if (webhookMutation.isPending) return;
    if (selectedEvents.length === 0) {
      toast.error("Дор хаяж нэг үйл явдал сонгоно уу.");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("url", data.url);
    formData.append("secret", data.secret ?? "");
    formData.append("event_types", selectedEvents.join(","));
    formData.append("is_active", String(data.is_active));

    webhookMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setSelectedEvents([]);
        reset();
        toast.success("Вебхук амжилттай үүсгэгдсэн.");
      },
    });
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSelectedEvents([]);
          reset();
        }
      }}
      title="Шинэ вебхук"
      description="Гадны системд үйл явдлын мэдээлэл илгээх"
      trigger={
        <Button variant="default" size="sm">
          Шинэ вебхук
        </Button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="webhook-form"
            isPending={webhookMutation.isPending}
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="webhook-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Нэр</FieldLabel>
            <Input
              placeholder="Жишээ: Нягтлан бодох бүртгэл"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>URL</FieldLabel>
            <Input
              placeholder="https://example.com/hooks/zer"
              type="url"
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>Секрет (заавал биш)</FieldLabel>
            <Input
              placeholder="ХМАС гарын үсэг баталгаажуулах түлхүүр"
              {...register("secret")}
            />
            <p className="text-xs text-muted-foreground">
              Товшилт бүрийг X-Zer-Signature толгойгоор гарын үсгээр
              баталгаажуулна
            </p>
          </Field>

          <Field>
            <FieldLabel>Үйл явдлууд</FieldLabel>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {eventTypes.map((eventType) => {
                const selected = selectedEvents.includes(eventType);
                return (
                  <button
                    key={eventType}
                    type="button"
                    onClick={() => toggleEvent(eventType)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    {EVENT_TYPE_LABELS[eventType] ?? eventType}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <FieldLabel>Идэвхтэй</FieldLabel>
                <p className="text-xs text-muted-foreground">
                  Идэвхгүй бол үйл явдал илгээхгүй
                </p>
              </div>
              <Switch {...register("is_active")} aria-label="Идэвхтэй эсэх" />
            </div>
          </Field>
        </FieldGroup>

        {webhookMutation.error && <ErrorBanner error={webhookMutation.error} />}
      </form>
    </SlideInDrawer>
  );
}
