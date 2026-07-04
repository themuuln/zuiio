import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

type AutomationSummary = {
  id: string;
  name: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  deliveryRate: number | null;
  openRate: number | null;
  clickRate: number | null;
};

type AutomationRow = {
  id: string;
  name: string;
};

type MessageLogRow = {
  automation_id: string | null;
  status: string;
};

function calculateRate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return numerator / denominator;
}

function getPeriodDate(period: string): Date | null {
  if (period === "7d") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "30d") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null;
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

  const period = request.nextUrl.searchParams.get("period")?.trim() || "";
  const periodDate = getPeriodDate(period);

  // Fetch all automations (id, name)
  const automationsUrl = new URL(`${context.baseUrl}/automations`);
  automationsUrl.searchParams.set("select", "id,name");
  automationsUrl.searchParams.set("limit", "1000");

  const automationsResponse = await fetch(automationsUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (!automationsResponse.ok) {
    const text = await automationsResponse.text();
    return NextResponse.json(
      { error: `Failed to load automations: ${text}` },
      { status: 500 },
    );
  }

  const automations = (await automationsResponse.json()) as AutomationRow[];

  // Fetch message_logs (automation_id, status) with optional period filter
  const logsUrl = new URL(`${context.baseUrl}/message_logs`);
  logsUrl.searchParams.set("select", "automation_id,status");
  logsUrl.searchParams.set("limit", "100000");

  if (periodDate) {
    logsUrl.searchParams.set("sent_at", `gte.${periodDate.toISOString()}`);
  }

  const logsResponse = await fetch(logsUrl.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (!logsResponse.ok) {
    const text = await logsResponse.text();
    return NextResponse.json(
      { error: `Failed to load message logs: ${text}` },
      { status: 500 },
    );
  }

  const logs = (await logsResponse.json()) as MessageLogRow[];

  // Aggregate counts per automation by status
  const counts = new Map<string, { sent: number; delivered: number; opened: number; clicked: number }>();

  const validStatuses = new Set(["sent", "delivered", "opened", "clicked"]);

  for (const log of logs) {
    if (!log.automation_id) continue;
    if (!validStatuses.has(log.status)) continue;

    let entry = counts.get(log.automation_id);
    if (!entry) {
      entry = { sent: 0, delivered: 0, opened: 0, clicked: 0 };
      counts.set(log.automation_id, entry);
    }

    // Count each status occurrence (a message_logs row has one status)
    switch (log.status) {
      case "sent":
        entry.sent++;
        break;
      case "delivered":
        entry.delivered++;
        break;
      case "opened":
        entry.opened++;
        break;
      case "clicked":
        entry.clicked++;
        break;
    }
  }

  // Build automation summaries
  const summaries: AutomationSummary[] = automations.map((auto) => {
    const c = counts.get(auto.id) ?? { sent: 0, delivered: 0, opened: 0, clicked: 0 };
    return {
      id: auto.id,
      name: auto.name,
      sent: c.sent,
      delivered: c.delivered,
      opened: c.opened,
      clicked: c.clicked,
      deliveryRate: calculateRate(c.delivered, c.sent),
      openRate: calculateRate(c.opened, c.delivered),
      clickRate: calculateRate(c.clicked, c.opened),
    };
  });

  // Calculate totals across all automations
  const totals = summaries.reduce(
    (acc, auto) => ({
      sent: acc.sent + auto.sent,
      delivered: acc.delivered + auto.delivered,
      opened: acc.opened + auto.opened,
      clicked: acc.clicked + auto.clicked,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0 },
  );

  return NextResponse.json({ automations: summaries, totals });
}
