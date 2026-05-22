import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getAttachments,
  createAttachment,
  deleteAttachment,
} from "@/lib/services/attachment-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const attachments = await getAttachments(orgId, params.woId);
  return NextResponse.json({ data: attachments });
});

export const POST = createRouteHandler(async ({ request, orgId, user, params }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const body = await request.json();
  const attachment = await createAttachment(orgId, params.woId, body);
  return NextResponse.json({ data: attachment }, { status: 201 });
});

export const DELETE = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { searchParams } = new URL(request.url);
  const attachmentId = searchParams.get("attachmentId");
  if (!attachmentId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "attachmentId is required" } },
      { status: 400 },
    );
  }
  await deleteAttachment(orgId, params.woId, attachmentId);
  return NextResponse.json({ success: true });
});
