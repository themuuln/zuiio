import { type NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/scim-auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /scim/v2/Groups
 * List groups (organizations) as SCIM groups.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyBearerToken(request);
  if (!auth) {
    return NextResponse.json(
      {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
        scimType: "invalidBearer",
        detail: "Invalid bearer token",
      },
      { status: 401, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const admin = await createAdminClient();
  const params = request.nextUrl.searchParams;
  const count = Math.min(
    100,
    Math.max(1, parseInt(params.get("count") ?? "20", 10)),
  );

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, created_at, updated_at")
    .order("name")
    .limit(count);

  const baseUrl = `${request.nextUrl.origin}/scim/v2`;

  const groups = (orgs ?? []).map((org) => ({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id: org.id,
    displayName: org.name,
    members: [], // Would need to join with org_memberships
    meta: {
      resourceType: "Group",
      created: org.created_at,
      lastModified: org.updated_at,
      location: `${baseUrl}/Groups/${org.id}`,
    },
  }));

  return NextResponse.json(
    {
      schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
      totalResults: groups.length,
      itemsPerPage: count,
      Resources: groups,
    },
    {
      headers: { "Content-Type": "application/scim+json" },
    },
  );
}
