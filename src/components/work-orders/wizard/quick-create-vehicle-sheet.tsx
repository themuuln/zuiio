"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import { formatPlateInput } from "@/lib/form-ux";
import { useMakes, useModelsByMake } from "@/lib/queries/use-vehicle-models";
import { useWizardContext } from "./wizard-context";
import { Typography } from "@/components/ui/typography";

// Static fallback for any makes not yet in the DB catalog
const FALLBACK_MAKES = [
  "Acura",
  "Alfa Romeo",
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "Brilliance",
  "Bugatti",
  "Buick",
  "BYD",
  "Cadillac",
  "Changan",
  "Chery",
  "Chevrolet",
  "Chrysler",
  "Citroën",
  "Dacia",
  "Daewoo",
  "Daihatsu",
  "Dodge",
  "Dongfeng",
  "FAW",
  "Ferrari",
  "Fiat",
  "Ford",
  "Geely",
  "Genesis",
  "GMC",
  "Great Wall",
  "Haval",
  "Honda",
  "Hummer",
  "Hyundai",
  "Infiniti",
  "Isuzu",
  "JAC",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Land Rover",
  "Lexus",
  "Lifan",
  "Lincoln",
  "Maserati",
  "Mazda",
  "McLaren",
  "Mercedes-Benz",
  "MG",
  "MINI",
  "Mitsubishi",
  "Nissan",
  "Opel",
  "Peugeot",
  "Porsche",
  "Ram",
  "Renault",
  "Rolls-Royce",
  "Rover",
  "Saab",
  "Seat",
  "Skoda",
  "SsangYong",
  "Subaru",
  "Suzuki",
  "Tata",
  "Tesla",
  "Toyota",
  "UAZ",
  "Volkswagen",
  "Volvo",
  "Voyah",
  "Wuling",
  "ZX Auto",
];

export function QuickCreateVehicleSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");
  const [plateError, setPlateError] = useState<string | null>(null);
  const [touchedPlate, setTouchedPlate] = useState(false);

  const yearRef = useRef<HTMLInputElement>(null);

  const { data: dbMakes = [] } = useMakes(ctx.orgId ?? undefined);
  const { data: dbModels = [] } = useModelsByMake(
    ctx.orgId ?? undefined,
    ctx.quickMake,
  );

  // Merge DB makes + fallback, deduplicated and sorted
  const allMakes = useMemo(() => {
    const merged = new Set([...dbMakes, ...FALLBACK_MAKES]);
    return [...merged].sort((a, b) => a.localeCompare(b));
  }, [dbMakes]);

  // Model options: DB models filtered by make + whatever the user typed
  const modelOptions = useMemo(() => {
    const set = new Set(dbModels);
    if (ctx.quickModel.trim() && !set.has(ctx.quickModel.trim())) {
      return [ctx.quickModel.trim(), ...set];
    }
    return [...set];
  }, [dbModels, ctx.quickModel]);

  const canSubmit =
    !ctx.creatingVehicle &&
    ctx.quickPlate.trim() &&
    ctx.quickMake.trim() &&
    ctx.quickModel.trim();

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    if (!isValidMongolianPlate(ctx.quickPlate)) {
      setPlateError("Must be 4 digits + 3 letters (e.g. 4444УНА)");
      setTouchedPlate(true);
      return;
    }
    ctx.handleQuickCreateVehicle();
  }, [canSubmit, ctx.quickPlate, ctx.handleQuickCreateVehicle]);

  const validatePlate = useCallback((plate: string) => {
    setTouchedPlate(true);
    if (plate.trim() && !isValidMongolianPlate(plate)) {
      setPlateError("Must be 4 digits + 3 letters (e.g. 4444УНА)");
    } else {
      setPlateError(null);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="rounded-lg border p-4 bg-muted/20">
      <Typography.Text className="text-sm font-medium">
        {t("newVehicle")}
      </Typography.Text>

      <form
        className="mt-3 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            {t("plateRequired")} <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="4444УНА"
            value={ctx.quickPlate}
            onChange={(e) => {
              ctx.setQuickPlate(
                formatPlateInput(transliterateMongolianPlate(e.target.value)),
              );
              if (plateError) setPlateError(null);
              setTouchedPlate(false);
            }}
            onBlur={() => validatePlate(ctx.quickPlate)}
            className={`h-11 uppercase ${plateError ? "border-destructive" : ""}`}
            inputMode="text"
            autoComplete="off"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!isValidMongolianPlate(ctx.quickPlate)) {
                  validatePlate(ctx.quickPlate);
                }
              }
            }}
          />
          {plateError ? (
            <Typography.Text className="mt-1 text-xs text-destructive">
              {plateError}
            </Typography.Text>
          ) : touchedPlate && !plateError ? (
            <Typography.Text className="mt-1 text-xs text-green-600">
              Valid plate format
            </Typography.Text>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("make")} <span className="text-destructive">*</span>
            </label>
            <Combobox
              items={allMakes}
              value={ctx.quickMake}
              onValueChange={(make) => {
                ctx.setQuickMake(make ?? "");
                // Clear model when make changes to a different value
                if (make && make !== ctx.quickMake) {
                  ctx.setQuickModel("");
                }
              }}
            >
              <ComboboxInput
                placeholder="Search make…"
                showTrigger
                showClear={!!ctx.quickMake}
                className="h-11 text-sm"
                value={ctx.quickMake}
              />
              <ComboboxContent>
                <ComboboxList>
                  {(make: string) => (
                    <ComboboxItem key={make} value={make}>
                      {make}
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty>No makes found</ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("model")} <span className="text-destructive">*</span>
            </label>
            <Combobox
              items={modelOptions}
              value={ctx.quickModel}
              onValueChange={(model) => ctx.setQuickModel(model ?? "")}
            >
              <ComboboxInput
                placeholder={
                  ctx.quickMake.trim() ? "Search model…" : "Select make first"
                }
                showTrigger
                showClear={!!ctx.quickModel}
                className="h-11 text-sm"
                disabled={!ctx.quickMake.trim()}
                value={ctx.quickModel}
              />
              <ComboboxContent>
                <ComboboxList>
                  {(model: string) => (
                    <ComboboxItem key={model} value={model}>
                      {model}
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty>No models found</ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("year")}
            </label>
            <Input
              ref={yearRef}
              placeholder="20__"
              type="number"
              value={ctx.quickYear}
              onChange={(e) => ctx.setQuickYear(e.target.value)}
              className="h-11"
              inputMode="numeric"
              autoComplete="off"
              min={1900}
              max={2030}
            />
          </div>
        </div>

        {ctx.vehicleCreateError && (
          <Typography.Text className="text-sm text-destructive">
            {ctx.vehicleCreateError}
          </Typography.Text>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              onOpenChange(false);
              ctx.resetQuickVehicleForm();
            }}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {ctx.creatingVehicle ? t("creating") : t("createVehicle")}
          </Button>
        </div>
      </form>
    </div>
  );
}
