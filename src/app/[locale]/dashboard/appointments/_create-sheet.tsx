"use client";

import { useMutation } from "@tanstack/react-query";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  onCreated?: () => void;
}

// ── Component ──────────────────────────────────────────────────

export function AppointmentCreateSheet({
  open,
  onOpenChange,
  orgId,
  onCreated,
}: Props) {
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
    onSuccess: () => {
      toast.success("Appointment created");
      form.reset();
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      onCreated?.();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to create"),
  });

  const handleSubmit = form.handleSubmit((data) => createMutation.mutate(data));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-hidden">
        <SheetHeader>
          <SheetTitle>New Appointment</SheetTitle>
          <SheetDescription>
            Schedule a service appointment for a customer
          </SheetDescription>
        </SheetHeader>

        <form
          id="appointment-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 px-4 flex-1 overflow-y-auto"
        >
          {/* Customer */}
          <div>
            <Typography.Text className="text-sm font-medium mb-2 block">
              Customer <span className="text-destructive">*</span>
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
              Vehicle <span className="text-destructive">*</span>
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
              Title <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder="e.g. Oil change, Brake inspection"
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
              Date & Time <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <DatePicker value={scheduledAt} onChange={setScheduledAt} />
            </FieldContent>
          </Field>

          {/* Description */}
          <Field>
            <FieldLabel>Description</FieldLabel>
            <FieldContent>
              <Textarea
                placeholder="Additional details about the appointment..."
                rows={3}
                {...form.register("description")}
              />
            </FieldContent>
          </Field>

          {/* Notes */}
          <Field>
            <FieldLabel>Internal Notes</FieldLabel>
            <FieldContent>
              <Textarea
                placeholder="Internal notes for staff..."
                rows={2}
                {...form.register("notes")}
              />
            </FieldContent>
          </Field>
        </form>

        {/* Submit */}
        <div className="flex items-center gap-3 justify-end border-t px-4 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="appointment-form"
            disabled={
              createMutation.isPending ||
              !selectedCustomer ||
              !selectedVehicle ||
              !scheduledAt
            }
          >
            {createMutation.isPending ? "Creating..." : "Create Appointment"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
