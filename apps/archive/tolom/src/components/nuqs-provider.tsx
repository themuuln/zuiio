"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

/**
 * URL state provider for Next.js App Router.
 * Wraps nuqs adapter — place inside the client component tree.
 */
export default function NuqsProvider({ children }: { children: ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
