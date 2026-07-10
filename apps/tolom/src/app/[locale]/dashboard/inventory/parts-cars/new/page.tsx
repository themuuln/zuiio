"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { reportServerError } from "@/lib/sentry-report-server";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { usePageHeader } from "@/hooks/use-page-header";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useCreatePartsCar } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";

export default function NewPartsCarPage() {
  const partsCarsT = useTranslations("partsCars");
  const { push } = useRouter();
  const { setDetailPartsCarId } = usePageHeader();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const create = useCreatePartsCar(orgId);
  const [year, setYear] = useState(0);
  const [purchaseCost, setPurchaseCost] = useState(0);
  const [saving, setSaving] = useState(false);
  const [arrivalDate, setArrivalDate] = useState<Date>(new Date());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    const form = new FormData(e.currentTarget);
    try {
      const car = await create.mutateAsync({
        make: form.get("make") as string,
        model: form.get("model") as string,
        year: year > 0 ? year : undefined,
        vin: (form.get("vin") as string)?.toUpperCase() || undefined,
        license_plate:
          transliterateMongolianPlate(
            (form.get("license_plate") as string) || "",
          ) || undefined,
        purchase_cost: purchaseCost,
        arrival_date: arrivalDate
          ? arrivalDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        notes: (form.get("notes") as string) || undefined,
      });
      toast.success(partsCarsT("saved"));
      push("/dashboard/inventory/parts-cars");
      setDetailPartsCarId(car.id);
    } catch (err) {
    reportServerError("Unexpected error", err);
      toast.error(
        err instanceof Error ? err.message : partsCarsT("failedToSave"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-xs"
          render={<Link href="/dashboard/inventory/parts-cars" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {partsCarsT("pageTitle")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {partsCarsT("pageSubtitle")}
          </Typography.Muted>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{partsCarsT("carInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="make">
                  {partsCarsT("manufacturer")}{" "}
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="make"
                  name="make"
                  required
                  placeholder="Toyota, Honda"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="model">
                  {partsCarsT("model")}{" "}
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="model"
                  name="model"
                  required
                  placeholder="Camry, Civic"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <NumericInput
                  id="year"
                  value={year}
                  onChange={setYear}
                  min={1980}
                  max={2030}
                  placeholder="2018"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="arrival_date">
                  {partsCarsT("arrivalDate")}
                </FieldLabel>
                <DatePicker
                  value={arrivalDate}
                  onChange={(date) => date && setArrivalDate(date)}
                  placeholder={partsCarsT("datePlaceholder")}
                  fromYear={2020}
                  toYear={2026}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="vin">VIN</FieldLabel>
                <Input
                  id="vin"
                  name="vin"
                  placeholder="1HGCM82633A004352"
                  className="font-mono tracking-wider uppercase"
                  onChange={(e) => {
                    e.currentTarget.value = e.currentTarget.value.toUpperCase();
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="license_plate">
                  {partsCarsT("chinesePlate")}
                </FieldLabel>
                <Input
                  id="license_plate"
                  name="license_plate"
                  placeholder={partsCarsT("chinesePlatePlaceholder")}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="purchase_cost">
                {partsCarsT("purchaseCost")}
              </FieldLabel>
              <CurrencyInput
                id="purchase_cost"
                value={purchaseCost}
                onChange={setPurchaseCost}
                showPrefix={false}
                min={0}
                placeholder="12,000,000"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">{partsCarsT("notes")}</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                placeholder={partsCarsT("notesPlaceholder")}
                rows={3}
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                type="button"
                render={<Link href="/dashboard/inventory/parts-cars" />}
                nativeButton={false}
              >
                {partsCarsT("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {partsCarsT("saving")}
                  </>
                ) : (
                  partsCarsT("pageTitle")
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
