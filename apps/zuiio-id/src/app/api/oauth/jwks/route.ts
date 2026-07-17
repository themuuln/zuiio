import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * GET /api/oauth/jwks
 * JSON Web Key Set — exposes signing keys for token verification.
 * Proxies from Supabase GoTrue's internal JWKS endpoint.
 */
export async function GET() {
  const { url } = getSupabaseEnv();

  try {
    // Supabase GoTrue exposes its JWKS at this path
    const response = await fetch(`${url}/auth/v1/.well-known/jwks.json`, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });

    if (!response.ok) {
      // Fallback: return empty key set with proper structure
      return NextResponse.json(
        { keys: [] },
        {
          headers: {
            "Cache-Control": "public, max-age=300",
            "Content-Type": "application/json",
          },
        },
      );
    }

    const jwks = await response.json();

    return NextResponse.json(jwks, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Type": "application/json",
      },
    });
  } catch {
    // If Supabase is unreachable, return empty keys
    return NextResponse.json(
      { keys: [] },
      {
        headers: {
          "Cache-Control": "public, max-age=60",
          "Content-Type": "application/json",
        },
      },
    );
  }
}
