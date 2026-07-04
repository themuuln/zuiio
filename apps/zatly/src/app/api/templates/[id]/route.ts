import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";
import { mapTemplate, type TemplateRow } from "@/lib/template-types";

const VALID_CATEGORIES = ["welcome", "support", "sales", "notifications", "general"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  // Get the authenticated user's ID
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const { id } = await params;

  // Validate UUID format — return 404 for invalid IDs before querying Supabase
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  // First fetch the template to check if it exists and is not built-in
  const checkUrl = new URL(`${context.baseUrl}/flow_templates`);
  checkUrl.searchParams.set("select", "id,is_builtin,user_id");
  checkUrl.searchParams.set("id", `eq.${id}`);
  checkUrl.searchParams.set("limit", "1");

  const checkResponse = await fetch(checkUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (!checkResponse.ok) {
    const text = await checkResponse.text();
    return NextResponse.json({ error: `Failed to check template: ${text}` }, { status: 500 });
  }

  const existing = (await checkResponse.json()) as { id: string; is_builtin: boolean; user_id: string | null }[];
  if (existing.length === 0) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const template = existing[0];
  if (template.is_builtin) {
    return NextResponse.json({ error: "Cannot modify a built-in template." }, { status: 403 });
  }

  // Ownership check: only the template owner can modify it
  if (!userId || template.user_id !== userId) {
    return NextResponse.json({ error: "You do not have permission to modify this template." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim().length > 0) {
    patch.name = body.name.trim();
  }
  if (typeof body.description === "string") {
    patch.description = body.description.trim();
  }
  if (typeof body.category === "string" && body.category.trim().length > 0) {
    const cat = body.category.trim();
    if (!VALID_CATEGORIES.includes(cat)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 },
      );
    }
    patch.category = cat;
  }
  if (Array.isArray(body.channels)) {
    patch.channels = body.channels;
  }
  if (body.flow_json !== undefined) {
    patch.flow_json = body.flow_json;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const url = new URL(`${context.baseUrl}/flow_templates`);
  url.searchParams.set("id", `eq.${id}`);
  url.searchParams.set("select", "*");

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      ...context.headers,
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Failed to update template: ${text}` }, { status: 500 });
  }

  const rows = (await response.json()) as TemplateRow[];
  const row = rows[0];
  return NextResponse.json({ template: mapTemplate(row) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  // Get the authenticated user's ID
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const { id } = await params;

  // Validate UUID format — return 404 for invalid IDs before querying Supabase
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  // First check if the template exists and is not built-in
  const checkUrl = new URL(`${context.baseUrl}/flow_templates`);
  checkUrl.searchParams.set("select", "id,is_builtin,user_id");
  checkUrl.searchParams.set("id", `eq.${id}`);
  checkUrl.searchParams.set("limit", "1");

  const checkResponse = await fetch(checkUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (!checkResponse.ok) {
    const text = await checkResponse.text();
    return NextResponse.json({ error: `Failed to check template: ${text}` }, { status: 500 });
  }

  const existing = (await checkResponse.json()) as { id: string; is_builtin: boolean; user_id: string | null }[];
  if (existing.length === 0) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const template = existing[0];
  if (template.is_builtin) {
    return NextResponse.json({ error: "Cannot delete a built-in template." }, { status: 403 });
  }

  // Ownership check: only the template owner can delete it
  if (!userId || template.user_id !== userId) {
    return NextResponse.json({ error: "You do not have permission to delete this template." }, { status: 403 });
  }

  const url = new URL(`${context.baseUrl}/flow_templates`);
  url.searchParams.set("id", `eq.${id}`);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: context.headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Failed to delete template: ${text}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
