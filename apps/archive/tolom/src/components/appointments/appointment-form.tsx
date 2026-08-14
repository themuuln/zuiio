"use client";

import { useOrgMutation } from "@zuiio/query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { AppointmentDatePicker } from "@/components/ui/appointment-date-picker";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { Typography } from "@/components/ui/typography";
import { CustomerSelect } from "@/components/work-orders/customer-select";
import { VehicleSelect } from "@/components/work-orders/vehicle-select";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { appointmentKeys } from "@/lib/queries/keys";
import type { Customer, Vehicle } from "@/lib/types";

// ── Schema ─────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

// ── Props ──────────────────────────────────────────────────────

export type AppointmentFormProps = {
  mode?: "quick" | "full";
  orgId: string;
  onSuccess?: (appointment: Record<string, unknown>) => void;
  onCancel?: () => void;
};

// ── Component ──────────────────────────────────────────────────

export function AppointmentForm({
  orgId,
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const t = useTranslations("appointments");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(new Date());

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", notes: "" },
  });

  const createMutation = useOrgMutation<
    unknown,
    Values & { customer_id: string; vehicle_id: string; scheduled_at: string }
  >({
    endpoint: `/api/organizations/${orgId}/appointments`,
    method: "POST",
    queryKey: appointmentKeys.all(orgId),
    successMessage: t("created"),
    errorMessage: t("failedToCreate"),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!selectedCustomer || !selectedVehicle || !scheduledAt) return;
    const result = await createMutation.mutateAsync({
      ...data,
      customer_id: selectedCustomer.id,
      vehicle_id: selectedVehicle.id,
      scheduled_at: scheduledAt.toISOString(),
    });
    form.reset();
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    onSuccess?.(result as Record<string, unknown>);
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Customer */}
      <div>
        <Typography.Text className="text-sm font-medium mb-2 block">
          {t("customer")} <span className="text-destructive">*</span>
        </Typography.Text>
        <CustomerSelect
          orgId={orgId}
          selectedCustomer={selectedCustomer}
          onSelect={setSelectedCustomer}
          onClear={() => setSelectedCustomer(null)}
        />
      </div>

      {/* Vehicle */}
      <div>
        <Typography.Text className="text-sm font-medium mb-2 block">
          {t("vehicle")} <span className="text-destructive">*</span>
        </Typography.Text>
        <VehicleSelect
          orgId={orgId}
          customerId={selectedCustomer?.id ?? null}
          selectedVehicle={selectedVehicle}
          onSelect={setSelectedVehicle}
          onClear={() => setSelectedVehicle(null)}
        />
      </div>

      {/* Title */}
      <Field data-invalid={!!form.formState.errors.title}>
        <FieldLabel>
          {t("title")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Input
            placeholder={t("titlePlaceholder")}
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <FieldError>{form.formState.errors.title.message}</FieldError>
          )}
        </FieldContent>
      </Field>

      {/* Date & Time */}
      <Field>
        <FieldLabel>
          {t("dateTime")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <div className="flex gap-3">
            <AppointmentDatePicker
              value={scheduledAt}
              onChange={setScheduledAt}
              className="flex-1"
            />
            <TimePicker
              value={scheduledAt}
              onChange={setScheduledAt}
              className="w-[180px]"
            />
          </div>
        </FieldContent>
      </Field>

      {/* Description */}
      <Field>
        <FieldLabel>{t("description")}</FieldLabel>
        <FieldContent>
          <Textarea
            placeholder={t("descriptionPlaceholder")}
            rows={3}
            {...form.register("description")}
          />
        </FieldContent>
      </Field>

      {/* Notes */}
      <Field>
        <FieldLabel>{t("internalNotes")}</FieldLabel>
        <FieldContent>
          <Textarea
            placeholder={t("notesPlaceholder")}
            rows={2}
            {...form.register("notes")}
          />
        </FieldContent>
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-11 px-6 flex-1 sm:flex-none"
          >
            {t("cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={
            createMutation.isPending ||
            !selectedCustomer ||
            !selectedVehicle ||
            !scheduledAt
          }
          className="h-11 px-6 min-w-[140px] flex-1 sm:flex-none"
        >
          {createMutation.isPending ? t("creating") : t("createAppointment")}
        </Button>
      </div>
    </form>
  );
}
