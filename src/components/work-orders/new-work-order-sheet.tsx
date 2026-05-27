"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Wrench } from "lucide-react";
import {
  ComplaintSection,
  CustomerSection,
  MechanicSection,
  PartsSection,
  ServicesSection,
  useWizardContext,
  VehicleSection,
  WizardProvider,
} from "@/components/work-orders/wizard";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

function SheetSummarySection({ onClose }: { onClose: () => void }) {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  return (
    <>
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("servicesTotal")}
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(ctx.servicesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("partsTotal")}</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(ctx.partsTotal)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-semibold">
              <span>{t("grandTotal")}</span>
              <span className="tabular-nums">
                {formatCurrency(ctx.grandTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="default"
              onClick={onClose}
              className="min-h-[48px]"
            >
              {t("cancel")}
            </Button>
            <Button
              size="default"
              onClick={ctx.handleCreate}
              disabled={!ctx.isFormValid}
              className="min-h-[48px] gap-2"
            >
              <Wrench className="size-5" />
              {ctx.saving
                ? t("creating")
                : t("createWorkOrder", {
                    total: formatCurrency(ctx.grandTotal),
                  })}
            </Button>
          </div>
          {(!ctx.selectedCustomer || !ctx.selectedVehicle) && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              {t("createDisabledHint")}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function NewWorkOrderSheetForm({ onClose }: { onClose: () => void }) {
  const { loading } = useWizardContext();

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <CustomerSection />
      <VehicleSection />
      <ComplaintSection />
      <ServicesSection />
      <PartsSection />
      <MechanicSection />
      <SheetSummarySection onClose={onClose} />
    </div>
  );
}

type NewWorkOrderSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewWorkOrderSheet({
  open,
  onOpenChange,
}: NewWorkOrderSheetProps) {
  const t = useTranslations("workOrders");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl"
        showCloseButton
      >
        <SheetHeader>
          <SheetTitle>{t("newWorkOrder")}</SheetTitle>
        </SheetHeader>
        <WizardProvider>
          <ScrollArea className="flex-1">
            <NewWorkOrderSheetForm onClose={() => onOpenChange(false)} />
          </ScrollArea>
        </WizardProvider>
      </SheetContent>
    </Sheet>
  );
}
