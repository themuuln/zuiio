import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createRuleSchema } from "@/lib/validations";
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

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const url = new URL(`${context.baseUrl}/rules`);
  url.searchParams.set("select", "id,name,event,conditions,actions,enabled,automation_id,created_at,updated_at");
  url.searchParams.set("order", "created_at.desc");

  const response = await fetch(url.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Failed to load rules: ${text}` }, { status: 500 });
  }

  const rows = (await response.json()) as RuleRow[];
  return NextResponse.json({ rules: rows.map(mapRule) });
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

  const body = await request.json().catch(() => null);
  const parsed = createRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, event, conditions, actions, enabled, automation_id } = parsed.data;

  const payload: Record<string, unknown> = {
    name: name.trim(),
    event,
    conditions,
    actions,
    enabled,
  };

  if (automation_id) {
    payload.automation_id = automation_id;
  }

  const url = new URL(`${context.baseUrl}/rules`);
  url.searchParams.set("select", "id,name,event,conditions,actions,enabled,automation_id,created_at,updated_at");

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
    return NextResponse.json({ error: `Failed to create rule: ${text}` }, { status: 500 });
  }

  const rows = (await response.json()) as RuleRow[];
  const row = rows[0];
  return NextResponse.json({ rule: mapRule(row) }, { status: 201 });
}
