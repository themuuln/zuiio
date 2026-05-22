import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  getAttachments,
  createAttachment,
  deleteAttachment,
} from "@/lib/services/attachment-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ params, orgId }) => {
  const { workOrderId } = params;
  const data = await getAttachments(orgId, workOrderId);
  return NextResponse.json({ data });
});

export const POST = createRouteHandler(async ({ request, params, orgId }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { workOrderId } = params;
  const body = await request.json();
  const attachment = await createAttachment(orgId, workOrderId, body);
  return NextResponse.json({ data: attachment }, { status: 201 });
});

export const DELETE = createRouteHandler(async ({ request, params, orgId }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { workOrderId } = params;
  const { searchParams } = new URL(request.url);
  const attachmentId = searchParams.get("attachmentId");
  if (!attachmentId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "attachmentId query param required" } },
      { status: 400 },
    );
  }
  await deleteAttachment(orgId, workOrderId, attachmentId);
  return NextResponse.json({ data: null });
});
