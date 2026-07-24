/**
 * Tests for src/lib/query/keys.ts and src/lib/query/factory.ts
 */
import { describe, expect, it } from "vitest";
import {
  contactKeys,
  expenseKeys,
  inventoryKeys,
  productKeys,
  saleKeys,
} from "../keys";

describe("query keys", () => {
  it("productKeys has expected structure", () => {
    expect(productKeys).toBeDefined();
    expect(typeof productKeys.all).toBe("function");
  });

  it("productKeys.all returns array", () => {
    const result = productKeys.all();
    expect(Array.isArray(result)).toBe(true);
  });

  it("saleKeys has expected structure", () => {
    expect(saleKeys).toBeDefined();
    expect(typeof saleKeys.all).toBe("function");
  });

  it("contactKeys has expected structure", () => {
    expect(contactKeys).toBeDefined();
    expect(typeof contactKeys.all).toBe("function");
  });

  it("expenseKeys has expected structure", () => {
    expect(expenseKeys).toBeDefined();
    expect(typeof expenseKeys.all).toBe("function");
  });

  it("inventoryKeys has expected structure", () => {
    expect(inventoryKeys).toBeDefined();
    expect(typeof inventoryKeys.all).toBe("function");
  });
});
