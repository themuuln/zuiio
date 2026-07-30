import crypto from "crypto";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";

interface PublicVehicle {
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
}

interface PublicInspectionItem {
  id: string;
  category: string;
  item_name: string;
  condition: string | null;
  severity: string | null;
  estimated_cost: number | null;
  customer_approved: boolean | null;
  technician_notes: string | null;
  has_photo: boolean;
  photo_urls: string[];
}

interface PublicInspection {
  id: string;
  status: string;
  odometer: number | null;
  fuel_level: string | null;
  technician_notes: string | null;
  vehicle: PublicVehicle | null;
  items: PublicInspectionItem[];
}

/**
 * Public GET endpoint — customer views DVI inspection details via token.
 * No auth required — the token serves as the access credential.
 *
 * Returns vehicle info, inspection items, and estimated total cost.
 */
export const GET = createSimpleRouteHandler(
  async ({ request, supabase }) => {
    const token = request.nextUrl.pathname.split("/").pop() ?? "";

    if (!token) {
      return apiError("MISSING_TOKEN", "Inspection token is required", 400);
    }

    const hash = crypto.createHash("sha256").update(token).digest("hex");

    // Fetch inspection with vehicle details and items
    // supabase client is untyped here, so arbitrary table access is accepted
    const { data: raw, error: inspError } = await supabase
      .from("digital_vehicle_inspections")
      .select(
        `
        id,
        status,
        odometer,
        fuel_level,
        technician_notes,
        vehicle:vehicle_id (
          plate_number,
          make,
          model,
          year
        ),
        items:dvi_inspection_items (
          id,
          category,
          item_name,
          condition,
          severity,
          estimated_cost,
          customer_approved,
          technician_notes,
          has_photo,
          photo_urls
        )
        `,
      )
      .eq("customer_token_hash", hash)
      .single();

    if (inspError || !raw) {
      return apiError("NOT_FOUND", "Inspection not found or has expired", 404);
    }

    // Narrow the raw response to our typed interface
    if (
      typeof raw !== "object" ||
      raw === null ||
      !("id" in raw) ||
      !("items" in raw)
    ) {
      return apiError("INVALID_DATA", "Unexpected inspection data format", 500);
    }

    const items = Array.isArray(raw.items)
      ? (raw.items as PublicInspectionItem[])
      : [];

    const totalEstimatedCost = items.reduce(
      (sum, item) => sum + (item.estimated_cost ?? 0),
      0,
    );

    let vehicle: PublicVehicle | null = null;
    if (
      raw.vehicle &&
      typeof raw.vehicle === "object" &&
      "plate_number" in raw.vehicle &&
      typeof raw.vehicle.plate_number === "string"
    ) {
      vehicle = raw.vehicle as unknown as PublicVehicle;
    }

    return ok({
      vehicle,
      items,
      total_estimated_cost: totalEstimatedCost,
    });
  },
  { requireAuth: false },
);
