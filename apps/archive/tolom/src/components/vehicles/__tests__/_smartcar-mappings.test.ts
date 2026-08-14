import { describe, expect, it } from "vitest";
import {
  MN_COLORS,
  MN_FUEL,
  MN_TRANSMISSION,
  mapMongolianValue,
} from "@/components/vehicles/form-sections/_smartcar-mappings";

describe("mapMongolianValue", () => {
  it("maps an exact Mongolian value to English", () => {
    expect(mapMongolianValue("бензин", MN_FUEL)).toBe("Gasoline");
    expect(mapMongolianValue("хар", MN_COLORS)).toBe("Black");
    expect(mapMongolianValue("автомат", MN_TRANSMISSION)).toBe("Automatic");
  });

  it("is case-insensitive", () => {
    expect(mapMongolianValue("ХАР", MN_COLORS)).toBe("Black");
    expect(mapMongolianValue("Дизель", MN_FUEL)).toBe("Diesel");
  });

  it("trims surrounding whitespace", () => {
    expect(mapMongolianValue("  механик  ", MN_TRANSMISSION)).toBe("Manual");
  });

  it("matches a Mongolian word embedded in a longer string", () => {
    expect(mapMongolianValue("цэвэр бензин хөдөлгүүр", MN_FUEL)).toBe(
      "Gasoline",
    );
    expect(
      mapMongolianValue("баруун талын жолоодлого", {
        баруун: "Right",
        зүүн: "Left",
      }),
    ).toBe("Right");
  });

  it("returns null for unknown values", () => {
    expect(mapMongolianValue("цэнхэр", MN_FUEL)).toBeNull();
    expect(mapMongolianValue("petrol", MN_FUEL)).toBeNull();
    expect(mapMongolianValue("", MN_COLORS)).toBeNull();
  });

  it("matches the first mapping key found in iteration order", () => {
    expect(mapMongolianValue("хуучин автомахин", MN_FUEL)).toBe("Gasoline");
  });
});

describe("MN_COLORS", () => {
  it("maps all entries to a known English color", () => {
    const allowed = new Set([
      "Black",
      "White",
      "Red",
      "Blue",
      "Yellow",
      "Green",
      "Gray",
      "Silver",
      "Brown",
      "Orange",
      "Purple",
      "Gold",
    ]);
    for (const en of Object.values(MN_COLORS)) {
      expect(allowed.has(en)).toBe(true);
    }
  });

  it("maps both brown entries to Brown", () => {
    const browns = Object.entries(MN_COLORS)
      .filter(([, en]) => en === "Brown")
      .map(([mn]) => mn);
    expect(browns).toEqual(expect.arrayContaining(["бор", "хүрэн"]));
  });

  it("contains every Mongolian key lowercased", () => {
    for (const mn of Object.keys(MN_COLORS)) {
      expect(mn).toBe(mn.toLowerCase());
    }
  });
});

describe("MN_FUEL", () => {
  it("maps all entries to a known English fuel type", () => {
    const allowed = new Set([
      "Gasoline",
      "Diesel",
      "Electric",
      "Hybrid",
      "LPG",
    ]);
    for (const en of Object.values(MN_FUEL)) {
      expect(allowed.has(en)).toBe(true);
    }
  });

  it("maps the colloquial automatic-car word to gasoline", () => {
    const entry = Object.entries(MN_FUEL).find(([mn]) => mn === "автомахин");
    expect(entry?.[1]).toBe("Gasoline");
  });

  it("maps every value through mapMongolianValue losslessly", () => {
    for (const [mn, en] of Object.entries(MN_FUEL)) {
      expect(mapMongolianValue(mn, MN_FUEL)).toBe(en);
    }
  });
});

describe("MN_TRANSMISSION", () => {
  it("maps all entries to a known English transmission type", () => {
    const allowed = new Set(["Automatic", "Manual", "CVT"]);
    for (const en of Object.values(MN_TRANSMISSION)) {
      expect(allowed.has(en)).toBe(true);
    }
  });

  it("maps every value through mapMongolianValue losslessly", () => {
    for (const [mn, en] of Object.entries(MN_TRANSMISSION)) {
      expect(mapMongolianValue(mn, MN_TRANSMISSION)).toBe(en);
    }
  });
});
