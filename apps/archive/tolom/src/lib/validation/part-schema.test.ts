import { describe, expect, it } from "vitest";
import { addWorkOrderPartSchema, partSchema } from "./part-schema";

describe("partSchema", () => {
  it("accepts valid part with Mongolian name", () => {
    expect(partSchema.safeParse({ nameMn: "Тосны шүүлтүүр" }).success).toBe(
      true,
    );
  });

  it("accepts part with all fields", () => {
    expect(
      partSchema.safeParse({
        nameMn: "Тосны шүүлтүүр",
        name: "Oil filter",
        partNumber: "OF-101",
        barcode: "1234567890",
        defaultPrice: "15000",
        purchasePrice: "10000",
        category: "Filters",
        unit: "pcs",
        description: "Engine oil filter",
        location: "A-12",
      }).success,
    ).toBe(true);
  });

  it("rejects empty Mongolian name", () => {
    expect(partSchema.safeParse({ nameMn: "" }).success).toBe(false);
  });

  it("rejects missing nameMn", () => {
    expect(partSchema.safeParse({}).success).toBe(false);
  });
});

describe("addWorkOrderPartSchema", () => {
  it("accepts valid work order part", () => {
    expect(
      addWorkOrderPartSchema.safeParse({
        partName: "Oil filter",
        quantity: 2,
        unitPrice: 15000,
      }).success,
    ).toBe(true);
  });

  it("defaults quantity to 1", () => {
    const result = addWorkOrderPartSchema.safeParse({
      partName: "Filter",
      unitPrice: 5000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it("rejects empty partName", () => {
    expect(
      addWorkOrderPartSchema.safeParse({
        partName: "",
        quantity: 1,
        unitPrice: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects negative quantity", () => {
    expect(
      addWorkOrderPartSchema.safeParse({
        partName: "Filter",
        quantity: -1,
        unitPrice: 5000,
      }).success,
    ).toBe(false);
  });

  it("rejects negative unit price", () => {
    expect(
      addWorkOrderPartSchema.safeParse({
        partName: "Filter",
        quantity: 1,
        unitPrice: -100,
      }).success,
    ).toBe(false);
  });

  it("accepts zero unit price", () => {
    expect(
      addWorkOrderPartSchema.safeParse({
        partName: "Free item",
        quantity: 1,
        unitPrice: 0,
      }).success,
    ).toBe(true);
  });

  it("accepts partId as UUID", () => {
    expect(
      addWorkOrderPartSchema.safeParse({
        partId: "550e8400-e29b-41d4-a716-446655440000",
        partName: "Filter",
        quantity: 1,
        unitPrice: 5000,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid UUID for partId", () => {
    expect(
      addWorkOrderPartSchema.safeParse({
        partId: "not-a-uuid",
        partName: "Filter",
        quantity: 1,
        unitPrice: 5000,
      }).success,
    ).toBe(false);
  });

  it("rejects partName over 200 chars", () => {
    expect(
      addWorkOrderPartSchema.safeParse({
        partName: "x".repeat(201),
        quantity: 1,
        unitPrice: 5000,
      }).success,
    ).toBe(false);
  });
});
