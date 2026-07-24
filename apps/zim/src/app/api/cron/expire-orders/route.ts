import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/** Cron (every ~10 min): expires unpaid orders past their TTL. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const expired = await getDb().expireStaleOrders(new Date().toISOString());
  return NextResponse.json({ ok: true, expired });
}
