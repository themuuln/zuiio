"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { PlateInput } from "@/components/ui/plate-input";
import { ColorSelect } from "@/components/vehicles/color-select";
import { inputProps } from "@/lib/form-ux";
import {
  type CarBrand,
  type CarModel,
  carCatalogKeys,
} from "@/lib/queries/use-car-catalog";
import type { VehicleFormApi, VehicleFormT } from "./_types";

// ── Component ────────────────────────────────────────────────

type VehicleInfoSectionProps = {
  form: VehicleFormApi;
  t: VehicleFormT;
  /** Filtered (niche-aware) brand list for the make combobox. */
  brands: CarBrand[];
  /** Catalog models for the selected brand (used to auto-fill related fields). */
  models: CarModel[];
  /** Brand+model display lists (already merged with pinned SmartCar entries). */
  displayModels: CarModel[];
  selectedBrand: CarBrand | null;
  newBrandName: string;
  setNewBrandName: Dispatch<SetStateAction<string>>;
  newModelName: string;
  setNewModelName: Dispatch<SetStateAction<string>>;
  plateRef: RefObject<HTMLInputElement | null>;
  looking: boolean;
  plateAutoFocus: boolean;
  handlePlateLookup: () => void;
  /** Extra grid items rendered after the base fields (full-details, notes). */
  children?: ReactNode;
};

export function VehicleInfoSection({
  form,
  t,
  brands,
  models,
  displayModels,
  selectedBrand,
  newBrandName,
  setNewBrandName,
  newModelName,
  setNewModelName,
  plateRef,
  looking,
  plateAutoFocus,
  handlePlateLookup,
  children,
}: VehicleInfoSectionProps) {
  const queryClient = useQueryClient();

  // ── Quick-create + model-select handlers (driven by the comboboxes) ──

  const handleCreateBrand = async () => {
    const name = newBrandName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/car-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      const newBrand = json.data;
      await queryClient.invalidateQueries({
        queryKey: carCatalogKeys.brands(),
      });
      form.setValue("make", newBrand.name);
      form.setValue("model", "");
      setNewBrandName("");
      toast.dismiss();
      toast.success(t("brandCreated", { name }));
    } catch {
      toast.error(t("failedToCreateBrand"));
    }
  };

  const handleCreateModel = async () => {
    const name = newModelName.trim();
    if (!name || !selectedBrand) return;
    try {
      const res = await fetch(`/api/car-brands/${selectedBrand.id}/models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      const newModel = json.data;
      await queryClient.invalidateQueries({
        queryKey: carCatalogKeys.models(selectedBrand.id),
      });
      form.setValue("model", newModel.name);
      setNewModelName("");
      toast.dismiss();
      toast.success(t("modelCreated", { name }));
    } catch {
      toast.error(t("failedToCreateModel"));
    }
  };

  const handleModelSelect = (modelName: string) => {
    form.setValue("model", modelName);
    const matched = models.find(
      (m) => m.name.toLowerCase() === modelName.toLowerCase(),
    );
    if (matched) {
      if (matched.body_type && !form.getValues("bodyType"))
        form.setValue(
          "bodyType",
          matched.body_type
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase()),
        );
      if (matched.fuel_type && !form.getValues("fuelType"))
        form.setValue(
          "fuelType",
          matched.fuel_type
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase()),
        );
      if (matched.transmission && !form.getValues("transmission"))
        form.setValue(
          "transmission",
          matched.transmission
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase()),
        );
      if (matched.drivetrain && !form.getValues("drivetrain"))
        form.setValue(
          "drivetrain",
          matched.drivetrain.split(",")[0].toUpperCase(),
        );
      if (matched.engine_options && !form.getValues("engine"))
        form.setValue("engine", matched.engine_options.split(",")[0].trim());
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="py-4">
        <CardTitle className="text-base">{t("vehicleInformation")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {/* Plate Number */}
        <Field data-invalid={!!form.formState.errors.plateNumber}>
          <FieldLabel>
            {t("plate")} <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <div className="relative flex gap-2">
              <PlateInput
                ref={plateRef}
                value={form.watch("plateNumber")}
                onChange={(v) => form.setValue("plateNumber", v)}
                className="h-11 flex-1"
                placeholder={t("platePlaceholder")}
                lang="mn"
                autoFocus={plateAutoFocus}
                aria-invalid={!!form.formState.errors.plateNumber}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const plate = form.getValues("plateNumber").trim();
                    if (plate.length >= 7 && !looking) {
                      e.preventDefault();
                      handlePlateLookup();
                    }
                  }
                }}
                {...inputProps("plate")}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 shrink-0 w-11"
                onClick={handlePlateLookup}
                disabled={looking || !form.watch("plateNumber")?.trim()}
              >
                {looking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
              </Button>
            </div>
            {form.formState.errors.plateNumber && (
              <FieldError>
                {form.formState.errors.plateNumber.message}
              </FieldError>
            )}
          </FieldContent>
        </Field>

        {/* Make */}
        <Field data-invalid={!!form.formState.errors.make}>
          <FieldLabel>
            {t("make")} <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Combobox
              items={brands}
              value={selectedBrand ?? null}
              onValueChange={(brand) => {
                form.setValue("make", brand?.name ?? "");
                form.setValue("model", "");
              }}
              onInputValueChange={(inputValue) => setNewBrandName(inputValue)}
              isItemEqualToValue={(a, b) => a.id === b.id}
              itemToStringLabel={(brand) => brand.name}
            >
              <ComboboxInput
                placeholder={t("searchPlaceholder")}
                className="h-11"
              />
              <ComboboxContent>
                <ComboboxList>
                  {(brand: (typeof brands)[number]) => (
                    <ComboboxItem key={brand.id} value={brand}>
                      {brand.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2 py-2 text-xs hover:bg-accent cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCreateBrand();
                    }}
                  >
                    <Plus className="size-4" />
                    Add &quot;{newBrandName}&quot;
                  </button>
                </ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
            {form.formState.errors.make && (
              <FieldError>{form.formState.errors.make.message}</FieldError>
            )}
          </FieldContent>
        </Field>

        {/* Model */}
        <Field data-invalid={!!form.formState.errors.model}>
          <FieldLabel>
            {t("model")} <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Combobox
              items={displayModels}
              value={
                displayModels.find((m) => m.name === form.watch("model")) ??
                null
              }
              onValueChange={(model) => {
                if (model) handleModelSelect(model.name);
              }}
              onInputValueChange={(inputValue) => setNewModelName(inputValue)}
              disabled={!selectedBrand}
              isItemEqualToValue={(a, b) => a.id === b.id}
              itemToStringLabel={(model) => model.name}
            >
              <ComboboxInput
                placeholder={
                  selectedBrand ? t("searchPlaceholder") : t("selectBrandFirst")
                }
                className="h-11"
              />
              <ComboboxContent>
                <ComboboxList>
                  {(model: (typeof displayModels)[number]) => (
                    <ComboboxItem key={model.id} value={model}>
                      <span>
                        {model.name}
                        {model.year_start
                          ? ` (${model.year_start}${model.year_end ? `-${model.year_end}` : "+"})`
                          : ""}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2 py-2 text-xs hover:bg-accent cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCreateModel();
                    }}
                  >
                    <Plus className="size-4" />
                    Add &quot;{newModelName}&quot;
                  </button>
                </ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
            {form.formState.errors.model && (
              <FieldError>{form.formState.errors.model.message}</FieldError>
            )}
          </FieldContent>
        </Field>

        {/* Year */}
        <Field data-invalid={!!form.formState.errors.year}>
          <FieldLabel>{t("year")}</FieldLabel>
          <FieldContent>
            <NumericInput
              value={Number(form.watch("year")) || 0}
              onChange={(v) =>
                form.setValue("year", v ? String(v) : "", {
                  shouldValidate: true,
                })
              }
              placeholder="2020"
            />
            {form.formState.errors.year && (
              <FieldError>{form.formState.errors.year.message}</FieldError>
            )}
          </FieldContent>
        </Field>

        {/* Odometer */}
        <Field data-invalid={!!form.formState.errors.odometer}>
          <FieldLabel>{t("odometer")} (km)</FieldLabel>
          <FieldContent>
            <NumericInput
              value={Number(form.watch("odometer")) || 0}
              onChange={(v) =>
                form.setValue("odometer", v ? String(v) : "", {
                  shouldValidate: true,
                })
              }
              placeholder="120000"
            />
            {form.formState.errors.odometer && (
              <FieldError>{form.formState.errors.odometer.message}</FieldError>
            )}
          </FieldContent>
        </Field>

        {/* Color */}
        <Field>
          <FieldLabel>{t("color")}</FieldLabel>
          <FieldContent>
            <ColorSelect
              value={form.watch("color") || ""}
              onChange={(color) => form.setValue("color", color)}
              className="w-full"
            />
          </FieldContent>
        </Field>

        {/* Engine */}
        <Field>
          <FieldLabel>{t("engine")}</FieldLabel>
          <FieldContent>
            <Input
              value={form.watch("engine") || ""}
              onChange={(e) => form.setValue("engine", e.target.value)}
              placeholder={t("enginePlaceholder")}
              {...inputProps("engine")}
            />
          </FieldContent>
        </Field>

        {children}
      </CardContent>
    </Card>
  );
}
