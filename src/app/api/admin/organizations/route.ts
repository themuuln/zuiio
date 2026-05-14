import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ForbiddenError } from "@/lib/errors";
import {
  checkSuperAdmin,
  listOrganizations,
} from "@/lib/services/admin-service";

export const GET = createSimpleRouteHandler(async () => {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) throw new ForbiddenError();

  const orgs = await listOrganizations();
  return NextResponse.json({ data: orgs });
});
