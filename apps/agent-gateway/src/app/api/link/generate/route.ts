import { NextRequest, NextResponse } from "next/server";
import { createShortToken } from "@/lib/tokens";
import { createServiceClient } from "@/lib/supabase";

/**
 * Generate a one-time short link token for Telegram bot linking.
 *
 * POST /api/link/generate
 * Body: { orgId: string, userId: string, productType: "tolom" | "zer" }
 *
 * Returns: { token, telegramUrl } where token is ≤10 chars (Telegram deep link compatible).
 */
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
  const token = await createShortToken(
   supabase,
   body.orgId,
   body.userId,
   body.productType,
  );

  if (!token) {
   return NextResponse.json(
    { error: "Token generation failed" },
    { status: 500 },
   );
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "zuiio_bot";
  const telegramUrl = `https://t.me/${botUsername}?start=${token}`;

  return NextResponse.json({
   token,
   telegramUrl,
   expiresInMinutes: 15,
  });
 } catch (err) {
  console.error("Token generation error:", err);
  return NextResponse.json(
   { error: "Token generation failed" },
   { status: 500 },
  );
 }
}
