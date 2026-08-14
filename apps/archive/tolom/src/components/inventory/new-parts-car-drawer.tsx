"use client";

import { Car, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { inputProps } from "@/lib/form-ux";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useCreatePartsCar } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";

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

export function NewPartsCarDrawer({
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
      toast.dismiss();
      toast.success("Машин бүртгэгдлээ");
      handleOpenChange(false);
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.error(err instanceof Error ? err.message : "Амжилтгүй боллоо");
    } finally {
      setSaving(false);
    }
  });

  return (
    <DetailDrawer open={open} onOpenChange={handleOpenChange}>
      <DetailDrawer.Header>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <Car className="size-5 text-primary" />
          </div>
          <div>
            <DetailDrawer.Title className="text-base">
              Шинэ задаргааны машин
            </DetailDrawer.Title>
            <DetailDrawer.Description className="text-xs text-muted-foreground">
              Хятадаас ирсэн машины мэдээллийг бүртгэх
            </DetailDrawer.Description>
          </div>
        </div>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        {orgQuery.isPending ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
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
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : (
          <form
            id="new-parts-car-drawer-form"
            onSubmit={onSubmit}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
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
                <Field>
                  <FieldLabel>Он</FieldLabel>
                  <FieldContent>
                    <NumericInput
                      id="parts-car-year"
                      min={1980}
                      max={2030}
                      placeholder="2018"
                      value={Number(form.watch("year")) || 0}
                      onChange={(val) => form.setValue("year", String(val))}
                    />
                  </FieldContent>
                </Field>

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

              <Field>
                <FieldLabel>Худалдан авалтын үнэ</FieldLabel>
                <FieldContent>
                  <CurrencyInput
                    id="parts-car-cost"
                    min={0}
                    placeholder="12,000,000"
                    value={Number(form.watch("purchase_cost")) || 0}
                    onChange={(val) =>
                      form.setValue("purchase_cost", String(val))
                    }
                  />
                </FieldContent>
              </Field>

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
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions>
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
            form="new-parts-car-drawer-form"
            className="flex-1 gap-2"
            size="lg"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Car className="size-4" />
            )}
            {saving ? "Хадгалж байна..." : "Бүртгэх"}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
