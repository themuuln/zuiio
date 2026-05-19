import { NextResponse } from "next/server";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export const GET = createPortalRouteHandler(async ({ customer }) => {
  return NextResponse.json({ data: customer });
});
