import { describe, expect, it } from "vitest";
import { getStoreForPath } from "./path-to-store";

describe("getStoreForPath", () => {
  it("returns store for exact path match", () => {
    expect(getStoreForPath("/customers")).toBe("customers");
    expect(getStoreForPath("/vehicles")).toBe("vehicles");
    expect(getStoreForPath("/work-orders")).toBe("work-orders");
    expect(getStoreForPath("/services")).toBe("services");
    expect(getStoreForPath("/branches")).toBe("branches");
    expect(getStoreForPath("/expenses")).toBe("expenses");
  });

  it("returns store for sub-path via prefix match", () => {
    expect(getStoreForPath("/customers/123")).toBe("customers");
    expect(getStoreForPath("/vehicles/456/parts")).toBe("vehicles");
    expect(getStoreForPath("/inventory/parts/789")).toBe("inventory-parts");
    expect(getStoreForPath("/inventory/movements/abc")).toBe("inventory-movements");
    expect(getStoreForPath("/payroll/records/111")).toBe("payroll");
    expect(getStoreForPath("/service-reminders/222")).toBe("service-reminders");
  });

  it("returns undefined for unknown paths", () => {
    expect(getStoreForPath("/unknown")).toBeUndefined();
    expect(getStoreForPath("/api/unknown")).toBeUndefined();
    expect(getStoreForPath("")).toBeUndefined();
  });

  it("returns undefined for null/undefined-like paths", () => {
    expect(getStoreForPath("/")).toBeUndefined();
  });

  it("matches nested inventory paths correctly", () => {
    expect(getStoreForPath("/inventory/parts")).toBe("inventory-parts");
    expect(getStoreForPath("/inventory/movements")).toBe("inventory-movements");
    expect(getStoreForPath("/inventory/suppliers")).toBe("inventory-suppliers");
    expect(getStoreForPath("/inventory/purchase-orders")).toBe("inventory-purchase-orders");
  });

  it("returns correct store for /users path", () => {
    expect(getStoreForPath("/users")).toBe("organizations");
  });

  it("handles /day-close/close as exact match", () => {
    expect(getStoreForPath("/day-close")).toBe("day-close");
    expect(getStoreForPath("/day-close/close")).toBe("day-close");
  });

  it("handles paths with trailing content", () => {
    expect(getStoreForPath("/reports/monthly")).toBe("reports");
    expect(getStoreForPath("/estimates/e-1/pdf")).toBe("work-orders");
  });
});
