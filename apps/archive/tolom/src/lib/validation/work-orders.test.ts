import { describe, expect, it } from "vitest";
import { updatePartPriceSchema, updateServicePriceSchema } from "./work-orders";

describe("work order PATCH price schemas", () => {
  it.each([
    ["service", updateServicePriceSchema],
    ["part", updatePartPriceSchema],
  ])("accepts a unit_price-only %s price patch", (_name, schema) => {
    const result = schema.safeParse({ unit_price: 12345 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ unit_price: 12345 });
    }
  });

  it.each([
    ["service", updateServicePriceSchema],
    ["part", updatePartPriceSchema],
  ])("rejects an empty %s price patch", (_name, schema) => {
    const result = schema.safeParse({});

    expect(result.success).toBe(false);
  });
});
