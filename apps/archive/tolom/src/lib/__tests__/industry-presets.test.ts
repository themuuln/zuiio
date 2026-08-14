import { describe, expect, it } from "vitest";
import {
  BUSINESS_TYPES,
  getBusinessTypeLabel,
  getBusinessTypes,
  getDefaultDiagnosisLabels,
  getDefaultServices,
  getPreset,
  INDUSTRY_PRESETS,
} from "../industry-presets";

describe("INDUSTRY_PRESETS", () => {
  it("has all 6 business types as keys", () => {
    const keys = Object.keys(INDUSTRY_PRESETS);
    expect(keys).toHaveLength(6);
    expect(keys).toEqual(
      expect.arrayContaining([
        "general_repair",
        "tire_shop",
        "body_shop",
        "dealership",
        "fleet",
        "quick_lube",
      ]),
    );
  });

  it.each([
    "general_repair",
    "tire_shop",
    "body_shop",
    "dealership",
    "fleet",
    "quick_lube",
  ] as const)("%s has all required fields", (type) => {
    const preset = INDUSTRY_PRESETS[type];
    expect(preset).toBeDefined();
    expect(preset).toHaveProperty("labelKey");
    expect(typeof preset.labelKey).toBe("string");
    expect(preset.labelKey.length).toBeGreaterThan(0);
    expect(preset).toHaveProperty("descriptionKey");
    expect(typeof preset.descriptionKey).toBe("string");
    expect(preset.descriptionKey.length).toBeGreaterThan(0);
    expect(preset).toHaveProperty("defaultServices");
    expect(Array.isArray(preset.defaultServices)).toBe(true);
    expect(preset.defaultServices.length).toBeGreaterThan(0);
    expect(preset).toHaveProperty("defaultDiagnosisLabels");
    expect(Array.isArray(preset.defaultDiagnosisLabels)).toBe(true);
    expect(preset.defaultDiagnosisLabels.length).toBeGreaterThan(0);
    expect(preset).toHaveProperty("defaultParts");
    expect(Array.isArray(preset.defaultParts)).toBe(true);
    expect(preset.defaultParts.length).toBeGreaterThan(0);
    expect(preset).toHaveProperty("servicePartSuggestions");
    expect(Array.isArray(preset.servicePartSuggestions)).toBe(true);
    expect(preset.servicePartSuggestions.length).toBeGreaterThan(0);
    expect(preset).toHaveProperty("defaultThreshold");
    expect(typeof preset.defaultThreshold).toBe("number");
    expect(preset.defaultThreshold).toBeGreaterThan(0);
  });

  it("has i18n-convention label keys", () => {
    const expectedLabels: Record<string, string> = {
      general_repair: "businessType.generalRepair",
      tire_shop: "businessType.tireShop",
      body_shop: "businessType.bodyShop",
      dealership: "businessType.dealership",
      fleet: "businessType.fleet",
      quick_lube: "businessType.quickLube",
    };
    for (const [type, expected] of Object.entries(expectedLabels)) {
      expect(
        INDUSTRY_PRESETS[type as keyof typeof INDUSTRY_PRESETS].labelKey,
      ).toBe(expected);
    }
  });

  it("has i18n-convention description keys", () => {
    const expectedDescs: Record<string, string> = {
      general_repair: "businessType.generalRepairDesc",
      tire_shop: "businessType.tireShopDesc",
      body_shop: "businessType.bodyShopDesc",
      dealership: "businessType.dealershipDesc",
      fleet: "businessType.fleetDesc",
      quick_lube: "businessType.quickLubeDesc",
    };
    for (const [type, expected] of Object.entries(expectedDescs)) {
      expect(
        INDUSTRY_PRESETS[type as keyof typeof INDUSTRY_PRESETS].descriptionKey,
      ).toBe(expected);
    }
  });

  it("each preset has unique labelKey and descriptionKey", () => {
    const labelKeys = Object.values(INDUSTRY_PRESETS).map((p) => p.labelKey);
    const descKeys = Object.values(INDUSTRY_PRESETS).map(
      (p) => p.descriptionKey,
    );
    expect(new Set(labelKeys).size).toBe(labelKeys.length);
    expect(new Set(descKeys).size).toBe(descKeys.length);
  });

  it("each preset has at least 5 defaultServices", () => {
    for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
      expect(
        preset.defaultServices.length,
        `${type} should have at least 5 services`,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it("each preset has at least 4 defaultDiagnosisLabels", () => {
    for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
      expect(
        preset.defaultDiagnosisLabels.length,
        `${type} should have at least 4 diagnosis labels`,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("has positive threshold for each preset", () => {
    for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
      expect(
        preset.defaultThreshold,
        `${type} threshold should be positive`,
      ).toBeGreaterThan(0);
    }
  });

  describe("service data quality", () => {
    it("every service has bilingual names and a category", () => {
      for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
        for (const svc of preset.defaultServices) {
          expect(
            svc.name.trim().length,
            `${type}: "${svc.name}" needs a name`,
          ).toBeGreaterThan(0);
          expect(
            svc.nameMn.trim().length,
            `${type}: "${svc.name}" needs nameMn`,
          ).toBeGreaterThan(0);
          expect(
            svc.category.trim().length,
            `${type}: "${svc.name}" needs a category`,
          ).toBeGreaterThan(0);
        }
      }
    });

    it("every service name is unique within its preset", () => {
      for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
        const names = preset.defaultServices.map((s) => s.name);
        expect(new Set(names).size, `${type} services should be unique`).toBe(
          names.length,
        );
      }
    });

    it("every diagnosis label has a Mongolian name", () => {
      for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
        for (const label of preset.defaultDiagnosisLabels) {
          expect(
            label.nameMn.trim().length,
            `${type}: label "${label.name}" needs nameMn`,
          ).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("parts data quality", () => {
    it("every part has bilingual names, a category, and a unit", () => {
      for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
        for (const part of preset.defaultParts) {
          expect(
            part.name.trim().length,
            `${type}: "${part.name}" needs a name`,
          ).toBeGreaterThan(0);
          expect(
            part.nameMn.trim().length,
            `${type}: "${part.name}" needs nameMn`,
          ).toBeGreaterThan(0);
          expect(
            part.category.trim().length,
            `${type}: "${part.name}" needs a category`,
          ).toBeGreaterThan(0);
          expect(
            (part.unit ?? "piece").length,
            `${type}: "${part.name}" needs a unit`,
          ).toBeGreaterThan(0);
        }
      }
    });

    it("every part name is unique within its preset", () => {
      for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
        const names = preset.defaultParts.map((p) => p.name);
        expect(new Set(names).size, `${type} parts should be unique`).toBe(
          names.length,
        );
      }
    });

    it("every part has a positive reference price", () => {
      for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
        for (const part of preset.defaultParts) {
          expect(
            part.defaultPrice,
            `${type}: "${part.name}" needs a default price`,
          ).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("suggestion data integrity", () => {
    it("every suggestion references an existing service in the preset", () => {
      for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
        const serviceNames = new Set(preset.defaultServices.map((s) => s.name));
        for (const sug of preset.servicePartSuggestions) {
          expect(
            serviceNames.has(sug.service),
            `${type}: suggestion service "${sug.service}" must exist in defaultServices`,
          ).toBe(true);
        }
      }
    });

    it("every suggestion references an existing part in the preset", () => {
      for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
        const partNames = new Set(preset.defaultParts.map((p) => p.name));
        for (const sug of preset.servicePartSuggestions) {
          expect(
            partNames.has(sug.part),
            `${type}: suggestion part "${sug.part}" must exist in defaultParts`,
          ).toBe(true);
        }
      }
    });

    it("every suggestion has a positive quantity", () => {
      for (const [type, preset] of Object.entries(INDUSTRY_PRESETS)) {
        for (const sug of preset.servicePartSuggestions) {
          expect(
            sug.quantity,
            `${type}: "${sug.service}" → "${sug.part}" quantity must be positive`,
          ).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("preset data integrity", () => {
    it("general_repair has Oil Change and Engine Diagnostics", () => {
      const preset = INDUSTRY_PRESETS.general_repair;
      const serviceNames = preset.defaultServices.map((s) => s.name);
      expect(serviceNames).toContain("Oil Change");
      expect(serviceNames).toContain("Engine Diagnostics (OBD-II)");
      const labelNames = preset.defaultDiagnosisLabels.map((l) => l.name);
      expect(labelNames).toContain("Engine");
      expect(labelNames).toContain("Brakes");
      expect(preset.defaultThreshold).toBe(5);
    });

    it("tire_shop has tire-specific services", () => {
      const preset = INDUSTRY_PRESETS.tire_shop;
      const serviceNames = preset.defaultServices.map((s) => s.name);
      expect(serviceNames).toContain("Tire Mounting & Balancing");
      expect(serviceNames).toContain("Tire Rotation");
      const labelNames = preset.defaultDiagnosisLabels.map((l) => l.name);
      expect(labelNames).toContain("Tire Wear");
      expect(labelNames).toContain("TPMS Warning");
      expect(preset.defaultThreshold).toBe(20);
    });

    it("body_shop has collision and paint services", () => {
      const preset = INDUSTRY_PRESETS.body_shop;
      const serviceNames = preset.defaultServices.map((s) => s.name);
      expect(serviceNames).toContain("Collision Repair");
      expect(serviceNames).toContain("Paint & Refinish");
      const labelNames = preset.defaultDiagnosisLabels.map((l) => l.name);
      expect(labelNames).toContain("Body Damage");
      expect(labelNames).toContain("Frame Damage");
      expect(preset.defaultThreshold).toBe(3);
    });

    it("dealership has warranty and recall services", () => {
      const preset = INDUSTRY_PRESETS.dealership;
      const serviceNames = preset.defaultServices.map((s) => s.name);
      expect(serviceNames).toContain("Factory Scheduled Maintenance");
      expect(serviceNames).toContain("Warranty Repair");
      expect(serviceNames).toContain("Recall Service");
      const labelNames = preset.defaultDiagnosisLabels.map((l) => l.name);
      expect(labelNames).toContain("Warranty Claim");
      expect(labelNames).toContain("Recall");
      expect(preset.defaultThreshold).toBe(10);
    });

    it("fleet has DOT inspection and preventive maintenance", () => {
      const preset = INDUSTRY_PRESETS.fleet;
      const serviceNames = preset.defaultServices.map((s) => s.name);
      expect(serviceNames).toContain("Preventive Maintenance");
      expect(serviceNames).toContain("DOT Inspection");
      const labelNames = preset.defaultDiagnosisLabels.map((l) => l.name);
      expect(labelNames).toContain("Emission");
      expect(labelNames).toContain("HVAC");
      expect(preset.defaultThreshold).toBe(8);
    });

    it("quick_lube has quick-service focus", () => {
      const preset = INDUSTRY_PRESETS.quick_lube;
      const serviceNames = preset.defaultServices.map((s) => s.name);
      expect(serviceNames).toContain("Oil Change");
      expect(serviceNames).toContain("Filter Replacement");
      expect(serviceNames).toContain("Fluid Top-Off");
      const labelNames = preset.defaultDiagnosisLabels.map((l) => l.name);
      expect(labelNames).toContain("Oil Leak");
      expect(labelNames).toContain("Warning Light");
      expect(preset.defaultThreshold).toBe(15);
    });
  });
});

describe("BUSINESS_TYPES", () => {
  it("contains all 6 business types", () => {
    expect(BUSINESS_TYPES).toHaveLength(6);
    expect(BUSINESS_TYPES).toEqual([
      "general_repair",
      "tire_shop",
      "body_shop",
      "dealership",
      "fleet",
      "quick_lube",
    ]);
  });

  it("matches INDUSTRY_PRESETS keys exactly", () => {
    expect(BUSINESS_TYPES).toEqual(Object.keys(INDUSTRY_PRESETS));
  });
});

describe("getPreset", () => {
  it("returns correct preset for each valid type", () => {
    for (const type of BUSINESS_TYPES) {
      const preset = getPreset(type);
      expect(preset).toBe(INDUSTRY_PRESETS[type]);
    }
  });

  it("falls back to general_repair for unknown type", () => {
    const preset = getPreset("nonexistent_type");
    expect(preset).toBe(INDUSTRY_PRESETS.general_repair);
  });

  it("falls back to general_repair for empty string", () => {
    const preset = getPreset("");
    expect(preset).toBe(INDUSTRY_PRESETS.general_repair);
  });

  it("is case-sensitive (LowerCase is not recognized)", () => {
    const preset = getPreset("General_Repair");
    expect(preset).toBe(INDUSTRY_PRESETS.general_repair);
  });
});

describe("getBusinessTypeLabel", () => {
  it("returns correct label key for each type", () => {
    const expected: Record<string, string> = {
      general_repair: "businessType.generalRepair",
      tire_shop: "businessType.tireShop",
      body_shop: "businessType.bodyShop",
      dealership: "businessType.dealership",
      fleet: "businessType.fleet",
      quick_lube: "businessType.quickLube",
    };
    for (const [type, expectedKey] of Object.entries(expected)) {
      expect(getBusinessTypeLabel(type)).toBe(expectedKey);
    }
  });

  it("returns general_repair label for unknown type", () => {
    expect(getBusinessTypeLabel("unknown")).toBe("businessType.generalRepair");
  });
});

describe("getBusinessTypes", () => {
  it("returns all business types", () => {
    const types = getBusinessTypes();
    expect(types).toHaveLength(6);
    expect(types).toEqual([
      "general_repair",
      "tire_shop",
      "body_shop",
      "dealership",
      "fleet",
      "quick_lube",
    ]);
  });

  it("returns the same array reference as BUSINESS_TYPES", () => {
    expect(getBusinessTypes()).toBe(BUSINESS_TYPES);
  });
});

describe("getDefaultServices", () => {
  it("returns correct service names for each type", () => {
    for (const type of BUSINESS_TYPES) {
      const services = getDefaultServices(type);
      expect(services).toEqual(
        INDUSTRY_PRESETS[type].defaultServices.map((s) => s.name),
      );
    }
  });

  it("returns general_repair services for unknown type", () => {
    const services = getDefaultServices("unknown");
    expect(services).toEqual(
      INDUSTRY_PRESETS.general_repair.defaultServices.map((s) => s.name),
    );
  });

  it("returns unique service name arrays per preset (not shared references)", () => {
    const grServices = getDefaultServices("general_repair");
    const tireServices = getDefaultServices("tire_shop");
    expect(grServices).not.toBe(tireServices);
  });
});

describe("getDefaultDiagnosisLabels", () => {
  it("returns correct label names for each type", () => {
    for (const type of BUSINESS_TYPES) {
      const labels = getDefaultDiagnosisLabels(type);
      expect(labels).toEqual(
        INDUSTRY_PRESETS[type].defaultDiagnosisLabels.map((l) => l.name),
      );
    }
  });

  it("returns general_repair labels for unknown type", () => {
    const labels = getDefaultDiagnosisLabels("unknown");
    expect(labels).toEqual(
      INDUSTRY_PRESETS.general_repair.defaultDiagnosisLabels.map((l) => l.name),
    );
  });
});
