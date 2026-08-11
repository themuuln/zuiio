"use client";

import { DetailDrawer } from "@/components/ui/detail-drawer";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { PaymentMethodFees } from "./_payment-fees";
import { ReadyForPickupForm } from "./_ready-for-pickup-form";

// ── Props ───────────────────────────────────────────────────────

export interface DrawerNestedFormsProps {
  wo: WorkOrderDetail | null;
  showReadyForm: boolean;
  grandTotal: number;
  paymentMethodFees: PaymentMethodFees;
  transferBanks: ResolvedTransferBank[];
  onReadyFormClose: () => void;
  onReadyForPickupSubmit: (data: {
    odometerReading: number | null;
    mechanicNotes: string;
    paymentMethod: string;
    transferBankId: string | null;
  }) => Promise<void>;
}

// ── Component ───────────────────────────────────────────────────

export function DrawerNestedForms({
  wo,
  showReadyForm,
  grandTotal,
  paymentMethodFees,
  transferBanks,
  onReadyFormClose,
  onReadyForPickupSubmit,
}: DrawerNestedFormsProps) {
  if (!wo) return null;

  const vehicle = wo.vehicle;
  const vehiclePlate =
    vehicle && "plate_number" in vehicle
      ? ((vehicle as { plate_number?: string }).plate_number ?? "")
      : "";
  const currentOdometer =
    vehicle && "odometer" in vehicle
      ? ((vehicle as { odometer?: number | null }).odometer ?? null)
      : null;

  return (
    <>
      {/* Ready for Pickup form drawer */}
      <DetailDrawer
        open={showReadyForm}
        onOpenChange={(next) => {
          if (!next) onReadyFormClose();
        }}
        size="lg"
        backdropForceRender
      >
        <ReadyForPickupForm
          vehiclePlate={vehiclePlate}
          currentOdometer={currentOdometer}
          grandTotal={grandTotal}
          paymentMethodFees={paymentMethodFees}
          transferBanks={transferBanks}
          onConfirm={onReadyForPickupSubmit}
          onBack={onReadyFormClose}
        />
      </DetailDrawer>
    </>
  );
}
