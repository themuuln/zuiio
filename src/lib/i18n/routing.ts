import { defineRouting } from "next-intl/routing";

/**
 * NOTE: localePrefix: "never" means URLs have no locale segment (e.g., /dashboard, not /en/dashboard).
 * The [locale] directory in app/ is still required for next-intl routing/message resolution,
 * but the middleware strips the prefix so the browser never sees it.
 *
 * Locale detection happens in src/proxy.ts from three sources (in priority order):
 * 1. NEXT_LOCALE cookie (set by LocaleSwitcher)
 * 2. Accept-Language header (first visit, no cookie)
 * 3. defaultLocale ("mn")
 *
 * localeDetection is disabled here because we handle it manually in the middleware
 * (auth middleware runs before i18n middleware; passing detection to next-intl
 * would add a second detection pass on top of ours, which is redundant).
 */
export const routing = defineRouting({
  locales: ["mn", "en"],
  defaultLocale: "mn",
  localePrefix: "never",
  localeDetection: false,
});
