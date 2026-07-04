import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";
import { mapTemplate, type TemplateRow } from "@/lib/template-types";

const VALID_CATEGORIES = ["welcome", "support", "sales", "notifications", "general"];

export async function GET(request: NextRequest) {
  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const category = request.nextUrl.searchParams.get("category")?.trim() || "";
  const channel = request.nextUrl.searchParams.get("channel")?.trim() || "";

  // Optional auth check: try to get the authenticated user
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      userId = data.user.id;
    }
  } catch {
    // Not authenticated — proceed with limited access
  }

  const url = new URL(`${context.baseUrl}/flow_templates`);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "created_at.desc");

  if (userId) {
    // Authenticated: return built-in templates + user's own templates
    url.searchParams.set("or", `(is_builtin.eq.true,user_id.eq.${userId})`);
  } else {
    // Unauthenticated: return only built-in templates
    url.searchParams.set("is_builtin", "eq.true");
  }

  if (category) {
    url.searchParams.set("category", `eq.${category}`);
  }
  if (channel) {
    url.searchParams.set("channels", `cs.{${channel}}`);
  }

  const response = await fetch(url.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Failed to load templates: ${text}` }, { status: 500 });
  }

  const rows = (await response.json()) as TemplateRow[];
  return NextResponse.json({ templates: rows.map(mapTemplate) });
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Validate required fields
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (name.length > 200) {
    return NextResponse.json({ error: "Name must be at most 200 characters." }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";

  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!category) {
    return NextResponse.json({ error: "Category is required." }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }

  const channels = Array.isArray(body.channels) ? body.channels : [];
  const flow_json = body.flow_json ?? { nodes: [], edges: [] };

  // Get the authenticated user
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = {
    name,
    description,
    category,
    channels,
    flow_json,
    is_builtin: false,
    usage_count: 0,
    user_id: userId,
  };

  const url = new URL(`${context.baseUrl}/flow_templates`);
  url.searchParams.set("select", "*");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      ...context.headers,
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Failed to create template: ${text}` }, { status: 500 });
  }

  const rows = (await response.json()) as TemplateRow[];
  const row = rows[0];
  return NextResponse.json({ template: mapTemplate(row) }, { status: 201 });
}
