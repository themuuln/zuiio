import { describe, expect, it } from "vitest";
import {
  DASHBOARD_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  templateById,
  templateForCompanyType,
} from "../dashboard-templates";

describe("dashboard templates", () => {
  it("defines the four presets with their expected sections", () => {
    expect(DASHBOARD_TEMPLATES.map((t) => t.id)).toEqual([
      "default",
      "retail",
      "financial",
      "inventory",
    ]);

    // The default template preserves the original dashboard layout
    // (no low-stock section — the low-stock toast stays always-on).
    expect(templateById("default").sections).toEqual([
      "today-pulse",
      "quick-shortcuts",
      "recent-sales",
      "monthly-trend",
      "delivery-stats",
    ]);

    expect(templateById("retail").sections).toContain("low-stock");
    expect(templateById("retail").sections).toContain("quick-shortcuts");

    expect(templateById("financial").sections).not.toContain("low-stock");
    expect(templateById("financial").sections).not.toContain("quick-shortcuts");

    expect(templateById("inventory").sections).toContain("low-stock");
    expect(templateById("inventory").sections).not.toContain("monthly-trend");
  });

  it("falls back to the default template for unknown or missing ids", () => {
    expect(templateById("unknown").id).toBe(DEFAULT_TEMPLATE_ID);
    expect(templateById(undefined).id).toBe(DEFAULT_TEMPLATE_ID);
    expect(templateById(null).id).toBe(DEFAULT_TEMPLATE_ID);
    expect(templateById("").id).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("maps company types to recommended template ids", () => {
    expect(templateForCompanyType("retail")).toBe("retail");
    expect(templateForCompanyType("restaurant")).toBe("retail");
    expect(templateForCompanyType("cafe")).toBe("retail");

    expect(templateForCompanyType("service")).toBe("financial");

    expect(templateForCompanyType("manufacturing")).toBe("inventory");
    expect(templateForCompanyType("wholesale")).toBe("inventory");

    expect(templateForCompanyType("gym")).toBe(DEFAULT_TEMPLATE_ID);
    expect(templateForCompanyType("religious")).toBe(DEFAULT_TEMPLATE_ID);
    expect(templateForCompanyType("other")).toBe(DEFAULT_TEMPLATE_ID);
    expect(templateForCompanyType(undefined)).toBe(DEFAULT_TEMPLATE_ID);
    expect(templateForCompanyType(null)).toBe(DEFAULT_TEMPLATE_ID);
  });
});
