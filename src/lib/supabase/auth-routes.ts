/**
 * Route-matching helpers for Supabase middleware.
 * Separated from session refresh logic for clarity.
 */

/** Strip locale prefix and normalize: "/mn/dashboard" → "/dashboard", "/mn" → "/" */
function normalizePathname(pathname: string): string {
  return pathname.replace(/^\/(mn|en)(?=\/|$)/, "") || "/";
}

export interface RouteMatch {
  isAuthRoute: boolean;
  isInvoiceRoute: boolean;
  isPortalRoute: boolean;
  isInviteRoute: boolean;
  isPricingRoute: boolean;
  isPublicRoute: boolean;
  isLoginRoute: boolean;
}

/** Classify a pathname into route categories for auth middleware. */
export function matchRoutes(pathname: string): RouteMatch {
  const p = normalizePathname(pathname);

  return {
    isAuthRoute: p.includes("/auth/"),
    isInvoiceRoute: p.startsWith("/invoice/"),
    isPortalRoute: p.startsWith("/portal"),
    isInviteRoute: p.startsWith("/invite/"),
    isPricingRoute: p.startsWith("/pricing"),
    isPublicRoute:
      p === "/" ||
      p.startsWith("/features") ||
      p.startsWith("/products") ||
      p.startsWith("/about") ||
      p.startsWith("/contact") ||
      p.startsWith("/faq") ||
      p.startsWith("/blog") ||
      p.startsWith("/status") ||
      p.startsWith("/integrations") ||
      p.startsWith("/services"),
    isLoginRoute: p.includes("/auth/login"),
  };
}
