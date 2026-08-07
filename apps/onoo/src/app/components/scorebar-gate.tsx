"use client";

import { usePathname } from "next/navigation";

// Internal/authenticated surfaces that render their own chrome and should not
// show the public score ticker.
const HIDDEN_PREFIXES = ["/admin", "/tracker"];

/**
 * Hides its children on internal routes. Lives client-side because the root
 * layout is a Server Component and can't read the pathname (there is no
 * middleware exposing it). The wrapped Scorebar still renders on the server for
 * these routes; the query cost is negligible on low-traffic admin pages.
 */
export function ScorebarGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hidden = HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (hidden) return null;
  return <>{children}</>;
}
