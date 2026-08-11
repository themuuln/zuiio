import { type Message, runWithTools } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createStorefrontAgentTools } from "@/lib/agent-tools/storefront";
import { createClient } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 2000;
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

  // Per-IP in-memory rate limit. Per-instance only — good enough to stop
  // casual abuse; Vercel edge caching is not affected.
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

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: CONFIG_ERROR }, { status: 503 });
  }

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

    const reply = await runWithTools({
      apiKey,
      systemPrompt,
      userMessage: last.content,
      conversationHistory: history,
      tools,
      maxRounds: 4,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    capture(err, { context: "api/ai/chat" });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
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
- Бүтээгдэхүүн хайхдаа search_products, дэлгэрэнгүй мэдээлэл авахдаа get_product, ангилал харахдаа list_categories багажийг ашиглана уу.
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
