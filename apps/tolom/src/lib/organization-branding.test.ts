import { describe, expect, it, vi } from "vitest";

const { mockResolveBrandConfig } = vi.hoisted(() => ({
  mockResolveBrandConfig: vi.fn((config: any) => config ?? { theme: "zuiio" }),
}));

vi.mock("@zuiio/branding", () => ({
  resolveBrandConfig: mockResolveBrandConfig,
  DEFAULT_BRAND_CONFIG: { theme: "zuiio" },
  BrandConfig: {},
}));

import {
  readOrganizationBrandConfig,
  writeOrganizationBrandConfig,
} from "./organization-branding";

describe("readOrganizationBrandConfig", () => {
  it("returns branding config when present", () => {
    const settings = {
      branding: { theme: "custom", primary: "#ff0000" },
    };
    const result = readOrganizationBrandConfig(settings as any);
    expect(mockResolveBrandConfig).toHaveBeenCalledWith({ theme: "custom", primary: "#ff0000" });
    expect(result).toEqual({ theme: "custom", primary: "#ff0000" });
  });

  it("converts legacy theme with radius", () => {
    const settings = {
      theme: {
        primaryColor: "#3366ff",
        accentColor: "#ff6633",
        radius: "8",
      },
    };
    readOrganizationBrandConfig(settings as any);
    // radius "8px" → 8/16 = 0.5rem
    expect(mockResolveBrandConfig).toHaveBeenCalledWith({
      theme: "zuiio",
      custom_colors: { primary: "#3366ff", accent: "#ff6633" },
      radius: 0.5,
    });
  });

  it("converts legacy theme without radius", () => {
    const settings = {
      theme: { primaryColor: "#3366ff" },
    };
    readOrganizationBrandConfig(settings as any);
    expect(mockResolveBrandConfig).toHaveBeenCalledWith({
      theme: "zuiio",
      custom_colors: { primary: "#3366ff" },
    });
  });

  it("converts legacy brand_color hex", () => {
    const settings = { brand_color: "#ff0000" };
    readOrganizationBrandConfig(settings as any);
    expect(mockResolveBrandConfig).toHaveBeenCalledWith({
      theme: "zuiio",
      custom_colors: { primary: "#ff0000" },
    });
  });

  it("returns fallback for null settings", () => {
    readOrganizationBrandConfig(null);
    expect(mockResolveBrandConfig).toHaveBeenCalledWith(null);
  });

  it("returns fallback for undefined settings", () => {
    readOrganizationBrandConfig(undefined);
    expect(mockResolveBrandConfig).toHaveBeenCalledWith(null);
  });

  it("returns fallback for empty settings", () => {
    readOrganizationBrandConfig({});
    expect(mockResolveBrandConfig).toHaveBeenCalledWith(null);
  });

  it("prioritizes branding over legacy theme", () => {
    const settings = {
      branding: { theme: "new" },
      theme: { primaryColor: "#3366ff" },
    };
    readOrganizationBrandConfig(settings as any);
    expect(mockResolveBrandConfig).toHaveBeenCalledWith({ theme: "new" });
  });

  it("clamps radius to valid range", () => {
    const settings = {
      theme: { radius: "32" },
    };
    readOrganizationBrandConfig(settings as any);
    // 32px → 2.0 rem (max 2)
    expect(mockResolveBrandConfig).toHaveBeenCalledWith(
      expect.objectContaining({ radius: 2 }),
    );
  });
});

describe("writeOrganizationBrandConfig", () => {
  it("sets branding key and removes legacy keys", () => {
    const settings = {
      theme: { primaryColor: "#ff0000" },
      brand_color: "#ff0000",
      name: "My Shop",
    };
    const result = writeOrganizationBrandConfig(settings as any, {
      theme: "custom",
    } as any);

    expect(result.branding).toEqual({ theme: "custom" });
    expect(result).not.toHaveProperty("theme");
    expect(result).not.toHaveProperty("brand_color");
    expect(result.name).toBe("My Shop");
  });

  it("handles null settings", () => {
    const result = writeOrganizationBrandConfig(null, { theme: "custom" } as any);
    expect(result.branding).toEqual({ theme: "custom" });
  });

  it("handles undefined settings", () => {
    const result = writeOrganizationBrandConfig(undefined, { theme: "custom" } as any);
    expect(result.branding).toEqual({ theme: "custom" });
  });
});
