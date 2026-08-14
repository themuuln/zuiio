import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type { CarBrand } from "@/lib/queries/use-car-catalog";
import {
  MN_COLORS,
  MN_FUEL,
  MN_TRANSMISSION,
  mapMongolianValue,
} from "./_smartcar-mappings";
import type { VehicleFormApi, VehicleFormT } from "./_types";

// ── SmartCar plate lookup ────────────────────────────────────
// Kept verbatim from the original VehicleForm handler; see vehicle-form.tsx.

export async function lookupVehicleByPlate(params: {
  plate: string;
  form: VehicleFormApi;
  allBrands: CarBrand[];
  t: VehicleFormT;
  setLooking: Dispatch<SetStateAction<boolean>>;
  setPinnedBrands: Dispatch<SetStateAction<CarBrand[]>>;
  setPinnedModels: Dispatch<SetStateAction<string[]>>;
}) {
  const {
    plate,
    form,
    allBrands,
    t,
    setLooking,
    setPinnedBrands,
    setPinnedModels,
  } = params;
  if (!plate || plate.length < 7) {
    toast.error(t("enterValidPlateFirst"));
    return;
  }
  setLooking(true);
  try {
    const res = await fetch(
      `/api/smartcar/lookup?plate=${encodeURIComponent(plate)}`,
    );
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? t("lookupFailed"));
      return;
    }
    const d = json.data;

    // Core fields
    if (d.make) {
      form.setValue("make", d.make);
      // Pin the brand so it appears in the combobox even if outside niche
      const matched = allBrands.find(
        (b) => b.name.toLowerCase() === d.make.toLowerCase(),
      );
      if (matched) setPinnedBrands([matched]);
    }
    if (d.model) {
      form.setValue("model", d.model);
      // Pin the model so it appears in the combobox even if not in catalog
      setPinnedModels((prev) =>
        prev.includes(d.model) ? prev : [...prev, d.model],
      );
    }
    if (d.year) form.setValue("year", String(d.year));
    if (d.vin) form.setValue("vin", d.vin);
    if (d.engineCc) form.setValue("engine", String(d.engineCc));

    // Fuel type (map Mongolian → English)
    const fuelEn = d.fuelType ? mapMongolianValue(d.fuelType, MN_FUEL) : null;
    if (fuelEn) form.setValue("fuelType", fuelEn);

    // Transmission (map Mongolian → English)
    const transEn = d.transmission
      ? mapMongolianValue(d.transmission, MN_TRANSMISSION)
      : null;
    if (transEn) form.setValue("transmission", transEn);

    // Body type (map Mongolian → English category)
    if (d.bodyType) {
      const btLower = d.bodyType.toLowerCase();
      if (btLower.includes("туулах чадвар") || btLower.includes("suv")) {
        form.setValue("bodyType", "SUV");
      } else if (btLower.includes("седан")) {
        form.setValue("bodyType", "Sedan");
      } else if (btLower.includes("хетчбек")) {
        form.setValue("bodyType", "Hatchback");
      } else if (btLower.includes("пикап") || btLower.includes("ачилт")) {
        form.setValue("bodyType", "Pickup");
      } else if (btLower.includes("ван")) {
        form.setValue("bodyType", "Van");
      } else if (btLower.includes("купе")) {
        form.setValue("bodyType", "Coupe");
      } else if (btLower.includes("универсал") || btLower.includes("wagon")) {
        form.setValue("bodyType", "Wagon");
      } else if (btLower.includes("кабриолет")) {
        form.setValue("bodyType", "Convertible");
      } else if (
        btLower.includes("кроссовер") ||
        btLower.includes("crossover")
      ) {
        form.setValue("bodyType", "Crossover");
      } else {
        form.setValue("bodyType", d.bodyType);
      }
    }

    // Additional rich fields from the API
    if (d.color) {
      const colorEn = mapMongolianValue(d.color, MN_COLORS);
      if (colorEn) form.setValue("color", colorEn);
    }

    if (d.country) form.setValue("countryOfOrigin", d.country);

    if (d.seats) form.setValue("seats", String(d.seats));

    if (d.category) form.setValue("category", d.category);

    if (d.importDate) {
      // API returns ISO date "2019-07-08T00:00:00" — use the date part only
      const datePart = d.importDate.split("T")[0] ?? d.importDate;
      form.setValue("importDate", datePart);
    }

    // Steering (wheel position)
    if (d.steering) {
      const steeringEn = mapMongolianValue(d.steering, {
        баруун: "Right",
        зүүн: "Left",
        төв: "Center",
      });
      if (steeringEn) form.setValue("steering", steeringEn);
    }

    // Dimensions (mm) — stored as strings, parsed to int in submit
    if (d.height) form.setValue("height", String(d.height));
    if (d.width) form.setValue("width", String(d.width));
    if (d.length) form.setValue("length", String(d.length));

    // Weight (kg)
    if (d.weight) form.setValue("weight", String(d.weight));

    toast.dismiss();
    toast.success(t("lookupComplete"));
  } catch {
    toast.error(t("lookupFailedTryAgain"));
  } finally {
    setLooking(false);
  }
}
