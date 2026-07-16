import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/oauth/approve
 * Approves an OAuth authorization request and returns the redirect URL with code.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorization_id } = body;

    if (!authorization_id) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the Supabase OAuth approve endpoint
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const approveResponse = await fetch(
      `${supabaseUrl}/auth/v1/oauth/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          authorization_id,
          user_id: session.user.id,
        }),
      },
    );

    if (!approveResponse.ok) {
      const errorData = await approveResponse.text();
      console.error("OAuth approve failed:", errorData);
      return NextResponse.json(
        { error: "Failed to approve consent" },
        { status: 500 },
      );
    }

    const data = await approveResponse.json();

    if (!data.redirect_to) {
      return NextResponse.json(
        { error: "No redirect URL returned" },
        { status: 500 },
      );
    }

    return NextResponse.json({ redirect_to: data.redirect_to });
  } catch (error) {
    console.error("Consent approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
