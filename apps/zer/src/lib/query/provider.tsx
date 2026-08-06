"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { indexedDbPersister } from "@zuiio/offline";
import { useRef } from "react";

// Same defaults as @zuiio/query's QueryProvider (staleTime/gcTime), wrapped
// with IndexedDB persistence so the cache survives reloads while offline.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useRef<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 300_000,
        },
      },
    }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient.current}
      persistOptions={{
        persister: indexedDbPersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
