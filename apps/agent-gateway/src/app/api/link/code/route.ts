import { NextRequest, NextResponse } from "next/server";
import { createLinkCode } from "@/lib/link-code";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      orgId: string;
      userId: string;
      productType: string;
    };

    if (!body.orgId || !body.userId || !body.productType) {
      return NextResponse.json(
        { error: "orgId, userId, and productType are required" },
        { status: 400 },
      );
    }

    if (!["tolom", "zer"].includes(body.productType)) {
      return NextResponse.json(
        { error: "productType must be 'tolom' or 'zer'" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const result = await createLinkCode(
      supabase,
      body.orgId,
      body.userId,
      body.productType,
    );

    if (!result) {
      return NextResponse.json(
        { error: "Code generation failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      code: result.code,
      formatted: result.formatted,
      expiresInMinutes: 10,
    });
  } catch (err) {
    console.error("Code generation error:", err);
    return NextResponse.json(
      { error: "Code generation failed" },
      { status: 500 },
    );
  }
}
