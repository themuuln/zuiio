import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { updateRuleSchema } from "@/lib/validations";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

type RuleRow = {
  id: string;
  name: string;
  event: string;
  conditions: unknown[];
  actions: unknown[];
  enabled: boolean;
  automation_id: string | null;
  created_at: string;
  updated_at: string;
};

type Rule = {
  id: string;
  name: string;
  event: string;
  conditions: unknown[];
  actions: unknown[];
  enabled: boolean;
  automationId: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapRule(row: RuleRow): Rule {
  return {
    id: row.id,
    name: row.name,
    event: row.event,
    conditions: row.conditions,
    actions: row.actions,
    enabled: row.enabled,
    automationId: row.automation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function PATCH(
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

  const body = await request.json().catch(() => null);
  const parsed = updateRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, event, conditions, actions, enabled, automation_id } = parsed.data;

  const patch: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim().length > 0) {
    patch.name = name.trim();
  }
  if (event) {
    patch.event = event;
  }
  if (conditions) {
    patch.conditions = conditions;
  }
  if (actions) {
    patch.actions = actions;
  }
  if (typeof enabled === "boolean") {
    patch.enabled = enabled;
  }
  if (automation_id !== undefined) {
    patch.automation_id = automation_id;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { id } = await params;
  const url = new URL(`${context.baseUrl}/rules`);
  url.searchParams.set("id", `eq.${id}`);
  url.searchParams.set("select", "id,name,event,conditions,actions,enabled,automation_id,created_at,updated_at");

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
    return NextResponse.json({ error: `Failed to update rule: ${text}` }, { status: 500 });
  }

  const rows = (await response.json()) as RuleRow[];
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Rule not found." }, { status: 404 });
  }

  return NextResponse.json({ rule: mapRule(row) });
}

export async function DELETE(
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

  // First check if the rule exists
  const checkUrl = new URL(`${context.baseUrl}/rules`);
  checkUrl.searchParams.set("id", `eq.${id}`);
  checkUrl.searchParams.set("select", "id");
  checkUrl.searchParams.set("limit", "1");

  const checkResponse = await fetch(checkUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (checkResponse.ok) {
    const existing = (await checkResponse.json()) as { id: string }[];
    if (existing.length === 0) {
      return NextResponse.json({ error: "Rule not found." }, { status: 404 });
    }
  }

  // Delete the rule
  const url = new URL(`${context.baseUrl}/rules`);
  url.searchParams.set("id", `eq.${id}`);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: context.headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Failed to delete rule: ${text}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
