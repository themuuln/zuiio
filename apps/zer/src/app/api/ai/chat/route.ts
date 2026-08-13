import { createHash } from "node:crypto";
import { type Message, runWithTools } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createStorefrontAgentTools } from "@/lib/agent-tools/storefront";
import { createClient } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOTAL_CHARS = 12_000; // ~3K input tokens per conversation
const DEFAULT_MAX_TOKENS = 1024; // output tokens per agent round
const MAX_ROUNDS = 4;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const CONFIG_ERROR = "AI туслах тохиргоогүй байна.";
const GENERIC_ERROR = "Хариулт авахад алдаа гарлаа. Дахин оролдоно уу.";
const RATE_LIMIT_ERROR =
  "Хэт олон хүсэлт илгээсэн байна. Түр хүлээгээд дахин оролдоно уу.";

type ChatRole = "user" | "assistant";

/**
 * POST /api/ai/chat
 *
 * Public AI shopping assistant for a storefront. Takes the org slug,
 * prior user/assistant messages, and the storefront origin (so product
 * links point at the domain the buyer is actually browsing). Runs the
 * agent with storefront-safe tools against the PUBLIC catalog RPCs only —
 * no service role, no merchant data.
 */
export async function POST(request: Request) {
  let body: {
    slug?: unknown;
    messages?: unknown;
    baseUrl?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Буруу хүсэлт." }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug || slug.length > 64 || !/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Буруу дэлгүүр." }, { status: 400 });
  }

  const messages = parseMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "Буруу мессеж формат." },
      { status: 400 },
    );
  }

  const baseUrl = sanitizeBaseUrl(body.baseUrl);

  // Per-IP in-memory rate limit — cheap fast path for obvious floods.
  // The durable check below is the source of truth across instances.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 });
  }

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, currency, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!org) {
    return NextResponse.json({ error: "Дэлгүүр олдсонгүй." }, { status: 404 });
  }

  // Durable shared guard: per-IP 60s window + per-org 24h token budget in
  // one atomic RPC. Unlike the in-memory limiter this survives cold starts
  // and holds across ALL serverless instances, so a bot farm that spreads
  // requests across IPs still hits the org budget. On RPC failure we fall
  // back to the in-memory limiter rather than blocking legit buyers.
  const maxTokens = clamp(
    Number(process.env.AI_CHAT_MAX_TOKENS) || DEFAULT_MAX_TOKENS,
    256,
    4096,
  );
  const ipHash = hashIp(ip);
  const estimatedTokens = estimateTokens(messages, maxTokens, MAX_ROUNDS);

  try {
    const { data, error } = await supabase.rpc("record_ai_chat_request", {
      p_org_slug: slug,
      p_ip_hash: ipHash,
      p_estimated_tokens: estimatedTokens,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : undefined;
    if (row && !row.allowed) {
      return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 });
    }
  } catch (err) {
    capture(err, { context: "api/ai/chat/rate-limit" });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: CONFIG_ERROR }, { status: 503 });
  }

  // Stream the agent's reply as SSE: each model text delta is forwarded
  // live (tool rounds emit no text, so buyers see the final answer appear).
  // Client disconnect aborts the upstream DeepSeek request so no tokens
  // are spent generating a reply nobody receives.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );

      try {
        const systemPrompt = buildSystemPrompt(
          org.name ?? org.slug,
          org.currency ?? "MNT",
          slug,
          baseUrl,
        );
        const tools = createStorefrontAgentTools(supabase, slug, baseUrl);

        const last = messages[messages.length - 1];
        const history = messages.slice(0, -1).map(toAgentMessage);

        let reply = "";
        const replyText = await runWithTools({
          apiKey,
          systemPrompt,
          userMessage: last.content,
          conversationHistory: history,
          tools,
          maxRounds: MAX_ROUNDS,
          maxTokens,
          signal: request.signal,
          onToken: (delta) => {
            reply += delta;
            send({ token: delta });
          },
        });

        // Empty (non-streaming fallback or token-less edge): still deliver.
        if (!reply) reply = replyText;
        send({ done: true, reply });
        controller.close();
      } catch (err) {
        // Client went away — stop; the upstream fetch already aborted via
        // request.signal. Nothing to deliver.
        if (request.signal.aborted) {
          try {
            controller.close();
          } catch {
            // already closed
          }
          return;
        }
        capture(err, { context: "api/ai/chat" });
        try {
          send({ error: GENERIC_ERROR });
          controller.close();
        } catch {
          // stream already closed by the client
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseMessages(
  value: unknown,
): { role: ChatRole; content: string }[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) {
    return null;
  }

  const messages: { role: ChatRole; content: string }[] = [];
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("role" in item) ||
      !("content" in item)
    ) {
      return null;
    }
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.trim().length === 0) {
      return null;
    }
    if (content.length > MAX_MESSAGE_LENGTH) return null;
    messages.push({ role, content });
  }

  // Total conversation budget — prevents huge contexts from reaching the LLM.
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) return null;

  return messages;
}

function sanitizeBaseUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

function toAgentMessage(message: { role: ChatRole; content: string }): Message {
  return { role: message.role, content: message.content };
}

function buildSystemPrompt(
  orgName: string,
  currency: string,
  slug: string,
  baseUrl: string,
): string {
  const origin = baseUrl || `https://${slug}`;
  return `Та "${orgName}" дэлгүүрийн AI худалдан авалтын туслах. Валют: ${currency}.

Дүрэм:
- Хариултаа Монгол хэлээр, товч, найрсаг өгнө үү.
- Хариултаа Markdown форматаар бичнэ үү: **тод** үсэг, буллет жагсаалт (-), дугаарласан жагсаалт (1.), холбоос [текст](url). Хүснэгт, кодын блок бүү ашигла.
- Бүтээгдэхүүн санал болгоход search_products-ийн үр дүнд (нэр, тайлбар, үнэ, ангилал) шууд тулгуурлан хариулна уу. get_product багажийг зөвхөн худалдан авагч тухайн бүтээгдэхүүний дэлгэрэнгүй мэдээлэл (шинж чанар, хувилбар) асуухад л дуудна уу.
- Бүтээгдэхүүн хайхдаа search_products, дэлгэрэнгүй мэдээлэл авахдаа get_product, ангилал харахдаа list_categories багажийг ашиглана уу.
- Хямдрал, урамшууллын тухай асуултад get_promotions, бүтээгдэхүүний сэтгэгдэл асуухад get_product_reviews, дэлгүүрийн мэдээ/нийтлэл асуухад get_blog_posts, салбарын хаяг асуухад get_branches багажийг ашиглана уу.
- Худалдан авагч захиалгынхаа төлөвийг асуувал: захиалгын дугаар, утас (8-12 оронтой)-ыг асууж цуглуулж, баталгаажуулсны дараа track_order багажөөр шалгана уу.
- Худалдан авагч захиалга хийхийг хүсвэл: бүтээгдэхүүн, тоо ширхэг, нэр, утас, (хүргэлт бол) хаягийг асууж цуглуулж, худалдан авагчийн баталгаажуулсны дараа create_order багажөөр захиалга үүсгэнэ. Захиалгын дугаар, нийт дүн, төлбөрийн мэдээллийг (банкны шилжүүлэг эсвэл QPay QR) хариултад тодорхой бичнэ.
- Зөвхөн багажаас ирсэн бодит өгөгдлийг ашиглана уу. Үнэ, нөөц, бүтээгдэхүүнийг зохион бүтээж болохгүй.
- Бүтээгдэхүүн санал болгохдоо "Дэлгэрэнгүй: ${origin}/${slug}/products/<бүтээгдэхүүний_id>" холбоосыг оруулна уу. <бүтээгдэхүүний_id>-ийг багажийн хариултын id-ээр солино.
- Үнийг валютын тэмдэгтэй хамт бичнэ үү.
- Хэрэв тохирох бүтээгдэхүүн олдохгүй бол шударгаар хэлж, өөр сонголт санал болгоно уу.
- Дэлгүүрийн каталогийн талаарх асуултад багажуудыг ашиглана уу.`;
}

// In-memory sliding-window rate limiter, keyed by IP.
const rateLimitBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateLimitBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (hits.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateLimitBuckets.set(ip, hits);

  // Opportunistic cleanup — drop buckets older than the window.
  if (rateLimitBuckets.size > 10_000) {
    for (const [key, times] of rateLimitBuckets) {
      const alive = times.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (alive.length === 0) rateLimitBuckets.delete(key);
    }
  }
  return false;
}

// ── Durable rate-limit + cost helpers ────────────────────────────────

/** SHA-256 of the client IP — the durable guard stores hashes, never raw IPs. */
function hashIp(ip: string): string {
  return createHash("sha256").update(`ai-chat:${ip}`).digest("hex");
}

/**
 * Rough token estimate for the durable budget: input ≈ chars/4 (Cyrillic
 * averages ~2-3 chars/token) plus the worst-case single-round output cap.
 * Recorded BEFORE the LLM call, so failed attempts also burn budget.
 */
function estimateTokens(
  messages: { role: ChatRole; content: string }[],
  maxTokens: number,
  maxRounds: number,
): number {
  const inputChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  return Math.ceil(inputChars / 4) + maxTokens * maxRounds;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
