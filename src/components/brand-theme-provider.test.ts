import { beforeEach, describe, expect, it } from "vitest";
import { applyBrandThemePreview } from "./brand-theme-provider";

describe("applyBrandThemePreview", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--primary-foreground");
  });

  it("sets brand_color CSS vars correctly", () => {
    applyBrandThemePreview({ brand_color: "#2563eb" });

    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
      "#2563eb",
    );
    expect(
      document.documentElement.style.getPropertyValue("--primary-foreground"),
    ).toBeTruthy();
  });
});
