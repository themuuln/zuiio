import { type NextRequest, NextResponse } from "next/server";
import { retryDueProvisioningJobs } from "@/lib/provisioning";

/** Cron (every ~5 min): retries queued provisioning jobs with backoff. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const processed = await retryDueProvisioningJobs();
  return NextResponse.json({ ok: true, processed });
}
