"use client";

import { createContext, useContext } from "react";

const StorefrontBaseContext = createContext<string>("");

/**
 * Storefront link base path provided by the `[slug]` layout:
 * - Primary host → "/{slug}" (storefront pages live under /{slug}).
 * - Custom domain / org subdomain → "" (the proxy rewrites the domain root
 *   to /{slug}, so links are root-relative: "/cart", "/products", …).
 *
 * Client components consume it via `useStorefrontBase()` instead of sniffing
 * the browser host, so server-rendered hrefs and the hydrated client always
 * agree (no hydration mismatch, no doubled-slug 404s on custom domains).
 */
export function StorefrontBaseProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  return (
    <StorefrontBaseContext.Provider value={basePath}>
      {children}
    </StorefrontBaseContext.Provider>
  );
}

export function useStorefrontBase(): string {
  return useContext(StorefrontBaseContext);
}
