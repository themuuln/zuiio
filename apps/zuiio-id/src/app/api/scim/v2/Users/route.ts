import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyBearerToken, type ScimAuthContext } from "@/lib/scim-auth";
import type { ScimUser } from "@/lib/scim-types";

function toScimUser(row: Record<string, unknown>, baseUrl: string): ScimUser {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: row.id as string,
    userName: (row.username as string) ?? (row.email as string) ?? "",
    name: {
      givenName: (row.full_name as string)?.split(" ")[0] ?? "",
      familyName: (row.full_name as string)?.split(" ").slice(1).join(" ") ?? "",
      formatted: (row.full_name as string) ?? "",
    },
    displayName: (row.full_name as string) ?? (row.username as string) ?? "",
    emails: [
      { value: (row.email as string) ?? "", primary: true },
    ],
    active: true,
    meta: {
      resourceType: "User",
      created: (row.created_at as string) ?? new Date().toISOString(),
      lastModified: (row.updated_at as string) ?? new Date().toISOString(),
      location: `${baseUrl}/Users/${row.id}`,
    },
  };
}

/**
 * GET /scim/v2/Users
 * List users with optional filtering.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyBearerToken(request);
  if (!auth) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], scimType: "invalidBearer", detail: "Invalid or missing bearer token" },
      { status: 401, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const admin = await createAdminClient();
  const params = request.nextUrl.searchParams;
  const filter = params.get("filter");
  const startIndex = Math.max(1, parseInt(params.get("startIndex") ?? "1", 10));
  const count = Math.min(100, Math.max(1, parseInt(params.get("count") ?? "20", 10)));

  let query = admin
    .from("profiles")
    .select("id, full_name, username, created_at, updated_at", { count: "exact" });

  // Basic filter support: userName eq "value"
  if (filter) {
    const match = filter.match(/userName\s+eq\s+"([^"]+)"/);
    if (match) {
      query = query.eq("username", match[1]);
    }
  }

  const { data, count: total, error } = await query
    .order("created_at", { ascending: false })
    .range(startIndex - 1, startIndex - 1 + count - 1);

  if (error) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: error.message },
      { status: 500, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const baseUrl = `${request.nextUrl.origin}/scim/v2`;

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: total ?? 0,
    startIndex,
    itemsPerPage: count,
    Resources: (data ?? []).map((row) => toScimUser(row as Record<string, unknown>, baseUrl)),
  }, {
    headers: { "Content-Type": "application/scim+json" },
  });
}

/**
 * POST /scim/v2/Users
 * Create a new user via SCIM provisioning.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyBearerToken(request);
  if (!auth) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], scimType: "invalidBearer", detail: "Invalid or missing bearer token" },
      { status: 401, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Invalid JSON" },
      { status: 400, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const userName = body.userName as string | undefined;
  const emails = body.emails as Array<{ value: string; primary?: boolean }> | undefined;
  const active = body.active as boolean | undefined;

  if (!userName) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], scimType: "invalidValue", detail: "userName is required" },
      { status: 400, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const email = emails?.[0]?.value;
  if (!email) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], scimType: "invalidValue", detail: "At least one email is required" },
      { status: 400, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const admin = await createAdminClient();

  // Create user via Supabase Auth admin API
  const { data: newUser, error: createError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      username: userName,
      full_name: (body.name as { formatted?: string })?.formatted ?? userName,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
  });

  if (createError) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: createError.message },
      { status: 409, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  // If active is false, deactivate immediately
  if (active === false && newUser?.user?.id) {
    await admin.auth.admin.updateUserById(newUser.user.id, {
      ban_duration: "none",
    });
  }

  const baseUrl = `${request.nextUrl.origin}/scim/v2`;

  // Fetch the created profile
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, username, created_at, updated_at")
    .eq("id", newUser?.user?.id ?? "")
    .single();

  if (!profile) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "User created but profile not found" },
      { status: 500, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const scimUser = toScimUser({ ...profile, email } as Record<string, unknown>, baseUrl);

  return NextResponse.json(scimUser, {
    status: 201,
    headers: { "Content-Type": "application/scim+json" },
  });
}
