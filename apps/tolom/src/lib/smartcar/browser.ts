/**
 * SmartCar.mn vehicle lookup via direct REST API.
 *
 * SmartCar.mn uses a public API endpoint to fetch vehicle data by plate.
 * No Playwright/browser automation needed — just a fetch call.
 *
 * Dependencies: none (uses global fetch)
 */
import { reportServerError } from "@/lib/sentry-report-server";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SmartCarVehicle = {
  plateNumber: string;
  make: string;
  model: string;
  year: number | null;
  vin: string;
  category: string;
  engineCc: number | null;
  transmission: string;
  fuelType: string;
  steering: string;
  seats: number | null;
  bodyType: string;
  country: string;
  color: string;
  height: string;
  width: string;
  length: string;
  weight: string;
  importDate: string;
};

export type SmartCarLookupResult =
  | { ok: true; data: SmartCarVehicle }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Raw API types
// ---------------------------------------------------------------------------

type SmartCarApiResponse = {
  plateNumber: string;
  cabinNumber: string | null;
  countryName: string | null;
  markName: string | null;
  modelName: string | null;
  buildYear: number | null;
  colorName: string | null;
  type: string | null;
  ownerType: string | null;
  className: string | null;
  motorNumber: string | null;
  importDate: string | null;
  fuelType: string | null;
  manCount: number | null;
  axleCount: number | null;
  capacity: number | null;
  mass: number | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  transmission: string | null;
  wheelPosition: string | null;
  rfid: string | null;
};

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapApiToVehicle(api: SmartCarApiResponse): SmartCarVehicle {
  return {
    plateNumber: api.plateNumber,
    make: api.markName ?? "",
    model: api.modelName ?? "",
    year: api.buildYear,
    vin: api.cabinNumber ?? "",
    category: api.type ?? "",
    engineCc: api.capacity ? Math.round(api.capacity) : null,
    transmission: api.transmission ?? "",
    fuelType: api.fuelType ?? "",
    steering: api.wheelPosition ?? "",
    seats: api.manCount,
    bodyType: api.type ?? "",
    country: api.countryName ?? "",
    color: api.colorName ?? "",
    height: api.height?.toString() ?? "",
    width: api.width?.toString() ?? "",
    length: api.length?.toString() ?? "",
    weight: api.mass?.toString() ?? "",
    importDate: api.importDate ?? "",
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const API_URL = "https://xyp-api.smartcar.mn/xyp-api/v1/xyp/get-data-public";
const REQUEST_TIMEOUT_MS = 15_000;

export async function lookupPlate(
  plateNumber: string,
): Promise<SmartCarLookupResult> {
  const normalized = plateNumber.replace(/\s+/g, "").toUpperCase();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        os: "web",
        version: "3.2.0",
        referer: "https://smartcar.mn/",
        "accept-language": "mn",
      },
      body: JSON.stringify({
        serviceCode: "WS100401_getVehicleInfo",
        customFields: {
          plateNumber: normalized,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        ok: false,
        error: `SmartCar API returned ${response.status}: ${text.slice(0, 200)}`,
      };
    }

    const data: SmartCarApiResponse = await response.json();

    // Validate we got something meaningful
    if (!data.markName && !data.modelName) {
      return {
        ok: false,
        error: `No vehicle found for plate "${normalized}"`,
      };
    }

    return { ok: true, data: mapApiToVehicle(data) };
  } catch (err) {
    reportServerError("Unexpected error", err);
    const msg = err instanceof Error ? err.message : String(err);
    // AbortError is the timeout case
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        ok: false,
        error: `SmartCar API timed out after ${REQUEST_TIMEOUT_MS}ms`,
      };
    }
    return { ok: false, error: msg };
  }
}
