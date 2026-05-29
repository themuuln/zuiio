"use client";

import { Car, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { inputProps } from "@/lib/form-ux";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useCreatePartsCar } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";

// ── Schema ───────────────────────────────────────────────────

const partsCarSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().optional(),
  vin: z.string().optional(),
  license_plate: z.string().optional(),
  purchase_cost: z.string().optional(),
  notes: z.string().optional(),
});

type PartsCarFormValues = z.infer<typeof partsCarSchema>;

// ── Component ────────────────────────────────────────────────

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

  const form = useForm<PartsCarFormValues>({
    resolver: zodResolver(partsCarSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      vin: "",
      license_plate: "",
      purchase_cost: "",
      notes: "",
    },
  });

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        form.reset();
        setArrivalDate(new Date());
      }
      onOpenChange(value);
    },
    [onOpenChange, form],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    if (!orgId) return;

    setSaving(true);
    try {
      await create.mutateAsync({
        make: data.make.trim(),
        model: data.model.trim(),
        year: data.year ? Number(data.year) : undefined,
        vin: data.vin?.toUpperCase() || undefined,
        license_plate:
          transliterateMongolianPlate(data.license_plate || "") || undefined,
        purchase_cost: data.purchase_cost ? Number(data.purchase_cost) : 0,
        arrival_date: arrivalDate
          ? arrivalDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        notes: data.notes || undefined,
      });
      toast.success("Машин бүртгэгдлээ");
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Амжилтгүй боллоо");
    } finally {
      setSaving(false);
    }
  });

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
              onSubmit={onSubmit}
              className="p-4 flex flex-col gap-4"
            >
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  {/* Make — required */}
                  <Field data-invalid={!!form.formState.errors.make}>
                    <FieldLabel>
                      Үйлдвэрлэгч <span className="text-destructive">*</span>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="parts-car-make"
                        placeholder="Toyota, Honda"
                        aria-invalid={!!form.formState.errors.make}
                        {...inputProps("make")}
                        {...form.register("make")}
                      />
                      {form.formState.errors.make && (
                        <FieldError>
                          {form.formState.errors.make.message}
                        </FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  {/* Model — required */}
                  <Field data-invalid={!!form.formState.errors.model}>
                    <FieldLabel>
                      Модель <span className="text-destructive">*</span>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="parts-car-model"
                        placeholder="Camry, Civic"
                        aria-invalid={!!form.formState.errors.model}
                        {...inputProps("model")}
                        {...form.register("model")}
                      />
                      {form.formState.errors.model && (
                        <FieldError>
                          {form.formState.errors.model.message}
                        </FieldError>
                      )}
                    </FieldContent>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Year — optional */}
                  <Field>
                    <FieldLabel>Он</FieldLabel>
                    <FieldContent>
                      <Input
                        id="parts-car-year"
                        type="number"
                        min={1980}
                        max={2030}
                        placeholder="2018"
                        {...inputProps("year")}
                        {...form.register("year")}
                      />
                    </FieldContent>
                  </Field>

                  {/* Arrival Date */}
                  <Field>
                    <FieldLabel>Ирсэн огноо</FieldLabel>
                    <FieldContent>
                      <DatePicker
                        value={arrivalDate}
                        onChange={(date) => date && setArrivalDate(date)}
                        placeholder="Огноо сонгох"
                        fromYear={2020}
                        toYear={2026}
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* VIN — optional */}
                  <Field>
                    <FieldLabel>VIN</FieldLabel>
                    <FieldContent>
                      <Input
                        id="parts-car-vin"
                        placeholder="1HGCM82633A004352"
                        className="font-mono tracking-wider uppercase"
                        {...inputProps("vin")}
                        {...form.register("vin")}
                      />
                    </FieldContent>
                  </Field>

                  {/* License Plate — optional */}
                  <Field>
                    <FieldLabel>Хятадын дугаар</FieldLabel>
                    <FieldContent>
                      <Input
                        id="parts-car-plate"
                        placeholder="Хятадын дугаар"
                        {...inputProps("plate")}
                        {...form.register("license_plate")}
                      />
                    </FieldContent>
                  </Field>
                </div>

                {/* Purchase Cost — optional */}
                <Field>
                  <FieldLabel>Худалдан авалтын үнэ</FieldLabel>
                  <FieldContent>
                    <Input
                      id="parts-car-cost"
                      type="number"
                      min={0}
                      step={10000}
                      placeholder="12,000,000"
                      {...form.register("purchase_cost")}
                    />
                  </FieldContent>
                </Field>

                {/* Notes — optional */}
                <Field>
                  <FieldLabel>Тэмдэглэл</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="parts-car-notes"
                      placeholder="Машины тухай нэмэлт мэдээлэл..."
                      rows={3}
                      {...form.register("notes")}
                    />
                  </FieldContent>
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
