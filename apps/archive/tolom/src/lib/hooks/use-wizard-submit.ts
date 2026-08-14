"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { useCreateWorkOrder } from "@/lib/queries/use-wizard-data";
import type { PartLine } from "./use-part-lines";
import type { ServiceLine } from "./use-service-lines";

export function useWizardSubmit(
  orgId: string | undefined,
  options: {
    selectedCustomerId: string | null;
    selectedVehicleId: string | null;
    selectedMechanicId: string;
    description: string;
    complaint: string;
    diagnosisLabelId: string | null;
    serviceLines: ServiceLine[];
    partLines: PartLine[];
    onCreated?: () => void;
  },
) {
  const { push } = useRouter();
  const createWorkOrderMutation = useCreateWorkOrder(orgId);

  const handleCreate = useCallback(async () => {
    if (!orgId || !options.selectedCustomerId || !options.selectedVehicleId) {
      toast.error("Customer and vehicle are required");
      return;
    }

    const services = options.serviceLines.map((svc) => ({
      service_catalog_id: svc.service_catalog_id,
      service_name: svc.name,
      quantity: svc.quantity,
      unit_price: svc.base_price,
      discount_amount: svc.discount_amount_mnt,
      discount_percentage: svc.discount_percent,
    }));

    const parts = options.partLines.map((part) => ({
      part_name: part.part_name,
      part_number: part.part_number || null,
      quantity: part.quantity,
      unit_price: part.unit_price,
    }));

    createWorkOrderMutation.mutate(
      {
        customer_id: options.selectedCustomerId,
        vehicle_id: options.selectedVehicleId,
        mechanic_id: options.selectedMechanicId || null,
        notes: options.description || undefined,
        complaint: options.complaint || undefined,
        diagnosis_label_id: options.diagnosisLabelId || null,
        services,
        parts,
      },
      {
        onSuccess: (data) => {
          toast.success("Work order created");
          options.onCreated?.();
          push(`/dashboard/work-orders/${data.id}`);
        },
        onError: (err) => {
          toast.error(err?.message ?? "Failed to create work order");
        },
      },
    );
  }, [orgId, options, createWorkOrderMutation, push]);

  return {
    handleCreate,
    isSaving: createWorkOrderMutation.isPending,
  };
}
