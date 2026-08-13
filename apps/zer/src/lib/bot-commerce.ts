import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { runWithTools } from "@zuiio/ai-agent";
import { createBuyerAgentTools } from "@/lib/agent-tools/buyer";
import { storefrontUrl } from "@/lib/storefront-host";
import type { Database } from "@/lib/supabase/types";

export type BotBuyerSession =
  Database["public"]["Tables"]["bot_buyer_sessions"]["Row"];

export type ServiceSupabaseClient = SupabaseClient<Database>;

export type BuyerOrg = {
  id: string;
  slug: string;
  name: string;
  currency: string | null;
};

/**
 * Bind (or re-bind) a buyer's external chat id to an organization.
 * Re-binding moves the buyer to the new shop; last_active_at is refreshed.
 */
export async function bindBuyerSession(
  supabase: ServiceSupabaseClient,
  channel: "telegram" | "messenger",
  externalId: string,
  organizationId: string,
): Promise<void> {
  await supabase.from("bot_buyer_sessions").upsert(
    {
      channel,
      external_id: externalId,
      organization_id: organizationId,
      last_active_at: new Date().toISOString(),
    },
    { onConflict: "channel,external_id" },
  );
}

/**
 * Look up the buyer's bound shop, or null when not bound.
 */
export async function getBuyerSession(
  supabase: ServiceSupabaseClient,
  channel: "telegram" | "messenger",
  externalId: string,
): Promise<BotBuyerSession | null> {
  const { data } = await supabase
    .from("bot_buyer_sessions")
    .select("*")
    .eq("channel", channel)
    .eq("external_id", externalId)
    .maybeSingle();
  return data ?? null;
}

export async function touchBuyerSession(
  supabase: ServiceSupabaseClient,
  sessionId: string,
): Promise<void> {
  await supabase
    .from("bot_buyer_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", sessionId);
}

/**
 * Resolve the shop a buyer session points at (with slug + currency for the
 * agent prompt and the public catalog RPCs).
 */
export async function getBuyerOrg(
  supabase: ServiceSupabaseClient,
  organizationId: string,
): Promise<BuyerOrg | null> {
  const { data } = await supabase
    .from("organizations")
    .select("id, slug, name, currency")
    .eq("id", organizationId)
    .maybeSingle();
  return data ?? null;
}

const BUYER_SYSTEM_PROMPT = (
  orgName: string,
  currency: string,
  slug: string,
  baseUrl: string,
) => `Та "${orgName}" дэлгүүрийн худалдааны туслах. Валют: ${currency}.

Та мессенжерээр худалдан авагчдад бүтээгдэхүүн зардаг.
Дүрэм:
- Хариултаа Монгол хэлээр, товч, найрсаг өгнө үү.
- Бүтээгдэхүүн хайхдаа search_products, дэлгэрэнгүй мэдээлэл авахдаа get_product, ангилал харахдаа list_categories багажийг ашиглана уу.
- Захиалга авахын тулд эхлээд дараах мэдээллийг цуглуулна уу: бүтээгдэхүүн, тоо ширхэг, худалдан авагчийн нэр, утас, хүргэлтийн төрөл (delivery эсвэл pickup). delivery бол хаяг, pickup бол аль салбарыг асууна уу.
- Бүх мэдээлэл бүрэн болсны дараа place_order багажийг дуудаж, захиалгын дугаар (order_id), нийт дүн (total_amount), статусыг худалдан авагчид баталгаажуулна уу.
- Захиалгын статус асуухад get_order_status багажийг order_id-ээр дуудаж хариулна уу.
- Зөвхөн багажаас ирсэн бодит өгөгдлийг ашиглана уу. Үнэ, нөөц, бүтээгдэхүүнийг зохион бүтээж болохгүй.
- Бүтээгдэхүүн санал болгохдоо холбоос оруулна уу: ${storefrontUrl(baseUrl, slug, "/products/<бүтээгдэхүүний_id>")}`;

/**
 * Run the buyer agent for one message and return the reply text.
 * Uses public catalog tools + place_order against the buyer's bound shop.
 */
export async function runBuyerAgent(params: {
  supabase: ServiceSupabaseClient;
  org: BuyerOrg;
  text: string;
  baseUrl: string;
}): Promise<string> {
  const { supabase, org, text, baseUrl } = params;
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return "Уучлаарай, AI үйлчилгээ түр идэвхгүй байна. Дахин оролдоно уу.";
  }

  const tools = createBuyerAgentTools(supabase, org.slug, baseUrl);

  return runWithTools({
    apiKey,
    systemPrompt: BUYER_SYSTEM_PROMPT(
      org.name ?? org.slug,
      org.currency ?? "MNT",
      org.slug,
      baseUrl,
    ),
    userMessage: text,
    tools,
    maxRounds: 4,
  });
}
