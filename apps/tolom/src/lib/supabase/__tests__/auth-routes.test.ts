import { describe, expect, it } from "vitest";
import { matchRoutes } from "../auth-routes";

describe("matchRoutes", () => {
  it("classifies root path as public", () => {
    const r = matchRoutes("/");
    expect(r.isPublicRoute).toBe(true);
    expect(r.requiredRoleLevel).toBe("public");
  });

  it("normalizes locale prefix", () => {
    expect(matchRoutes("/en").isPublicRoute).toBe(true);
    expect(matchRoutes("/mn").isPublicRoute).toBe(true);
  });

  it("classifies auth routes", () => {
    const r = matchRoutes("/en/auth/login");
    expect(r.isAuthRoute).toBe(true);
    expect(r.isLoginRoute).toBe(true);
  });

  it("classifies admin routes as super_admin level", () => {
    const r = matchRoutes("/en/dashboard/admin/users");
    expect(r.isAdminRoute).toBe(true);
    expect(r.requiredRoleLevel).toBe("super_admin");
  });

  it("classifies organization settings as owner level", () => {
    const r = matchRoutes("/en/dashboard/organization/settings");
    expect(r.isOwnerRoute).toBe(true);
    expect(r.requiredRoleLevel).toBe("owner");
  });

  it("classifies public pages", () => {
    const paths = ["/features", "/about", "/contact", "/faq", "/blog", "/services"];
    for (const p of paths) {
      expect(matchRoutes(p).isPublicRoute).toBe(true);
    }
  });

  it("classifies pricing routes separately from public", () => {
    const r = matchRoutes("/pricing");
    expect(r.isPricingRoute).toBe(true);
    expect(r.isPublicRoute).toBe(false);
  });

  it("classifies invoice routes", () => {
    expect(matchRoutes("/invoice/abc-123").isInvoiceRoute).toBe(true);
  });

  it("classifies booking routes", () => {
    expect(matchRoutes("/booking/org-1").isBookingRoute).toBe(true);
  });

  it("classifies portal routes as guest level", () => {
    const r = matchRoutes("/portal/dashboard");
    expect(r.isPortalRoute).toBe(true);
    expect(r.requiredRoleLevel).toBe("guest");
  });

  it("classifies invite routes", () => {
    expect(matchRoutes("/invite/xyz").isInviteRoute).toBe(true);
  });

  it("classifies storefront routes", () => {
    expect(matchRoutes("/my-shop/parts").isStorefrontRoute).toBe(true);
  });

  it("classifies bare slug as storefront", () => {
    expect(matchRoutes("/my-shop").isStorefrontRoute).toBe(true);
  });

  it("does not classify regular dashboard routes", () => {
    const r = matchRoutes("/en/dashboard/work-orders");
    expect(r.isAdminRoute).toBe(false);
    expect(r.isOwnerRoute).toBe(false);
    expect(r.requiredRoleLevel).toBe("public");
  });
});
