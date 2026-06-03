"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { CustomerSelect } from "@/components/work-orders/customer-select";
import { VehicleSelect } from "@/components/work-orders/vehicle-select";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
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
  onSuccess?: (appointment: any) => void;
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

  const createMutation = useMutation({
    mutationFn: async (data: Values) => {
      if (!selectedCustomer) throw new Error("Customer is required");
      if (!selectedVehicle) throw new Error("Vehicle is required");
      if (!scheduledAt) throw new Error("Date/time is required");

      const res = await fetch(`/api/organizations/${orgId}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          customer_id: selectedCustomer.id,
          vehicle_id: selectedVehicle.id,
          scheduled_at: scheduledAt.toISOString(),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: (appointment) => {
      form.reset();
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      onSuccess?.(appointment);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t("failedToCreate")),
  });

  const handleSubmit = form.handleSubmit((data) => createMutation.mutate(data));

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
            className="h-11"
          />
          {form.formState.errors.title && (
            <FieldError>{form.formState.errors.title.message}</FieldError>
          )}
        </FieldContent>
      </Field>

      {/* Date */}
      <Field>
        <FieldLabel>
          {t("dateTime")} <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <DatePicker value={scheduledAt} onChange={setScheduledAt} />
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
