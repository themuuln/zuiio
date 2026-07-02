import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { closeSession } from "@/lib/services/cash-register-service";

// POST /api/organizations/[id]/cash-register/[sessionId]/close — close session
export const POST = createRouteHandler(
  async ({ orgId, user, supabase, params, request }) => {
    const body = await request.json();
    const { closing_balance, note } = body;

    if (closing_balance === undefined || closing_balance === null) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Closing balance is required",
          },
        },
        { status: 400 },
      );
    }

    const session = await closeSession(
      supabase,
      params.sessionId,
      orgId,
      user.id,
      Number(closing_balance),
      note,
    );

    return NextResponse.json({ data: session });
  },
  { rateLimit: true },
);
