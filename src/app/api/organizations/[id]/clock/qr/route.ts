import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { generateClockToken } from "@/lib/services/qr-token-service";

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = (await request.json()) as {
      actionType: "clock_in" | "clock_out";
    };
    if (
      !body.actionType ||
      !["clock_in", "clock_out"].includes(body.actionType)
    ) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "actionType must be 'clock_in' or 'clock_out'",
          },
        },
        { status: 400 },
      );
    }

    const token = await generateClockToken(supabase, orgId, body.actionType);
    return NextResponse.json({ data: token }, { status: 201 });
  },
  { rateLimit: true },
);
