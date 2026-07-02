"use client";

import { Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatCurrency } from "@/lib/utils";

function SheetSummarySection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("servicesTotal")}</span>
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
  );
}

function SheetBottomBar({ onClose }: { onClose: () => void }) {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  return (
    <div className="sticky bottom-0 border-t bg-background p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          size="default"
          onClick={onClose}
          className="min-h-[48px] sm:w-1/3"
        >
          {t("cancel")}
        </Button>
        <Button
          size="default"
          onClick={ctx.handleCreate}
          disabled={!ctx.isFormValid}
          className="min-h-[48px] gap-2 flex-1"
        >
          <Wrench className="size-5" />
          {ctx.saving
            ? t("creating")
            : t("createWorkOrder", {
                total: formatCurrency(ctx.grandTotal),
              })}
        </Button>
      </div>
    </div>
  );
}

function NewWorkOrderSheetForm({ onClose: _onClose }: { onClose: () => void }) {
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
      <SheetSummarySection />
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="sm:max-w-xl w-full"
        contentClassName="flex flex-col gap-0 p-0"
        showCloseButton
      >
        <DrawerHeader className="px-4 pt-4">
          <DrawerTitle>{t("newWorkOrder")}</DrawerTitle>
        </DrawerHeader>
        <WizardProvider onCreated={() => onOpenChange(false)}>
          <ScrollArea className="min-h-0 flex-1">
            <NewWorkOrderSheetForm onClose={() => onOpenChange(false)} />
          </ScrollArea>
          <SheetBottomBar onClose={() => onOpenChange(false)} />
        </WizardProvider>
      </DrawerContent>
    </Drawer>
  );
}
