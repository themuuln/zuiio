"use client";

import type { ReactNode } from "react";
import NuqsProvider from "@/components/nuqs-provider";
import { OfflineBanner } from "@/components/offline-banner";
import { OfflineQueueIndicator } from "@/components/offline-queue-indicator";
import QueryProvider from "@/components/query-provider";
import { MutationQueueProvider } from "@/lib/offline/mutation-queue-provider";

/**
 * Dashboard-only providers — React Query, offline queue, and URL state
 * that are only needed inside the authenticated dashboard shell.
 * Keeps these ~30KB gzipped off public/marketing pages.
 */
export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <NuqsProvider>
      <QueryProvider>
        <MutationQueueProvider>
          <OfflineBanner />
          {children}
          <OfflineQueueIndicator />
        </MutationQueueProvider>
      </QueryProvider>
    </NuqsProvider>
  );
}
