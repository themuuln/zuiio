"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/breadcrumb";
import { Link } from "@/lib/i18n/navigation";
import {
  WizardProvider,
  useWizardContext,
  CustomerSection,
  VehicleSection,
  ServicesSection,
  PartsSection,
  MechanicSection,
  SummarySection,
} from "@/components/work-orders/wizard";

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
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Breadcrumb
        items={[
          { label: t("title"), href: "/dashboard/work-orders" },
          { label: t("newWorkOrder") },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/dashboard/work-orders" />}
          variant="ghost"
          size="icon"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("newWorkOrder")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("createSubtitle")}
          </p>
        </div>
      </div>

      <CustomerSection />
      <VehicleSection />
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
