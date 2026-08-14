"use client";

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inputProps } from "@/lib/form-ux";
import type { VehicleFormApi, VehicleFormT } from "./_types";

// ── Component ────────────────────────────────────────────────

type FullDetailsSectionProps = {
  form: VehicleFormApi;
  t: VehicleFormT;
  currentMode: "quick" | "full";
};

/** Full-mode-only fields (VIN, chassis, trim, selects, dates, dimensions). */
export function FullDetailsSection({
  form,
  t,
  currentMode,
}: FullDetailsSectionProps) {
  if (currentMode !== "full") return null;

  return (
    <>
      <Field data-invalid={!!form.formState.errors.vin}>
        <FieldLabel>{t("vin")}</FieldLabel>
        <FieldContent>
          <Input
            value={form.watch("vin") || ""}
            onChange={(e) => form.setValue("vin", e.target.value)}
            className="font-mono"
            placeholder={t("vinPlaceholder")}
            aria-invalid={!!form.formState.errors.vin}
            {...inputProps("vin")}
          />
          {form.formState.errors.vin && (
            <FieldError>{form.formState.errors.vin.message}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("chassisNumber")}</FieldLabel>
        <FieldContent>
          <Input
            value={form.watch("chassisNumber") || ""}
            onChange={(e) => form.setValue("chassisNumber", e.target.value)}
            className="font-mono"
            placeholder={t("chassisPlaceholder")}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("trim")}</FieldLabel>
        <FieldContent>
          <Input
            value={form.watch("trim") || ""}
            onChange={(e) => form.setValue("trim", e.target.value)}
            placeholder={t("trimPlaceholder")}
            {...inputProps("trim")}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("fuelType")}</FieldLabel>
        <FieldContent>
          <Select
            value={form.watch("fuelType") || ""}
            onValueChange={(val) => form.setValue("fuelType", val ?? undefined)}
          >
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder={t("selectFuelType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gasoline">Gasoline</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
              <SelectItem value="Electric">Electric</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="LPG">LPG</SelectItem>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("transmission")}</FieldLabel>
        <FieldContent>
          <Select
            value={form.watch("transmission") || ""}
            onValueChange={(val) =>
              form.setValue("transmission", val ?? undefined)
            }
          >
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder={t("selectTransmission")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Automatic">Automatic</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="CVT">CVT</SelectItem>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("drivetrain")}</FieldLabel>
        <FieldContent>
          <Select
            value={form.watch("drivetrain") || ""}
            onValueChange={(val) =>
              form.setValue("drivetrain", val ?? undefined)
            }
          >
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder={t("selectDrivetrain")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FWD">FWD (Front Wheel Drive)</SelectItem>
              <SelectItem value="RWD">RWD (Rear Wheel Drive)</SelectItem>
              <SelectItem value="AWD">AWD (All Wheel Drive)</SelectItem>
              <SelectItem value="4WD">4WD (Four Wheel Drive)</SelectItem>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("bodyType")}</FieldLabel>
        <FieldContent>
          <Select
            value={form.watch("bodyType") || ""}
            onValueChange={(val) => form.setValue("bodyType", val ?? undefined)}
          >
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder={t("selectBodyType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sedan">Sedan</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
              <SelectItem value="Crossover">Crossover</SelectItem>
              <SelectItem value="Hatchback">Hatchback</SelectItem>
              <SelectItem value="Wagon">Wagon</SelectItem>
              <SelectItem value="Coupe">Coupe</SelectItem>
              <SelectItem value="Convertible">Convertible</SelectItem>
              <SelectItem value="Pickup">Pickup</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      <Field data-invalid={!!form.formState.errors.seats}>
        <FieldLabel>{t("seats")}</FieldLabel>
        <FieldContent>
          <NumericInput
            value={Number(form.watch("seats")) || 0}
            onChange={(v) =>
              form.setValue("seats", v ? String(v) : "", {
                shouldValidate: true,
              })
            }
            placeholder="5"
          />
          {form.formState.errors.seats && (
            <FieldError>{form.formState.errors.seats.message}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("licenseExpiry")}</FieldLabel>
        <FieldContent>
          <Input
            type="date"
            value={form.watch("licenseExpiryAt") || ""}
            onChange={(e) => form.setValue("licenseExpiryAt", e.target.value)}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("nextService")}</FieldLabel>
        <FieldContent>
          <Input
            type="date"
            value={form.watch("nextServiceAt") || ""}
            onChange={(e) => form.setValue("nextServiceAt", e.target.value)}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("importDate")}</FieldLabel>
        <FieldContent>
          <Input
            type="date"
            value={form.watch("importDate") || ""}
            onChange={(e) => form.setValue("importDate", e.target.value)}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("countryOfOrigin")}</FieldLabel>
        <FieldContent>
          <Input
            value={form.watch("countryOfOrigin") || ""}
            onChange={(e) => form.setValue("countryOfOrigin", e.target.value)}
            placeholder={t("countryPlaceholder")}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("category")}</FieldLabel>
        <FieldContent>
          <Input
            value={form.watch("category") || ""}
            onChange={(e) => form.setValue("category", e.target.value)}
            placeholder={t("categoryPlaceholder")}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("steering")}</FieldLabel>
        <FieldContent>
          <Input
            value={form.watch("steering") || ""}
            onChange={(e) => form.setValue("steering", e.target.value)}
            placeholder={t("steeringPlaceholder")}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("height")}</FieldLabel>
        <FieldContent>
          <NumericInput
            value={Number(form.watch("height")) || 0}
            onChange={(v) =>
              form.setValue("height", v ? String(v) : "", {
                shouldValidate: true,
              })
            }
            placeholder={t("heightPlaceholder")}
            step={0.1}
          />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>{t("width")}</FieldLabel>
        <FieldContent>
          <NumericInput
            value={Number(form.watch("width")) || 0}
            onChange={(v) =>
              form.setValue("width", v ? String(v) : "", {
                shouldValidate: true,
              })
            }
            placeholder={t("widthPlaceholder")}
            step={0.1}
          />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>{t("length")}</FieldLabel>
        <FieldContent>
          <NumericInput
            value={Number(form.watch("length")) || 0}
            onChange={(v) =>
              form.setValue("length", v ? String(v) : "", {
                shouldValidate: true,
              })
            }
            placeholder={t("lengthPlaceholder")}
            step={0.1}
          />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>{t("weight")}</FieldLabel>
        <FieldContent>
          <NumericInput
            value={Number(form.watch("weight")) || 0}
            onChange={(v) =>
              form.setValue("weight", v ? String(v) : "", {
                shouldValidate: true,
              })
            }
            placeholder={t("weightPlaceholder")}
            step={0.1}
          />
        </FieldContent>
      </Field>
    </>
  );
}
