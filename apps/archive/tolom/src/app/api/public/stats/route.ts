import { capture } from "@zuiio/capture";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";

export const GET = createSimpleRouteHandler(
  async ({ supabase }) => {
    const { data, error } = await supabase.rpc("get_public_stats");

    if (error) {
      // During prerendering with Cache Components, fetch() rejects when
      // the prerender is complete. Return empty stats gracefully —
      // build-time prerendering doesn't need real data.
      if (String(error?.message ?? "").includes("prerender")) {
        return ok(null, {
          headers: {
            "Cache-Control":
              "public, s-maxage=600, stale-while-revalidate=3600",
          },
        });
      }

      capture(error, { context: "public stats" });
      return apiError("INTERNAL", "Failed to fetch stats", 500);
    }
    return ok(data, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  },
  { requireAuth: false },
);
