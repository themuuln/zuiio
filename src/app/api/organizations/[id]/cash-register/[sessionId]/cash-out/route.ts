import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { addCashOut } from "@/lib/services/cash-register-service";

// POST /api/organizations/[id]/cash-register/[sessionId]/cash-out — record cash out
export const POST = createRouteHandler(
  async ({ orgId, user, supabase, params, request }) => {
    const body = await request.json();
    const { amount, description } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Amount must be positive",
          },
        },
        { status: 400 },
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Description is required",
          },
        },
        { status: 400 },
      );
    }

    const entry = await addCashOut(
      supabase,
      params.sessionId,
      orgId,
      user.id,
      Number(amount),
      description,
    );

    return NextResponse.json({ data: entry }, { status: 201 });
  },
  { rateLimit: true },
);
