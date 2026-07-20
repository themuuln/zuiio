import { describe, expect, it } from "vitest";
import {
  quickVehicleSchema,
  vehicleSchema,
  partsCarSchema,
  vehicleRegistrationSchema,
} from "./vehicle-schema";

describe("quickVehicleSchema", () => {
  it("accepts valid vehicle", () => {
    expect(
      quickVehicleSchema.safeParse({
        plateNumber: "4444УНА",
        make: "Toyota",
        model: "Camry",
      }).success,
    ).toBe(true);
  });

  it("rejects empty plateNumber", () => {
    expect(
      quickVehicleSchema.safeParse({ plateNumber: "", make: "Toyota", model: "Camry" }).success,
    ).toBe(false);
  });

  it("rejects invalid plate format", () => {
    expect(
      quickVehicleSchema.safeParse({ plateNumber: "ABC", make: "Toyota", model: "Camry" }).success,
    ).toBe(false);
  });

  it("rejects empty make", () => {
    expect(
      quickVehicleSchema.safeParse({ plateNumber: "4444УНА", make: "", model: "Camry" }).success,
    ).toBe(false);
  });

  it("rejects empty model", () => {
    expect(
      quickVehicleSchema.safeParse({ plateNumber: "4444УНА", make: "Toyota", model: "" }).success,
    ).toBe(false);
  });

  it("accepts optional fields", () => {
    expect(
      quickVehicleSchema.safeParse({
        plateNumber: "4444УНА",
        make: "Toyota",
        model: "Camry",
        year: "2020",
        color: "White",
        vin: "JTDBE32K203",
        engine: "2.5L",
        odometer: "50000",
      }).success,
    ).toBe(true);
  });
});

describe("vehicleSchema", () => {
  it("accepts valid full vehicle", () => {
    expect(
      vehicleSchema.safeParse({
        plateNumber: "4444УНА",
        make: "Toyota",
        model: "Camry",
      }).success,
    ).toBe(true);
  });

  it("accepts all optional fields", () => {
    expect(
      vehicleSchema.safeParse({
        plateNumber: "4444УНА",
        make: "Lexus",
        model: "RX350",
        year: "2023",
        vin: "2T2ZZMCA5PC123456",
        color: "Black",
        engine: "3.5L",
        fuelType: "Gasoline",
        transmission: "Automatic",
        drivetrain: "AWD",
        bodyType: "SUV",
        odometer: "10000",
        notes: "Company car",
      }).success,
    ).toBe(true);
  });

  it("rejects missing plateNumber", () => {
    expect(
      vehicleSchema.safeParse({ make: "Toyota", model: "Camry" }).success,
    ).toBe(false);
  });
});

describe("partsCarSchema", () => {
  it("accepts valid parts car", () => {
    expect(
      partsCarSchema.safeParse({ make: "Honda", model: "Civic" }).success,
    ).toBe(true);
  });

  it("rejects empty make", () => {
    expect(partsCarSchema.safeParse({ make: "", model: "Civic" }).success).toBe(false);
  });

  it("rejects empty model", () => {
    expect(partsCarSchema.safeParse({ make: "Honda", model: "" }).success).toBe(false);
  });
});

describe("vehicleRegistrationSchema", () => {
  it("accepts valid registration", () => {
    expect(
      vehicleRegistrationSchema.safeParse({
        make: "Toyota",
        model: "Camry",
        custFirstName: "Bat",
        custPhone: "99112233",
      }).success,
    ).toBe(true);
  });

  it("rejects empty custFirstName", () => {
    expect(
      vehicleRegistrationSchema.safeParse({
        make: "Toyota",
        model: "Camry",
        custFirstName: "",
        custPhone: "99112233",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid phone", () => {
    expect(
      vehicleRegistrationSchema.safeParse({
        make: "Toyota",
        model: "Camry",
        custFirstName: "Bat",
        custPhone: "123",
      }).success,
    ).toBe(false);
  });

  it("accepts optional fields", () => {
    expect(
      vehicleRegistrationSchema.safeParse({
        make: "Toyota",
        model: "Camry",
        year: "2022",
        color: "Red",
        vin: "JTDBE32K203123456",
        engine: "2.0L",
        odometer: "30000",
        custFirstName: "Dorj",
        custPhone: "99112233",
        complaint: "Engine noise",
      }).success,
    ).toBe(true);
  });
});
