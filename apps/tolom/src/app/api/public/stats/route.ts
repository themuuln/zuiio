import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError } from "@/lib/api-response";
export const GET = createSimpleRouteHandler(
  async ({ supabase }) => {
    const { data, error } = await supabase.rpc("get_public_stats");

    if (error) {
      capture(error, { context: "public stats" });
      return apiError("INTERNAL", "Failed to fetch stats", 500);
    }
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  },
  { requireAuth: false },
);
