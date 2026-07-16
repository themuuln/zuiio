import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/oauth/deny
 * Denies an OAuth authorization request and returns the redirect URL with error.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorization_id } = body;

    if (!authorization_id) {
      return NextResponse.json(
        { error: "Missing authorization_id" },
        { status: 400 },
      );
    }

    // Call the Supabase OAuth deny endpoint
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const denyResponse = await fetch(`${supabaseUrl}/auth/v1/oauth/deny`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        authorization_id,
      }),
    });

    if (!denyResponse.ok) {
      const errorData = await denyResponse.text();
      console.error("OAuth deny failed:", errorData);
      return NextResponse.json(
        { error: "Failed to deny consent" },
        { status: 500 },
      );
    }

    const data = await denyResponse.json();

    if (!data.redirect_to) {
      return NextResponse.json(
        { error: "No redirect URL returned" },
        { status: 500 },
      );
    }

    return NextResponse.json({ redirect_to: data.redirect_to });
  } catch (error) {
    console.error("Consent deny error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
