import { describe, expect, it } from "vitest";
import { serviceSchema, addWorkOrderServiceSchema } from "./service-schema";

describe("serviceSchema", () => {
  it("accepts valid service", () => {
    expect(
      serviceSchema.safeParse({ name: "Oil Change", defaultPrice: "30000" }).success,
    ).toBe(true);
  });

  it("accepts service with all fields", () => {
    expect(
      serviceSchema.safeParse({
        name: "Oil Change",
        nameMn: "Тос солих",
        defaultPrice: "30000",
        defaultCost: "15000",
        category: "Maintenance",
        description: "Engine oil replacement",
      }).success,
    ).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      serviceSchema.safeParse({ name: "", defaultPrice: "10000" }).success,
    ).toBe(false);
  });

  it("rejects missing name", () => {
    expect(serviceSchema.safeParse({ defaultPrice: "10000" }).success).toBe(false);
  });

  it("rejects missing defaultPrice", () => {
    expect(serviceSchema.safeParse({ name: "Service" }).success).toBe(false);
  });

  it("rejects empty defaultPrice", () => {
    expect(
      serviceSchema.safeParse({ name: "Service", defaultPrice: "" }).success,
    ).toBe(false);
  });

  it("rejects non-numeric defaultPrice", () => {
    expect(
      serviceSchema.safeParse({ name: "Service", defaultPrice: "free" }).success,
    ).toBe(false);
  });

  it("rejects negative defaultPrice", () => {
    expect(
      serviceSchema.safeParse({ name: "Service", defaultPrice: "-100" }).success,
    ).toBe(false);
  });

  it("accepts zero defaultPrice", () => {
    expect(
      serviceSchema.safeParse({ name: "Free Service", defaultPrice: "0" }).success,
    ).toBe(true);
  });
});

describe("addWorkOrderServiceSchema", () => {
  it("accepts valid work order service", () => {
    expect(
      addWorkOrderServiceSchema.safeParse({
        serviceName: "Oil Change",
        quantity: 1,
        unitPrice: 30000,
      }).success,
    ).toBe(true);
  });

  it("defaults quantity to 1", () => {
    const result = addWorkOrderServiceSchema.safeParse({
      serviceName: "Oil Change",
      unitPrice: 30000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it("rejects empty serviceName", () => {
    expect(
      addWorkOrderServiceSchema.safeParse({
        serviceName: "",
        quantity: 1,
        unitPrice: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects negative quantity", () => {
    expect(
      addWorkOrderServiceSchema.safeParse({
        serviceName: "Oil Change",
        quantity: -1,
        unitPrice: 30000,
      }).success,
    ).toBe(false);
  });

  it("rejects negative unit price", () => {
    expect(
      addWorkOrderServiceSchema.safeParse({
        serviceName: "Oil Change",
        quantity: 1,
        unitPrice: -100,
      }).success,
    ).toBe(false);
  });

  it("accepts zero unit price", () => {
    expect(
      addWorkOrderServiceSchema.safeParse({
        serviceName: "Free service",
        quantity: 1,
        unitPrice: 0,
      }).success,
    ).toBe(true);
  });

  it("rejects serviceName over 200 chars", () => {
    expect(
      addWorkOrderServiceSchema.safeParse({
        serviceName: "x".repeat(201),
        quantity: 1,
        unitPrice: 5000,
      }).success,
    ).toBe(false);
  });

  it("accepts discount fields", () => {
    expect(
      addWorkOrderServiceSchema.safeParse({
        serviceName: "Oil Change",
        quantity: 2,
        unitPrice: 30000,
        discountAmount: 5000,
        discountPercentage: 10,
        notes: "Returning customer",
      }).success,
    ).toBe(true);
  });
});
