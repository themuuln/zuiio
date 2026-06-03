/**
 * Route-matching helpers for Supabase middleware.
 * Separated from session refresh logic for clarity.
 */

/** Strip locale prefix and normalize: "/mn/dashboard" → "/dashboard", "/mn" → "/" */
function normalizePathname(pathname: string): string {
  return pathname.replace(/^\/(mn|en)(?=\/|$)/, "") || "/";
}

/** Role level required for a route */
export type RequiredRoleLevel =
  | "super_admin"
  | "owner"
  | "manager"
  | "mechanic"
  | "guest"
  | "public";

export interface RouteMatch {
  isAuthRoute: boolean;
  isInvoiceRoute: boolean;
  isPortalRoute: boolean;
  isInviteRoute: boolean;
  isPricingRoute: boolean;
  isPublicRoute: boolean;
  isBookingRoute: boolean;
  isLoginRoute: boolean;
  isOwnerRoute: boolean;
  isManagerRoute: boolean;
  isMechanicRoute: boolean;
  isAdminRoute: boolean;
  requiredRoleLevel: RequiredRoleLevel;
}

/** Classify a pathname into route categories for auth middleware. */
export function matchRoutes(pathname: string): RouteMatch {
  const p = normalizePathname(pathname);

  const isAuthRoute = p.includes("/auth/");
  const isInvoiceRoute = p.startsWith("/invoice/");
  const isBookingRoute = p.startsWith("/booking/");
  const isPortalRoute = p.startsWith("/portal");
  const isInviteRoute = p.startsWith("/invite/");
  const isPricingRoute = p.startsWith("/pricing");
  const isPublicRoute =
    p === "/" ||
    p.startsWith("/features") ||
    p.startsWith("/products") ||
    p.startsWith("/about") ||
    p.startsWith("/contact") ||
    p.startsWith("/faq") ||
    p.startsWith("/blog") ||
    p.startsWith("/status") ||
    p.startsWith("/integrations") ||
    p.startsWith("/services");
  const isLoginRoute = p.includes("/auth/login");
  const isAdminRoute =
    p.startsWith("/dashboard/admin") || p.startsWith("/super-admin");
  const isOwnerRoute = p.startsWith("/dashboard/organization");
  // Manager+ and Mechanic+ role levels are reserved for future use
  const isManagerRoute = false;
  const isMechanicRoute = false;

  // Determine the required role level
  let requiredRoleLevel: RequiredRoleLevel = "public";
  if (isAdminRoute) {
    requiredRoleLevel = "super_admin";
  } else if (isOwnerRoute) {
    requiredRoleLevel = "owner";
  } else if (isPortalRoute) {
    requiredRoleLevel = "guest";
  }

  return {
    isAuthRoute,
    isInvoiceRoute,
    isPortalRoute,
    isBookingRoute,
    isInviteRoute,
    isPricingRoute,
    isPublicRoute,
    isLoginRoute,
    isOwnerRoute,
    isManagerRoute,
    isMechanicRoute,
    isAdminRoute,
    requiredRoleLevel,
  };
}
