"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useRef } from "react";

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
    <QueryClientProvider client={queryClient.current}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
