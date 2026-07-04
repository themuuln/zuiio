import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

type AutomationRow = {
  id: string;
  name: string;
  status: string;
  flow_json: unknown;
  channels: string[];
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth(request);
  if (authError) return authError;

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

  // Fetch the template
  const templateUrl = new URL(`${context.baseUrl}/flow_templates`);
  templateUrl.searchParams.set("select", "id,name,description,flow_json,usage_count");
  templateUrl.searchParams.set("id", `eq.${id}`);
  templateUrl.searchParams.set("limit", "1");

  const templateResponse = await fetch(templateUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (!templateResponse.ok) {
    const text = await templateResponse.text();
    return NextResponse.json({ error: `Failed to load template: ${text}` }, { status: 500 });
  }

  const templateRows = (await templateResponse.json()) as {
    id: string;
    name: string;
    description: string;
    flow_json: unknown;
    usage_count: number;
  }[];

  const template = templateRows[0];
  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  // Deep copy the flow_json to prevent reference sharing
  const flowJsonCopy = JSON.parse(JSON.stringify(template.flow_json ?? { nodes: [], edges: [] }));

  // Create automation with deep-copied flow_json
  const createUrl = new URL(`${context.baseUrl}/automations`);
  createUrl.searchParams.set("select", "id,name,status,flow_json,channels");

  const createResponse = await fetch(createUrl.toString(), {
    method: "POST",
    headers: {
      ...context.headers,
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name: `${template.name}`,
      status: "draft",
      runs: 0,
      ctr: 0,
      trigger: "default",
      trigger_state: "active",
      keywords: [],
      folder: "General",
      flow_json: flowJsonCopy,
      channels: [],
    }),
    cache: "no-store",
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    return NextResponse.json({ error: `Failed to create automation: ${text}` }, { status: 500 });
  }

  const createdRows = (await createResponse.json()) as AutomationRow[];
  const created = createdRows[0];

  // Increment usage_count on the template
  const updateUrl = new URL(`${context.baseUrl}/flow_templates`);
  updateUrl.searchParams.set("id", `eq.${id}`);
  updateUrl.searchParams.set("select", "usage_count");

  await fetch(updateUrl.toString(), {
    method: "PATCH",
    headers: {
      ...context.headers,
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      usage_count: template.usage_count + 1,
    }),
    cache: "no-store",
  });

  return NextResponse.json({ automation: created }, { status: 201 });
}
