import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  checkSuperAdmin,
  updateOrgSubscription,
} from "@/lib/services/admin-service";
import { ForbiddenError } from "@/lib/errors";

export const PATCH = createRouteHandler(async ({ request, orgId }) => {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) throw new ForbiddenError();

  const body = await request.json();
  const subscription = await updateOrgSubscription(orgId, body);
  return NextResponse.json({ data: subscription });
});
