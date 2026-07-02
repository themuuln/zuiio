"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";

// ── Schema ─────────────────────────────────────────────────────

const bookingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .refine((val) => /^\+976\d{8}$/.test(val.replace(/[\s-]/g, "")), {
      message: "Enter a valid Mongolian phone number",
    }),
  plate: z.string().min(1, "Plate number is required"),
  notes: z.string().optional(),
  requestedDate: z.string().optional(),
});

type BookingValues = z.infer<typeof bookingSchema>;

// ── Component ──────────────────────────────────────────────────

interface BookingRequestFormProps {
  token: string;
  onSuccess: (message: string) => void;
  apiEndpoint?: string;
  initialName?: string;
  initialPhone?: string;
}

export function BookingRequestForm({
  token,
  onSuccess,
  apiEndpoint,
  initialName,
  initialPhone,
}: BookingRequestFormProps) {
  const t = useTranslations("booking");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: initialName ?? "",
      phone: initialPhone ?? "",
      plate: "",
      notes: "",
      requestedDate: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setSending(true);
    setSubmitError(null);

    try {
      const endpoint = apiEndpoint ?? `/api/booking/${token}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          phone: data.phone.trim(),
          plate: data.plate.trim(),
          notes: data.notes?.trim() || undefined,
          requestedDate: data.requestedDate || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error?.message ?? t("submitFailed"));
        return;
      }

      onSuccess(json.data?.message ?? t("submitSuccess"));
    } catch {
      setSubmitError(t("networkError"));
    } finally {
      setSending(false);
    }
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="border-border">
        <CardContent className="p-6 flex flex-col gap-4">
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel>
              {t("name")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder={t("namePlaceholder")}
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field data-invalid={!!form.formState.errors.phone}>
            <FieldLabel>
              {t("phone")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder={t("phonePlaceholder")}
                type="tel"
                aria-invalid={!!form.formState.errors.phone}
                {...inputProps("phone")}
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <FieldError>{form.formState.errors.phone.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field data-invalid={!!form.formState.errors.plate}>
            <FieldLabel>
              {t("vehiclePlate")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder={t("vehiclePlatePlaceholder")}
                aria-invalid={!!form.formState.errors.plate}
                {...form.register("plate")}
              />
              {form.formState.errors.plate && (
                <FieldError>{form.formState.errors.plate.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{t("preferredDate")}</FieldLabel>
            <FieldContent>
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                {...form.register("requestedDate")}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{t("notes")}</FieldLabel>
            <FieldContent>
              <Textarea
                placeholder={t("notesPlaceholder")}
                rows={3}
                {...form.register("notes")}
              />
            </FieldContent>
          </Field>

          {submitError && (
            <Typography.Muted className="text-xs text-destructive text-center">
              {submitError}
            </Typography.Muted>
          )}

          <Button type="submit" disabled={sending} className="w-full">
            {sending && <Loader2 className="size-4 animate-spin mr-2" />}
            {sending ? t("submitting") : t("requestAppointment")}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
