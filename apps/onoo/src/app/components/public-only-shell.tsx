"use client";

import { usePathname } from "next/navigation";

/**
 * Renders children only on public (non-admin) routes.
 * Admin pages at /admin/* have their own nav/header/footer layout.
 */
export function PublicOnlyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return <>{children}</>;
}
