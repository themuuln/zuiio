"use client";

import { Car, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import { useCreatePartsCar } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { Typography } from "@/components/ui/typography";

interface NewPartsCarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPartsCarSheet({
  open,
  onOpenChange,
}: NewPartsCarSheetProps) {
  const t = useTranslations("inventory");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const create = useCreatePartsCar(orgId);
  const [saving, setSaving] = useState(false);
  const [arrivalDate, setArrivalDate] = useState<Date>(new Date());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setArrivalDate(new Date());
        setFieldErrors({});
      }
      onOpenChange(value);
    },
    [onOpenChange],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;

    const form = new FormData(e.currentTarget);
    const make = (form.get("make") as string)?.trim();
    const model = (form.get("model") as string)?.trim();

    const errors: Record<string, string> = {};
    if (!make) errors.make = t("nameRequired");
    if (!model) errors.model = t("nameRequired");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const car = await create.mutateAsync({
        make,
        model,
        year: form.get("year") ? Number(form.get("year")) : undefined,
        vin: (form.get("vin") as string)?.toUpperCase() || undefined,
        license_plate:
          transliterateMongolianPlate(
            (form.get("license_plate") as string) || "",
          ) || undefined,
        purchase_cost: form.get("purchase_cost")
          ? Number(form.get("purchase_cost"))
          : 0,
        arrival_date: arrivalDate
          ? arrivalDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        notes: (form.get("notes") as string) || undefined,
      });
      toast.success("Машин бүртгэгдлээ");
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Амжилтгүй боллоо");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 gap-0"
      >
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <Car className="size-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">
                Шинэ задаргааны машин
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Хятадаас ирсэн машины мэдээллийг бүртгэх
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {orgQuery.isPending ? (
            <div className="p-4 flex flex-col gap-4">
              {/* Header skeleton */}
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-xl" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>

              {/* Make, Model row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>

              {/* Year, Arrival date row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>

              {/* VIN, Plate row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>

              {/* Purchase cost */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-9 w-full" />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : (
            <form
              id="new-parts-car-sheet-form"
              onSubmit={handleSubmit}
              className="p-4 flex flex-col gap-4"
            >
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="parts-car-make">
                      Үйлдвэрлэгч <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="parts-car-make"
                      name="make"
                      placeholder="Toyota, Honda"
                      aria-invalid={!!fieldErrors.make}
                    />
                    {fieldErrors.make && (
                      <Typography.Text className="text-xs text-destructive mt-1">
                        {fieldErrors.make}
                      </Typography.Text>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="parts-car-model">
                      Модель <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="parts-car-model"
                      name="model"
                      placeholder="Camry, Civic"
                      aria-invalid={!!fieldErrors.model}
                    />
                    {fieldErrors.model && (
                      <Typography.Text className="text-xs text-destructive mt-1">
                        {fieldErrors.model}
                      </Typography.Text>
                    )}
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="parts-car-year">Он</FieldLabel>
                    <Input
                      id="parts-car-year"
                      name="year"
                      type="number"
                      min={1980}
                      max={2030}
                      placeholder="2018"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Ирсэн огноо</FieldLabel>
                    <DatePicker
                      value={arrivalDate}
                      onChange={(date) => date && setArrivalDate(date)}
                      placeholder="Огноо сонгох"
                      fromYear={2020}
                      toYear={2026}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="parts-car-vin">VIN</FieldLabel>
                    <Input
                      id="parts-car-vin"
                      name="vin"
                      placeholder="1HGCM82633A004352"
                      className="font-mono tracking-wider uppercase"
                      onChange={(e) => {
                        e.currentTarget.value =
                          e.currentTarget.value.toUpperCase();
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="parts-car-plate">
                      Хятадын дугаар
                    </FieldLabel>
                    <Input
                      id="parts-car-plate"
                      name="license_plate"
                      placeholder="Хятадын дугаар"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="parts-car-cost">
                    Худалдан авалтын үнэ
                  </FieldLabel>
                  <Input
                    id="parts-car-cost"
                    name="purchase_cost"
                    type="number"
                    min={0}
                    step={10000}
                    placeholder="12,000,000"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="parts-car-notes">Тэмдэглэл</FieldLabel>
                  <Textarea
                    id="parts-car-notes"
                    name="notes"
                    placeholder="Машины тухай нэмэлт мэдээлэл..."
                    rows={3}
                  />
                </Field>
              </FieldGroup>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              form="new-parts-car-sheet-form"
              className="flex-1 gap-2"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Car className="size-4" />
              )}
              {saving ? "Хадгалж байна..." : "Бүртгэх"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
