import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { generateRegistrationToken } from "@/lib/services/qr-token-service";

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = (await request.json()) as { mechanicId: string };
    if (!body.mechanicId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "mechanicId is required" } },
        { status: 400 },
      );
    }

    const token = await generateRegistrationToken(
      supabase,
      orgId,
      body.mechanicId,
    );
    return NextResponse.json({ data: token }, { status: 201 });
  },
  { rateLimit: true },
);
