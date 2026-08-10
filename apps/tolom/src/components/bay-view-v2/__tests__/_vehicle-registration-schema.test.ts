import { describe, expect, it } from "vitest";
import {
  EMPTY_LOOKUP,
  formatDate,
  formatTime,
  type LookupResult,
  resolveQueueIds,
  vehicleRegistrationSchema,
} from "../_vehicle-registration-schema";

describe("vehicleRegistrationSchema", () => {
  it("accepts a minimal valid payload with make and model", () => {
    const result = vehicleRegistrationSchema.parse({
      make: "Toyota",
      model: "Prius",
    });
    expect(result).toEqual({ make: "Toyota", model: "Prius" });
  });

  it("accepts all optional fields as empty strings", () => {
    const result = vehicleRegistrationSchema.parse({
      make: "Honda",
      model: "Fit",
      year: "",
      color: "",
      vin: "",
      engine: "",
      odometer: "",
      custFirstName: "",
      custLastName: "",
      custPhone: "",
      complaint: "",
    });
    expect(result).toEqual({
      make: "Honda",
      model: "Fit",
      year: "",
      color: "",
      vin: "",
      engine: "",
      odometer: "",
      custFirstName: "",
      custLastName: "",
      custPhone: "",
      complaint: "",
    });
  });

  it("rejects a missing make", () => {
    const result = vehicleRegistrationSchema.safeParse({ model: "Prius" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["make"]);
    }
  });

  it("rejects a missing model", () => {
    const result = vehicleRegistrationSchema.safeParse({ make: "Toyota" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["model"]);
    }
  });

  it("rejects an empty make", () => {
    const result = vehicleRegistrationSchema.safeParse({
      make: "",
      model: "Prius",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid Mongolian phone number (8 digits)", () => {
    for (const phone of ["99112233", "88112233", "+97699112233", "9999-1234"]) {
      const result = vehicleRegistrationSchema.safeParse({
        make: "Toyota",
        model: "Prius",
        custPhone: phone,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an invalid Mongolian phone number", () => {
    for (const phone of ["12345", "9911223", "abcdefgh", "991122330"]) {
      const result = vehicleRegistrationSchema.safeParse({
        make: "Toyota",
        model: "Prius",
        custPhone: phone,
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects a non-string year", () => {
    const result = vehicleRegistrationSchema.safeParse({
      make: "Toyota",
      model: "Prius",
      year: 2020,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-string odometer", () => {
    const result = vehicleRegistrationSchema.safeParse({
      make: "Toyota",
      model: "Prius",
      odometer: 120000,
    });
    expect(result.success).toBe(false);
  });

  it("accepts numeric-looking strings for year and odometer", () => {
    const result = vehicleRegistrationSchema.parse({
      make: "Toyota",
      model: "Prius",
      year: "2020",
      odometer: "120000",
    });
    expect(result.year).toBe("2020");
    expect(result.odometer).toBe("120000");
  });

  it("strips unknown keys", () => {
    const result = vehicleRegistrationSchema.parse({
      make: "Toyota",
      model: "Prius",
      plateNumber: "4444УНА",
      extra: "dropped",
    });
    expect(result).toEqual({ make: "Toyota", model: "Prius" });
  });
});

describe("resolveQueueIds", () => {
  const lookup: LookupResult = {
    exists: true,
    vehicle: {
      id: "veh-lookup",
      plate_number: "4444УНА",
      make: "T",
      model: "M",
      year: null,
      color: null,
      vin: null,
      engine: null,
      transmission: null,
      fuel_type: null,
      odometer: null,
    },
    customer: {
      id: "cust-lookup",
      first_name: "Bat",
      last_name: null,
      phone: "99112233",
    },
    serviceHistory: [],
  };

  it("prefers saved ids over the lookup result", () => {
    expect(resolveQueueIds("veh-saved", "cust-saved", lookup)).toEqual({
      vehicleId: "veh-saved",
      customerId: "cust-saved",
    });
  });

  it("falls back to lookup ids when no saved ids", () => {
    expect(resolveQueueIds(null, null, lookup)).toEqual({
      vehicleId: "veh-lookup",
      customerId: "cust-lookup",
    });
  });

  it("falls back per-field when only one saved id exists", () => {
    expect(resolveQueueIds("veh-saved", null, lookup)).toEqual({
      vehicleId: "veh-saved",
      customerId: "cust-lookup",
    });
    expect(resolveQueueIds(null, "cust-saved", lookup)).toEqual({
      vehicleId: "veh-lookup",
      customerId: "cust-saved",
    });
  });

  it("returns nulls when nothing is available", () => {
    expect(resolveQueueIds(null, null, EMPTY_LOOKUP)).toEqual({
      vehicleId: null,
      customerId: null,
    });
  });
});

describe("formatDate / formatTime", () => {
  it("formats an ISO date", () => {
    const d = new Date("2026-08-09T00:00:00Z");
    expect(formatDate("2026-08-09T00:00:00Z")).toBe(
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
  });

  it("formats an ISO time", () => {
    const d = new Date("2026-08-09T10:30:00Z");
    expect(formatTime("2026-08-09T10:30:00Z")).toBe(
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  });
});
