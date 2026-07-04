import { describe, it, expect } from "vitest";
import { selectAbVariant } from "./ab-test-utils";

describe("selectAbVariant", () => {
  it("returns index 0 for single variant with any weight", () => {
    const variants = [{ id: "v1", weight: 100, message: "Only variant" }];
    // All random values should return index 0
    for (let r = 0; r < 1; r += 0.05) {
      expect(selectAbVariant(variants, r)).toBe(0);
    }
  });

  it("always selects first variant when weight is 100/0", () => {
    const variants = [
      { id: "v1", weight: 100, message: "Variant A" },
      { id: "v2", weight: 0, message: "Variant B" },
    ];
    // All random values should select index 0
    for (let r = 0; r < 1; r += 0.01) {
      expect(selectAbVariant(variants, r)).toBe(0);
    }
  });

  it("always selects second variant when weight is 0/100", () => {
    const variants = [
      { id: "v1", weight: 0, message: "Variant A" },
      { id: "v2", weight: 100, message: "Variant B" },
    ];
    // All random values should select index 1
    for (let r = 0; r < 1; r += 0.01) {
      expect(selectAbVariant(variants, r)).toBe(1);
    }
  });

  it("selects first variant when random value is at lower boundary", () => {
    const variants = [
      { id: "v1", weight: 70, message: "Variant A" },
      { id: "v2", weight: 30, message: "Variant B" },
    ];
    // random=0 should always select first variant
    expect(selectAbVariant(variants, 0)).toBe(0);
  });

  it("selects last variant when random value approaches 1", () => {
    const variants = [
      { id: "v1", weight: 30, message: "Variant A" },
      { id: "v2", weight: 30, message: "Variant B" },
      { id: "v3", weight: 40, message: "Variant C" },
    ];
    // random=0.999 should select last variant (cumulative 30+30+40=100, random*100=99.9, cumulative at idx2=100)
    expect(selectAbVariant(variants, 0.999)).toBe(2);
  });

  it("selects correct variant at boundary values", () => {
    const variants = [
      { id: "v1", weight: 50, message: "Variant A" },
      { id: "v2", weight: 50, message: "Variant B" },
    ];
    // totalWeight = 100
    // random * 100 < 50  => index 0
    // random * 100 >= 50 => index 1
    // At exact boundary (random = 0.5): random * 100 = 50, cumulative at idx0 = 50, so 50 < 50 is false => index 1
    expect(selectAbVariant(variants, 0.4999)).toBe(0); // 49.99 < 50 => index 0
    expect(selectAbVariant(variants, 0.5)).toBe(1);    // 50 < 50 is false => index 1
    expect(selectAbVariant(variants, 0)).toBe(0);       // 0 < 50 => index 0
  });

  it("supports three variants with unequal weights", () => {
    const variants = [
      { id: "v1", weight: 20, message: "A" },
      { id: "v2", weight: 30, message: "B" },
      { id: "v3", weight: 50, message: "C" },
    ];
    // totalWeight = 100
    // random*100 < 20 => index 0
    // 20 <= random*100 < 50 => index 1
    // 50 <= random*100 => index 2
    expect(selectAbVariant(variants, 0.19)).toBe(0);  // 19 < 20 => index 0
    expect(selectAbVariant(variants, 0.20)).toBe(1);   // 20 < 20 is false => index 1
    expect(selectAbVariant(variants, 0.49)).toBe(1);   // 49 < 50 => index 1
    expect(selectAbVariant(variants, 0.50)).toBe(2);   // 50 < 50 is false => index 2
    expect(selectAbVariant(variants, 0.99)).toBe(2);   // 99 < 100 => index 2
  });

  it("supports arbitrary number of variants (e.g., 5 variants)", () => {
    const variants = [
      { id: "v1", weight: 10, message: "A" },
      { id: "v2", weight: 20, message: "B" },
      { id: "v3", weight: 30, message: "C" },
      { id: "v4", weight: 25, message: "D" },
      { id: "v5", weight: 15, message: "E" },
    ];
    // totalWeight = 100
    expect(selectAbVariant(variants, 0.05)).toBe(0);  // 5 < 10 => 0
    expect(selectAbVariant(variants, 0.10)).toBe(1);    // 10 < 10 is false => 1
    expect(selectAbVariant(variants, 0.30)).toBe(2);    // 30 < 30 is false => 2
    expect(selectAbVariant(variants, 0.59)).toBe(2);    // 59 < 60 => 2
    expect(selectAbVariant(variants, 0.60)).toBe(3);    // 60 < 60 is false => 3
    expect(selectAbVariant(variants, 0.84)).toBe(3);    // 84 < 85 => 3
    expect(selectAbVariant(variants, 0.85)).toBe(4);    // 85 < 85 is false => 4
    expect(selectAbVariant(variants, 0.99)).toBe(4);    // 99 < 100 => 4
  });

  it("handles empty variants array gracefully", () => {
    expect(selectAbVariant([], 0.5)).toBe(0);
  });

  it("handles variants with all zero weights gracefully", () => {
    const variants = [
      { id: "v1", weight: 0, message: "A" },
      { id: "v2", weight: 0, message: "B" },
    ];
    // When totalWeight <= 0, return first variant
    expect(selectAbVariant(variants, 0.5)).toBe(0);
  });

  it("produces roughly uniform distribution with equal weights over many trials", () => {
    const variants = [
      { id: "v1", weight: 50, message: "A" },
      { id: "v2", weight: 50, message: "B" },
    ];

    const trials = 10_000;
    const counts = [0, 0];

    // Use deterministic seeds to simulate random values
    for (let i = 0; i < trials; i++) {
      const r = i / trials; // Evenly spaced values in [0, 1)
      const idx = selectAbVariant(variants, r);
      counts[idx]++;
    }

    // Each variant should be selected roughly half the time
    const ratio0 = counts[0] / trials;
    const ratio1 = counts[1] / trials;
    expect(ratio0).toBeCloseTo(0.5, 1); // Within 10% tolerance
    expect(ratio1).toBeCloseTo(0.5, 1);
  });

  it("produces correct distribution for 70/30 split", () => {
    const variants = [
      { id: "v1", weight: 70, message: "A" },
      { id: "v2", weight: 30, message: "B" },
    ];

    const trials = 10_000;
    const counts = [0, 0];

    for (let i = 0; i < trials; i++) {
      const r = i / trials;
      const idx = selectAbVariant(variants, r);
      counts[idx]++;
    }

    const ratio0 = counts[0] / trials;
    expect(ratio0).toBeCloseTo(0.7, 1); // Within 10% tolerance
  });

  it("handles variants with non-contiguous IDs gracefully", () => {
    const variants = [
      { weight: 25, message: "A" },
      { weight: 25, message: "B" },
      { weight: 25, message: "C" },
      { weight: 25, message: "D" },
    ];

    // totalWeight = 100
    expect(selectAbVariant(variants, 0.24)).toBe(0);
    expect(selectAbVariant(variants, 0.25)).toBe(1);
    expect(selectAbVariant(variants, 0.49)).toBe(1);
    expect(selectAbVariant(variants, 0.50)).toBe(2);
    expect(selectAbVariant(variants, 0.74)).toBe(2);
    expect(selectAbVariant(variants, 0.75)).toBe(3);
    expect(selectAbVariant(variants, 0.99)).toBe(3);
  });
});
