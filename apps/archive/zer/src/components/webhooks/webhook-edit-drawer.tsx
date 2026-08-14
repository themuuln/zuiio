"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateWebhook } from "@/app/(dashboard)/webhooks/actions";
import type { WebhookRow } from "@/app/(dashboard)/webhooks/page";
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
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_LABELS } from "./webhook-create-drawer";

const webhookSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  url: z.string().url("URL буруу байна"),
  secret: z.string().optional(),
  is_active: z.boolean().default(true),
});

type WebhookValues = z.infer<typeof webhookSchema>;

export function WebhookEditDrawer({
  webhook,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  eventTypes,
}: {
  webhook: WebhookRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  eventTypes: string[];
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    webhook.event_types ?? [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WebhookValues>({
    resolver: zodResolver(webhookSchema) as Resolver<WebhookValues>,
    defaultValues: {
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret ?? "",
      is_active: webhook.is_active,
    },
  });

  useEffect(() => {
    if (open) {
      setSelectedEvents(webhook.event_types ?? []);
      reset({
        name: webhook.name,
        url: webhook.url,
        secret: webhook.secret ?? "",
        is_active: webhook.is_active,
      });
    }
  }, [open, webhook, reset]);

  const webhookMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateWebhook(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: webhookKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
    buildOptimistic: (formData) => ({
      name: formData.get("name")?.toString() ?? "",
      url: formData.get("url")?.toString() ?? "",
      event_types: (formData.get("event_types")?.toString() ?? "")
        .split(",")
        .filter(Boolean),
      is_active: formData.get("is_active") === "true",
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
    formData.append("id", webhook.id);
    formData.append("name", data.name);
    formData.append("url", data.url);
    formData.append("secret", data.secret ?? "");
    formData.append("event_types", selectedEvents.join(","));
    formData.append("is_active", String(data.is_active));

    webhookMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Вебхук шинэчлэгдсэн.");
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
      title="Вебхук засах"
      description={webhook.name}
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="webhook-edit-form"
            isPending={webhookMutation.isPending}
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="webhook-edit-form"
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
