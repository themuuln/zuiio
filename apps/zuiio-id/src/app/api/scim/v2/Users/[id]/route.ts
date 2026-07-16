import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyBearerToken } from "@/lib/scim-auth";
import type { ScimUser } from "@/lib/scim-types";

function toScimUser(row: Record<string, unknown>, baseUrl: string): ScimUser {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: row.id as string,
    userName: (row.username as string) ?? "",
    name: {
      givenName: (row.full_name as string)?.split(" ")[0] ?? "",
      familyName: (row.full_name as string)?.split(" ").slice(1).join(" ") ?? "",
      formatted: (row.full_name as string) ?? "",
    },
    displayName: (row.full_name as string) ?? "",
    emails: [{ value: (row.email as string) ?? "", primary: true }],
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
 * GET /scim/v2/Users/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyBearerToken(request);
  if (!auth) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], scimType: "invalidBearer", detail: "Invalid bearer token" },
      { status: 401, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const { id } = await params;
  const admin = await createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, username, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "User not found" },
      { status: 404, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  // Get email from auth.users
  const { data: authUser } = await admin.auth.admin.getUserById(id);
  const email = authUser?.user?.email ?? "";

  const baseUrl = `${request.nextUrl.origin}/scim/v2`;
  return NextResponse.json(toScimUser({ ...data, email } as Record<string, unknown>, baseUrl), {
    headers: { "Content-Type": "application/scim+json" },
  });
}

/**
 * PUT /scim/v2/Users/:id
 * Full user update.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyBearerToken(request);
  if (!auth) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], scimType: "invalidBearer", detail: "Invalid bearer token" },
      { status: 401, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Invalid JSON" },
      { status: 400, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const admin = await createAdminClient();

  // Update profile
  const fullName = (body.name as { formatted?: string })?.formatted ?? body.displayName as string;
  const username = body.userName as string;

  const updates: Record<string, unknown> = {};
  if (fullName) updates.full_name = fullName;
  if (username) updates.username = username;

  if (Object.keys(updates).length > 0) {
    const { error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: error.message },
        { status: 500, headers: { "Content-Type": "application/scim+json" } },
      );
    }
  }

  // Handle active status — ban/unban
  const active = body.active as boolean | undefined;
  if (active === false) {
    await admin.auth.admin.updateUserById(id, { ban_duration: "100y" });
  } else if (active === true) {
    await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
  }

  // Fetch updated profile
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, username, created_at, updated_at")
    .eq("id", id)
    .single();

  const { data: authUser } = await admin.auth.admin.getUserById(id);

  const baseUrl = `${request.nextUrl.origin}/scim/v2`;
  return NextResponse.json(
    toScimUser({ ...data, email: authUser?.user?.email ?? "" } as Record<string, unknown>, baseUrl),
    { headers: { "Content-Type": "application/scim+json" } },
  );
}

/**
 * DELETE /scim/v2/Users/:id
 * Deactivate (soft-delete) a user.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyBearerToken(request);
  if (!auth) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], scimType: "invalidBearer", detail: "Invalid bearer token" },
      { status: 401, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  const { id } = await params;
  const admin = await createAdminClient();

  // Soft-deactivate: ban the user for 100 years (Supabase doesn't have a soft-delete)
  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: "100y",
  });

  if (error) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: error.message },
      { status: 500, headers: { "Content-Type": "application/scim+json" } },
    );
  }

  return new NextResponse(null, { status: 204 });
}
