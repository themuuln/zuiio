"use client";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { PaymentMethodFees } from "./_payment-fees";
import { ReadyForPickupForm } from "./_ready-for-pickup-form";
import type { PickupCompleteData } from "./pickup-complete-form";
import { PickupCompleteForm } from "./pickup-complete-form";

// ── Props ───────────────────────────────────────────────────────

export interface DrawerNestedFormsProps {
  wo: WorkOrderDetail | null;
  showReadyForm: boolean;
  showCompleteForm: boolean;
  grandTotal: number;
  paymentMethodFees: PaymentMethodFees;
  transferBanks: ResolvedTransferBank[];
  onReadyFormClose: () => void;
  onCompleteFormClose: () => void;
  onReadyForPickupSubmit: (data: {
    odometerReading: number | null;
    mechanicNotes: string;
    paymentMethod: string;
    transferBankId: string | null;
  }) => Promise<void>;
  onCompleteSubmit: (data: PickupCompleteData) => Promise<void>;
}

// ── Component ───────────────────────────────────────────────────

export function DrawerNestedForms({
  wo,
  showReadyForm,
  showCompleteForm,
  grandTotal,
  paymentMethodFees,
  transferBanks,
  onReadyFormClose,
  onCompleteFormClose,
  onReadyForPickupSubmit,
  onCompleteSubmit,
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
      <Drawer
        open={showReadyForm}
        onOpenChange={(next) => {
          if (!next) onReadyFormClose();
        }}
        swipeDirection="right"
      >
        <DrawerContent
          showCloseButton={false}
          className="sm:max-w-md"
          contentClassName="flex flex-col gap-0 border-border/80 shadow-2xl"
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
        </DrawerContent>
      </Drawer>

      {/* Complete form drawer */}
      <Drawer
        open={showCompleteForm}
        onOpenChange={(next) => {
          if (!next) onCompleteFormClose();
        }}
        swipeDirection="right"
      >
        <DrawerContent
          showCloseButton={false}
          className="sm:max-w-md"
          contentClassName="flex flex-col gap-0 border-border/80 shadow-2xl"
        >
          <PickupCompleteForm
            vehiclePlate={vehiclePlate}
            onConfirm={onCompleteSubmit}
            onBack={onCompleteFormClose}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
