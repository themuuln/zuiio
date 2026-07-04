import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PAGE_ACCESS_TOKEN = Deno.env.get("FB_PAGE_ACCESS_TOKEN");
const GRAPH_API_VERSION = Deno.env.get("FB_GRAPH_API_VERSION") ?? "v25.0";
const BATCH_LIMIT = 50;

type FlowNode = {
  id: string;
  type?: string;
  data?: Record<string, unknown>;
};

type FlowEdge = {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
};

type FlowContext = {
  fields: Record<string, string>;
  messageText: string;
  senderPsid: string;
};

type OutboundMessage = { text: string } | { attachment: { type: string; payload: Record<string, unknown> } };

serve(async (_req: Request) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase not configured");
      return new Response("Supabase not configured", { status: 500 });
    }

    const due = await fetchPending();
    console.log(`Processing ${due.length} due scheduled messages`);

    let processed = 0;
    let failed = 0;

    for (const msg of due) {
      try {
        await markProcessing(msg.id);
        const success = await executeScheduled(msg);
        if (success) {
          await markCompleted(msg.id);
          processed++;
        } else {
          await handleFailure(msg);
          failed++;
        }
      } catch (err) {
        console.error(`Failed to process ${msg.id}:`, err);
        await handleFailure(msg);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Scheduled processor error:", err);
    return new Response("Internal Error", { status: 500 });
  }
});

async function fetchPending(): Promise<ScheduledMessage[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/scheduled_messages`);
  url.searchParams.set("select", "*");
  url.searchParams.set("status", "eq.pending");
  url.searchParams.set("execute_at", `lte.${new Date().toISOString()}`);
  url.searchParams.set("limit", String(BATCH_LIMIT));
  url.searchParams.set("order", "execute_at.asc");

  const resp = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!resp.ok) {
    console.error(`Fetch scheduled failed: ${resp.status}`);
    return [];
  }

  const rows = await resp.json();
  return Array.isArray(rows) ? rows : [];
}

async function markProcessing(id: string) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/scheduled_messages`);
  url.searchParams.set("id", `eq.${id}`);
  await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "processing" }),
  });
}

async function markCompleted(id: string) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/scheduled_messages`);
  url.searchParams.set("id", `eq.${id}`);
  await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "completed" }),
  });
}

async function handleFailure(msg: ScheduledMessage) {
  const newRetryCount = (msg.retry_count ?? 0) + 1;
  const status = newRetryCount >= (msg.max_retries ?? 3) ? "failed" : "pending";
  const newExecuteAt = status === "pending"
    ? new Date(Date.now() + Math.pow(2, newRetryCount) * 60 * 1000).toISOString()
    : msg.execute_at;

  const url = new URL(`${SUPABASE_URL}/rest/v1/scheduled_messages`);
  url.searchParams.set("id", `eq.${msg.id}`);
  await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status,
      retry_count: newRetryCount,
      execute_at: newExecuteAt,
      last_error: `Failed after ${newRetryCount} attempts`,
    }),
  });
}

async function executeScheduled(msg: ScheduledMessage): Promise<boolean> {
  const flow = parseFlow(msg);
  if (!flow) return false;

  const context: FlowContext = {
    fields: (msg.context as { fields?: Record<string, string> })?.fields ?? {},
    messageText: "",
    senderPsid: msg.sender_psid,
  };

  const nodeMap = new Map(flow.nodes.map((n) => [n.id, n]));
  const startNode = flow.nodes.find((n) => n.type === "start");

  const queue: string[] = [msg.current_node_id];
  const visited = new Set<string>();
  const replies: OutboundMessage[] = [];
  const maxSteps = 100;
  let steps = 0;
  let hasReplies = false;

  while (queue.length > 0 && steps < maxSteps && replies.length < 3) {
    steps++;
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const nodeData = (node.data ?? {}) as Record<string, unknown>;
    const nodeType = node.type ?? "";

    if (nodeType === "sendMessage") {
      const msgText = asString(nodeData.message);
      if (msgText) {
        replies.push({ text: msgText });
        hasReplies = true;
      }
      queue.push(...getNextNodeIds(flow.edges, node.id, "out"));
      continue;
    }

    if (nodeType === "askQuestion") {
      const question = asString(nodeData.question);
      if (question) replies.push({ text: question });
      hasReplies = true;
      continue;
    }

    if (nodeType === "condition") {
      if (startNode && isKeywordTrigger(startNode, context.fields)) {
        const branch = getNextNodeIds(flow.edges, node.id, "yes");
        queue.push(...(branch.length > 0 ? branch : getNextNodeIds(flow.edges, node.id, null)));
      } else {
        const branch = getNextNodeIds(flow.edges, node.id, "no");
        queue.push(...(branch.length > 0 ? branch : getNextNodeIds(flow.edges, node.id, null)));
      }
      continue;
    }

    if (nodeType === "setField") {
      const field = asString(nodeData.field);
      const value = asString(nodeData.value);
      if (field) context.fields[field] = value;
      queue.push(...getNextNodeIds(flow.edges, node.id, "out"));
      continue;
    }

    if (nodeType === "cardCarousel") {
      hasReplies = true;
      queue.push(...getNextNodeIds(flow.edges, node.id, "out"));
      continue;
    }

    queue.push(...getNextNodeIds(flow.edges, node.id, "out"));
  }

  if (hasReplies && PAGE_ACCESS_TOKEN) {
    for (const reply of replies.slice(0, 3)) {
      const fbUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
      const resp = await fetch(fbUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_type: "RESPONSE",
          recipient: { id: msg.sender_psid },
          message: reply,
        }),
      });
      if (!resp.ok) {
        const body = await resp.text();
        console.error(`Scheduled send failed: ${resp.status} ${body}`);
        return false;
      }
    }
  }

  return true;
}

type ScheduledMessage = {
  id: string;
  sender_psid: string;
  flow_json: unknown;
  current_node_id: string;
  context: unknown;
  execute_at: string;
  status: string;
  retry_count: number;
  max_retries: number;
};

function parseFlow(msg: ScheduledMessage) {
  const raw = msg.flow_json as { nodes?: FlowNode[]; edges?: FlowEdge[] } | null;
  if (!raw || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) return null;
  return {
    nodes: raw.nodes.filter((n): n is FlowNode => !!n && typeof n.id === "string"),
    edges: raw.edges.filter((e): e is FlowEdge => !!e && typeof e.source === "string" && typeof e.target === "string"),
    id: msg.id,
  };
}

function getNextNodeIds(edges: FlowEdge[], sourceId: string, sourceHandle: string | null): string[] {
  return edges
    .filter((e) => {
      if (e.source !== sourceId) return false;
      if (sourceHandle === null) return true;
      return (e.sourceHandle ?? "out") === sourceHandle;
    })
    .map((e) => e.target);
}

function isKeywordTrigger(startNode: FlowNode, fields: Record<string, string>): boolean {
  const d = (startNode.data ?? {}) as Record<string, unknown>;
  const fieldName = asString(d.field);
  if (!fieldName) return false;
  const val = fields[fieldName] ?? "";
  return val.trim().length > 0;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
