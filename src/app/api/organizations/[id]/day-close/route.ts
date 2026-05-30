import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { closeDay, getDayCloseStatus } from "@/lib/services/day-close-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const status = await getDayCloseStatus(orgId, date);
  return NextResponse.json({ data: status });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const body = await request.json();
  const date = body.date ?? new Date().toISOString().split("T")[0];
  const userId = user.id;

  const result = await closeDay(orgId, userId, date);
  return NextResponse.json({ data: result });
});
