import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

const FALLBACK_MESSAGE = process.env.FB_FALLBACK_MESSAGE ?? "Thanks for your message. A team member will reply soon.";
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION ?? "v25.0";
const BATCH_LIMIT = 50;

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rateCheck = checkRateLimit(ip, 5, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  if (!PAGE_ACCESS_TOKEN) {
    return NextResponse.json({ error: "FB_PAGE_ACCESS_TOKEN not set" }, { status: 500 });
  }

  try {
    const due = await fetchDueScheduled(context);
    console.log(`[cron] Processing ${due.length} due scheduled messages`);

    let processed = 0;
    let failed = 0;

    for (const msg of due) {
      try {
        await updateScheduledStatus(context, msg.id, "processing");
        const ok = await executeScheduledFlow(context, msg, PAGE_ACCESS_TOKEN, FALLBACK_MESSAGE);
        if (ok) {
          await updateScheduledStatus(context, msg.id, "completed");
          processed++;
        } else {
          await handleScheduledFailure(context, msg);
          failed++;
        }
      } catch {
        await handleScheduledFailure(context, msg);
        failed++;
      }
    }

    return NextResponse.json({ processed, failed, total: due.length });
  } catch (err) {
    console.error("[cron] Scheduled processor error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function fetchDueScheduled(context: { baseUrl: string; headers: Record<string, string> }) {
  const url = new URL(`${context.baseUrl}/scheduled_messages`);
  url.searchParams.set("select", "*");
  url.searchParams.set("status", "eq.pending");
  url.searchParams.set("execute_at", `lte.${new Date().toISOString()}`);
  url.searchParams.set("limit", String(BATCH_LIMIT));
  url.searchParams.set("order", "execute_at.asc");

  const resp = await fetch(url.toString(), {
    headers: context.headers,
    cache: "no-store",
  });

  if (!resp.ok) return [];
  const rows = await resp.json();
  return Array.isArray(rows) ? rows : [];
}

async function updateScheduledStatus(
  context: { baseUrl: string; headers: Record<string, string> },
  id: string,
  status: string,
) {
  const url = new URL(`${context.baseUrl}/scheduled_messages`);
  url.searchParams.set("id", `eq.${id}`);
  await fetch(url.toString(), {
    method: "PATCH",
    headers: context.headers,
    body: JSON.stringify({ status }),
  });
}

async function handleScheduledFailure(
  context: { baseUrl: string; headers: Record<string, string> },
  msg: { id: string; retry_count?: number; max_retries?: number; execute_at: string },
) {
  const newRetryCount = (msg.retry_count ?? 0) + 1;
  const maxRetries = msg.max_retries ?? 3;
  const status = newRetryCount >= maxRetries ? "failed" : "pending";
  const newExecuteAt = status === "pending"
    ? new Date(Date.now() + Math.pow(2, newRetryCount) * 60_000).toISOString()
    : msg.execute_at;

  const url = new URL(`${context.baseUrl}/scheduled_messages`);
  url.searchParams.set("id", `eq.${msg.id}`);
  await fetch(url.toString(), {
    method: "PATCH",
    headers: context.headers,
    body: JSON.stringify({
      status,
      retry_count: newRetryCount,
      last_error: `Failed after ${newRetryCount} attempts`,
      execute_at: newExecuteAt,
    }),
  });
}

async function executeScheduledFlow(
  context: { baseUrl: string; headers: Record<string, string> },
  msg: {
    id: string;
    sender_psid: string;
    flow_json: unknown;
    current_node_id: string;
    context: unknown;
  },
  pageAccessToken: string,
  fallbackMessage: string,
): Promise<boolean> {
  const flowJson = msg.flow_json as { nodes?: Array<{ id: string; type?: string; data?: Record<string, unknown> }>; edges?: Array<{ source: string; target: string; sourceHandle?: string | null }> } | null;
  if (!flowJson?.nodes || !flowJson?.edges) return false;

  const nodeMap = new Map(flowJson.nodes.map((n) => [n.id, n]));
  const queue: string[] = [msg.current_node_id];
  const visited = new Set<string>();
  const sentMessages: string[] = [];

  let steps = 0;
  while (queue.length > 0 && steps < 100 && sentMessages.length < 3) {
    steps++;
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const nodeData = (node.data ?? {}) as Record<string, unknown>;
    const nodeType = node.type ?? "";

    if (nodeType === "sendMessage") {
      const text = typeof nodeData.message === "string" ? nodeData.message.trim() : "";
      if (text) sentMessages.push(text);
      queue.push(...getNextEdgeTargets(flowJson.edges, node.id, "out"));
      continue;
    }

    if (nodeType === "askQuestion") {
      const question = typeof nodeData.question === "string" ? nodeData.question.trim() : "";
      if (question) sentMessages.push(question);
      // askQuestion pauses execution waiting for a user reply — don't traverse further.
      continue;
    }

    if (nodeType === "cardCarousel") {
      sentMessages.push("[Carousel]");
      queue.push(...getNextEdgeTargets(flowJson.edges, node.id, "out"));
      continue;
    }

    // Condition nodes use "yes"/"no" source handles, not "out".
    // Pass null to follow all outgoing edges regardless of handle.
    if (nodeType === "condition") {
      queue.push(...getNextEdgeTargets(flowJson.edges, node.id, null));
      continue;
    }

    queue.push(...getNextEdgeTargets(flowJson.edges, node.id, "out"));
  }

  if (sentMessages.length === 0) {
    sentMessages.push(fallbackMessage);
  }

  for (const text of sentMessages) {
    const ok = await sendFacebookMessage(msg.sender_psid, text, pageAccessToken);
    if (!ok) return false;
  }

  return true;
}

function getNextEdgeTargets(
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>,
  sourceId: string,
  sourceHandle: string | null,
): string[] {
  return edges
    .filter((e) => {
      if (e.source !== sourceId) return false;
      if (sourceHandle === null) return true;
      return (e.sourceHandle ?? "out") === sourceHandle;
    })
    .map((e) => e.target);
}

async function sendFacebookMessage(psid: string, text: string, pageAccessToken: string): Promise<boolean> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${pageAccessToken}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_type: "RESPONSE",
      recipient: { id: psid },
      message: { text },
    }),
  });
  return resp.ok;
}
