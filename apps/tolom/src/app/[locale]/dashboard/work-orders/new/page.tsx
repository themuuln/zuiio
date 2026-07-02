"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import {
  ComplaintSection,
  CustomerSection,
  MechanicSection,
  PartsSection,
  ServicesSection,
  SummarySection,
  useWizardContext,
  VehicleSection,
  WizardProvider,
} from "@/components/work-orders/wizard";
import { WizardStepIndicator } from "@/components/work-orders/wizard/wizard-step-indicator";
import { Link } from "@/lib/i18n/navigation";

function NewWorkOrderForm() {
  const t = useTranslations("workOrders");
  const { loading } = useWizardContext();

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto tablet-touch">
      <WizardStepIndicator />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/dashboard/work-orders" />}
          variant="ghost"
          size="icon-xs"
          className="min-h-[var(--ui-touch-target)] min-w-[44px]"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("newWorkOrder")}
          </Typography.H1>
          <Typography.Muted className="text-sm text-muted-foreground">
            {t("createSubtitle")}
          </Typography.Muted>
        </div>
      </div>

      <CustomerSection />
      <VehicleSection />
      <ComplaintSection />
      <ServicesSection />
      <PartsSection />
      <MechanicSection />
      <SummarySection />
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <WizardProvider>
      <NewWorkOrderForm />
    </WizardProvider>
  );
}
