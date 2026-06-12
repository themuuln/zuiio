import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { verifyAndClaimClockToken } from "@/lib/services/qr-token-service";

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = (await request.json()) as { rawToken: string };
    if (!body.rawToken) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "rawToken is required" } },
        { status: 400 },
      );
    }

    const verified = await verifyAndClaimClockToken(
      supabase,
      body.rawToken,
      user.id,
    );
    if (!verified.valid) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_TOKEN",
            message: verified.reason ?? "Token is invalid or expired",
          },
        },
        { status: 400 },
      );
    }

    // Step 1: Verify only — return direction and mechanic name for phone confirmation
    // The actual clock-in/out happens in Step 2 when user taps Confirm on the phone
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      data: {
        direction: verified.actionType === "clock_in" ? "in" : "out",
        actionType: verified.actionType,
        mechanicName: profile?.full_name ?? null,
      },
    });
  },
);
