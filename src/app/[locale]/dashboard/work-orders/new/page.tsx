"use client";

import { ArrowLeft } from "lucide-react";
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
          { label: "Work Orders", href: "/dashboard/work-orders" },
          { label: "New Work Order" },
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
          <h1 className="text-2xl font-bold tracking-tight">New Work Order</h1>
          <p className="text-sm text-muted-foreground">
            Create a work order in one page — all fields visible at a glance
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
