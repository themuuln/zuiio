import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/**
 * Returns a singleton QueryClient per server request or per client session.
 *
 * Server: uses React.cache() so the same instance is shared across all
 * components in the same render pass (prefetch + consume).
 *
 * Client: returns a stable singleton that the Provider also creates, so
 * HydrationBoundary merges dehydrated state into the existing client.
 */
const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    }),
);

export { getQueryClient };
