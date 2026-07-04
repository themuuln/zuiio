import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const VERIFY_TOKEN = Deno.env.get("FB_VERIFY_TOKEN") ?? "my_super_secret_verify_token";
const PAGE_ACCESS_TOKEN = Deno.env.get("FB_PAGE_ACCESS_TOKEN");
const APP_SECRET = Deno.env.get("FB_APP_SECRET");
const GRAPH_API_VERSION = Deno.env.get("FB_GRAPH_API_VERSION") ?? "v25.0";
const FLOW_JSON = Deno.env.get("FB_BOT_FLOW_JSON");
const FALLBACK_MESSAGE = Deno.env.get("FB_FALLBACK_MESSAGE") ?? "Thanks for your message. A team member will reply soon.";

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

type FlowDefinition = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

type FlowContext = {
  fields: Record<string, string>;
  messageText: string;
};

type OutboundMessage =
  | {
      text: string;
      quick_replies?: Array<{
        content_type: "text";
        title: string;
        payload: string;
      }>;
    }
  | {
      attachment: {
        type: "template";
        payload: {
          template_type: "generic";
          elements: Array<{
            title: string;
            subtitle?: string;
            image_url?: string;
            buttons?: Array<
              | { type: "postback"; title: string; payload: string }
              | { type: "web_url"; title: string; url: string }
            >;
          }>;
        };
      };
    };

serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    return handleVerification(url);
  }

  if (req.method === "POST") {
    return handleIncomingEvent(req);
  }

  return new Response("Method Not Allowed", { status: 405 });
});

function handleVerification(url: URL): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    console.log("WEBHOOK_VERIFIED");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

async function handleIncomingEvent(req: Request): Promise<Response> {
  try {
    const bodyText = await req.text();

    if (APP_SECRET) {
      const signature = req.headers.get("x-hub-signature-256");
      if (!signature) {
        console.warn("Missing x-hub-signature-256 header");
        return new Response("Unauthorized", { status: 401 });
      }

      const expectedSignature = await createSha256Signature(APP_SECRET, bodyText);

      if (signature !== expectedSignature) {
        console.warn("Invalid signature. Request rejected.");
        return new Response("Unauthorized", { status: 401 });
      }
    } else {
      console.warn("FB_APP_SECRET is not set. Skipping signature verification.");
    }

    const body = JSON.parse(bodyText);

    if (body.object !== "page") {
      return new Response("Not Found", { status: 404 });
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const events = Array.isArray(entry.messaging) ? entry.messaging : [];

      for (const event of events) {
        const senderPsid: string | undefined = event?.sender?.id;
        const messageText: string | undefined = extractIncomingText(event);

        if (!senderPsid || !messageText) {
          continue;
        }

        console.log(`Incoming message from ${senderPsid}: ${messageText}`);
        const replies = buildRepliesFromFlow(messageText);
        if (replies.length === 0) {
          await sendOutboundMessage(senderPsid, { text: FALLBACK_MESSAGE });
          continue;
        }
        for (const reply of replies.slice(0, 3)) {
          const ok = await sendOutboundMessage(senderPsid, reply);
          if (!ok && "attachment" in reply) {
            await sendOutboundMessage(senderPsid, { text: FALLBACK_MESSAGE });
          }
        }
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function sendOutboundMessage(senderPsid: string, message: OutboundMessage): Promise<boolean> {
  if (!PAGE_ACCESS_TOKEN) {
    console.warn("Missing FB_PAGE_ACCESS_TOKEN. Cannot send reply.");
    return false;
  }

  const fbUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const response = await fetch(fbUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_type: "RESPONSE",
      recipient: { id: senderPsid },
      message,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Failed to send message: ${response.status} ${body}`);
    return false;
  }

  console.log("Message sent successfully.");
  return true;
}

async function createSha256Signature(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256=${signatureHex}`;
}

function buildRepliesFromFlow(messageText: string): OutboundMessage[] {
  const flow = parseFlow(FLOW_JSON);
  if (!flow) {
    return [];
  }

  const nodeMap = new Map(flow.nodes.map((node) => [node.id, node]));
  const startNode = flow.nodes.find((node) => node.type === "start");
  if (!startNode) {
    return [];
  }

  if (!isStartTriggerMatched(startNode, messageText)) {
    return [];
  }

  const context: FlowContext = {
    fields: {
      message: messageText,
      text: messageText,
    },
    messageText,
  };

  const queue = getNextNodeIds(flow.edges, startNode.id, null);
  const visited = new Set<string>();
  const replies: OutboundMessage[] = [];
  const maxSteps = 100;

  let steps = 0;
  while (queue.length > 0 && steps < maxSteps && replies.length < 3) {
    steps += 1;
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) {
      continue;
    }

    const nodeData = (node.data ?? {}) as Record<string, unknown>;
    const nodeType = node.type ?? "";

    if (nodeType === "sendMessage") {
      const msg = asString(nodeData.message);
      if (msg) {
        replies.push({ text: msg });
      }
      queue.push(...getNextNodeIds(flow.edges, node.id, "out"));
      continue;
    }

    if (nodeType === "askQuestion") {
      const question = asString(nodeData.question);
      if (question) {
        const rawButtons = Array.isArray(nodeData.buttons)
          ? nodeData.buttons
          : Array.isArray(nodeData.quickReplies)
            ? nodeData.quickReplies
            : Array.isArray(nodeData.options)
              ? nodeData.options
              : [];
        const quickReplies = rawButtons
          .filter((btn): btn is Record<string, unknown> => !!btn && typeof btn === "object")
          .slice(0, 13)
          .map((btn, idx) => {
            const title = asString(btn.text) || `Option ${idx + 1}`;
            const actionValue = asString(btn.actionValue);
            return {
              content_type: "text" as const,
              title: title.slice(0, 20),
              payload: actionValue || title,
            };
          });

        const questionReply: OutboundMessage = quickReplies.length > 0
          ? { text: question, quick_replies: quickReplies }
          : { text: question };

        console.log(`askQuestion quick replies: ${quickReplies.length}`);
        replies.push(questionReply);
      }
      const saveToField = asString(nodeData.saveToField);
      if (saveToField) {
        context.fields[saveToField] = messageText;
      }
      continue;
    }

    if (nodeType === "condition") {
      const matched = evaluateCondition(nodeData, context);
      const handle = matched ? "yes" : "no";
      const branch = getNextNodeIds(flow.edges, node.id, handle);
      if (branch.length > 0) {
        queue.push(...branch);
      } else {
        queue.push(...getNextNodeIds(flow.edges, node.id, null));
      }
      continue;
    }

    if (nodeType === "setField") {
      const field = asString(nodeData.field);
      const value = asString(nodeData.value);
      if (field) {
        context.fields[field] = value;
      }
      queue.push(...getNextNodeIds(flow.edges, node.id, "out"));
      continue;
    }

    if (nodeType === "cardCarousel") {
      const cards = Array.isArray(nodeData.cards) ? nodeData.cards : [];
      const elements = cards
        .filter((card): card is Record<string, unknown> => !!card && typeof card === "object")
        .slice(0, 10)
        .map((card) => {
          const title = asString(card.title) || "Card";
          const subtitle = asString(card.subtitle);
          const imageUrl = asString(card.imageUrl);
          const rawButtons = Array.isArray(card.buttons) ? card.buttons : [];
          const buttons = rawButtons
            .filter((btn): btn is Record<string, unknown> => !!btn && typeof btn === "object")
            .slice(0, 3)
            .map((btn) => {
              const btnTitle = asString(btn.text) || "Open";
              const btnType = asString(btn.type);
              const btnValue = asString(btn.value);

              if (btnType === "url") {
                return { type: "web_url" as const, title: btnTitle, url: btnValue || "https://example.com" };
              }
              return { type: "postback" as const, title: btnTitle, payload: btnValue || btnTitle };
            });

          const element: {
            title: string;
            subtitle?: string;
            image_url?: string;
            buttons?: Array<
              | { type: "postback"; title: string; payload: string }
              | { type: "web_url"; title: string; url: string }
            >;
          } = { title };

          if (subtitle) {
            element.subtitle = subtitle;
          }
          if (imageUrl) {
            element.image_url = imageUrl;
          }
          if (buttons.length > 0) {
            element.buttons = buttons;
          }
          return element;
        });

      if (elements.length > 0) {
        replies.push({
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements,
            },
          },
        });
      }
      queue.push(...getNextNodeIds(flow.edges, node.id, "out"));
      continue;
    }

    queue.push(...getNextNodeIds(flow.edges, node.id, "out"));
  }

  return replies;
}

function isStartTriggerMatched(startNode: FlowNode, messageText: string): boolean {
  const startData = (startNode.data ?? {}) as Record<string, unknown>;
  const trigger = asString(startData.trigger) || "default";

  if (trigger === "default") return true;
  if (trigger !== "keyword") return true;

  const keywords = extractKeywords(startData);
  if (keywords.length === 0) return false;

  const text = messageText.trim().toLowerCase();
  return keywords.some((keyword) => text.includes(keyword));
}

function extractKeywords(startData: Record<string, unknown>): string[] {
  const raw = startData.keywords;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
      .filter((item) => item.length > 0);
  }

  const keyword = asString(startData.keyword);
  if (!keyword) return [];
  return keyword
    .split(/[,\n]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function parseFlow(raw: string | undefined): FlowDefinition | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<FlowDefinition>;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return null;
    }
    return {
      nodes: parsed.nodes.filter((node): node is FlowNode => !!node && typeof node.id === "string"),
      edges: parsed.edges.filter(
        (edge): edge is FlowEdge => !!edge && typeof edge.source === "string" && typeof edge.target === "string",
      ),
    };
  } catch (error) {
    console.error("Invalid FB_BOT_FLOW_JSON:", error);
    return null;
  }
}

function getNextNodeIds(edges: FlowEdge[], sourceId: string, sourceHandle: string | null): string[] {
  return edges
    .filter((edge) => {
      if (edge.source !== sourceId) {
        return false;
      }
      if (sourceHandle === null) {
        return true;
      }
      return (edge.sourceHandle ?? "out") === sourceHandle;
    })
    .map((edge) => edge.target);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function evaluateCondition(nodeData: Record<string, unknown>, context: FlowContext): boolean {
  const field = asString(nodeData.field);
  const operator = asString(nodeData.operator);
  const value = asString(nodeData.value);

  const leftRaw = field ? context.fields[field] ?? "" : context.messageText;
  const left = leftRaw.toLowerCase();
  const right = value.toLowerCase();

  if (operator === "exists") {
    return left.trim().length > 0;
  }
  if (operator === "equals") {
    return left === right;
  }
  if (operator === "contains") {
    return right.length > 0 && left.includes(right);
  }
  if (operator === "gt") {
    return Number(leftRaw) > Number(value);
  }
  if (operator === "lt") {
    return Number(leftRaw) < Number(value);
  }

  return false;
}

function extractIncomingText(event: Record<string, unknown>): string | undefined {
  const message = event.message as Record<string, unknown> | undefined;
  const postback = event.postback as Record<string, unknown> | undefined;

  const quickReplyPayload =
    message && typeof message.quick_reply === "object" && message.quick_reply
      ? asString((message.quick_reply as Record<string, unknown>).payload)
      : "";
  if (quickReplyPayload) {
    return quickReplyPayload;
  }

  const text = message ? asString(message.text) : "";
  if (text) {
    return text;
  }

  const postbackPayload = postback ? asString(postback.payload) : "";
  if (postbackPayload) {
    return postbackPayload;
  }

  return undefined;
}
