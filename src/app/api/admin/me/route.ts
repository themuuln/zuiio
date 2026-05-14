import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { checkSuperAdmin } from "@/lib/services/admin-service";

export const GET = createSimpleRouteHandler(async () => {
  const isSuperAdmin = await checkSuperAdmin();
  return NextResponse.json({ data: { isSuperAdmin } });
});
