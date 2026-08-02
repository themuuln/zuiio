"use server";

import * as Sentry from "@sentry/nextjs";
import "server-only";
import { runWithTools } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";
import { requireAppContext } from "@/lib/action-utils";
import { createAllAgentTools } from "@/lib/agent-tools";
import { createServiceClient } from "@/lib/supabase/server-service";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AskAssistantResult = { answer?: string; error?: string };

/** Maximum number of prior messages sent to the model. */
const MAX_HISTORY_MESSAGES = 20;

/**
 * Parse the `history` form field defensively.
 *
 * The client sends a JSON array of `{ role: "user" | "assistant", content }`.
 * Anything malformed is dropped; only the last `MAX_HISTORY_MESSAGES`
 * entries are kept to bound prompt size.
 */
function parseHistory(raw: FormDataEntryValue | null): ChatMessage[] {
  if (!raw || typeof raw !== "string") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const valid = parsed.filter((entry): entry is ChatMessage => {
    if (typeof entry !== "object" || entry === null) return false;
    const msg = entry as { role?: unknown; content?: unknown };
    return (
      (msg.role === "user" || msg.role === "assistant") &&
      typeof msg.content === "string"
    );
  });

  return valid.slice(-MAX_HISTORY_MESSAGES);
}

/**
 * askAssistant — Server Action
 *
 * Runs the org's current question through the AI assistant with the full
 * tool set (inventory, sales), scoped to the caller's organization.
 */
export async function askAssistant(
  _prevState: AskAssistantResult | undefined,
  formData: FormData,
): Promise<AskAssistantResult> {
  return Sentry.startSpan(
    { name: "askAssistant", op: "ai.assistant" },
    async (span) => {
      // ── Phase 1: Auth ───────────────────────────────────────────────────
      const { organizationId } = await requireAppContext();
      span.setAttribute("org_id", organizationId);

      // ── Phase 2: Parse input ────────────────────────────────────────────
      const userMessage = formData.get("userMessage")?.toString().trim() ?? "";
      const history = parseHistory(formData.get("history"));
      const orgName = formData.get("orgName")?.toString().trim() || null;

      if (!userMessage) {
        return { error: "Асуултаа бичнэ үү." };
      }

      span.setAttribute("history_length", history.length);

      // ── Phase 3: Config check (no fake fallback) ────────────────────────
      const apiKey = process.env.DEEPSEEK_API_KEY ?? "";
      if (!apiKey) {
        return {
          error: "AI туслах тохиргоогүй байна. DEEPSEEK_API_KEY тохируулна уу.",
        };
      }

      // ── Phase 4: Run the assistant with tools ───────────────────────────
      try {
        const tools = createAllAgentTools(
          createServiceClient(),
          organizationId,
        );
        const orgRef = orgName ?? organizationId;
        const answer = await runWithTools({
          apiKey,
          systemPrompt: `Та Zer ERP-ийн ухаалаг туслах юм. Та "${orgRef}" байгууллагын бараа материал, борлуулалт, санхүүгийн өгөгдөлтэй ажиллана. Асуултад бодит өгөгдөл дээр тулгуурлан товч, ойлгомжтой хариулна уу. Хэрэв шаардлагатай мэдээлэл байхгүй бол шууд хэлнэ үү. Монголоор хариулна уу.`,
          userMessage,
          conversationHistory: history,
          tools,
          maxRounds: 5,
        });
        return { answer };
      } catch (err) {
        capture(err, { context: "askAssistant" });
        return { error: "Хариулт авахад алдаа гарлаа. Дахин оролдоно уу." };
      }
    },
  );
}
