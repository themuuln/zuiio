"use client";

import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/lib/i18n/navigation";
import { useWizardContext } from "./wizard-context";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";

export function SummarySection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  return (
    <>
      {/* Totals */}
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
            <hr className="border-border" />
            <div className="flex justify-between text-xl font-bold">
              <span>{t("grandTotal")}</span>
              <span className="tabular-nums">{formatCurrency(ctx.grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/dashboard/work-orders" />}
              className="min-h-[48px]"
            >
              {t("cancel")}
            </Button>
            <Button
              size="lg"
              onClick={ctx.handleCreate}
              disabled={!ctx.isFormValid}
              className="min-h-[48px] gap-2"
            >
              <Wrench className="size-5" />
              {ctx.saving
                ? t("creating")
                : t("createWorkOrder", { total: formatCurrency(ctx.grandTotal) })}
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
