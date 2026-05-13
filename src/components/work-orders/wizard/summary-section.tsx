"use client";

import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/lib/i18n/navigation";
import { useWizardContext } from "./wizard-context";

function formatMNT(amount: number): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SummarySection() {
  const ctx = useWizardContext();

  return (
    <>
      {/* Totals */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Services</span>
              <span className="font-medium tabular-nums">
                {formatMNT(ctx.servicesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parts</span>
              <span className="font-medium tabular-nums">
                {formatMNT(ctx.partsTotal)}
              </span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-xl font-bold">
              <span>Grand Total</span>
              <span className="tabular-nums">{formatMNT(ctx.grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/dashboard/work-orders" />}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={ctx.handleCreate}
              disabled={!ctx.isFormValid}
              className="min-h-[48px] gap-2"
            >
              <Wrench className="size-4" />
              {ctx.saving
                ? "Creating..."
                : `Create Work Order — ${formatMNT(ctx.grandTotal)}`}
            </Button>
          </div>
          {(!ctx.selectedCustomer || !ctx.selectedVehicle) && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Select a customer and vehicle to enable creation
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
