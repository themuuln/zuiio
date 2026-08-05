import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type Message, runWithTools } from "@zuiio/ai-agent";
import type { Database } from "@/lib/types";
import { createTolomTools } from "./tolom-tools";

const SYSTEM_PROMPT = `Та ТОЛОМ-ын туслах AI ассистент юм. Та TOLOM авто засварын менежментийн системийн талаарх мэдээллийг хариуцна.

Та дараах үйлдлүүдийг хийж чадна:
- Захиалгуудыг хайх (төлөв, огноогоор)
- Сэлбэг хайх (нэр, дугаараар)
- Үйлчлүүлэгч хайх (нэр, утасны дугаараар)
- Сэлбэгийн үлдэгдэл шалгах
- Өнөөдрийн цаг захиалгуудыг харах

Хариултаа Монгол хэлээр өгнө үү. Хэрэв хэрэглэгч ямар нэг зүйл хайхыг хүсвэл холбогдох багажаа ашиглана уу.`;

export interface ChatRequest {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

const MAX_MESSAGE_LENGTH = 4_000;
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_MESSAGE_LENGTH = 4_000;

function normalizeHistory(
  history: ChatRequest["history"],
): Message[] | undefined {
  if (!history) return undefined;

  return history.slice(-MAX_HISTORY_ITEMS).map((msg) => ({
    role: msg.role,
    content: msg.content.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
  }));
}

/**
 * Process a chat message with tool-calling AI.
 * Returns the AI's response as a string.
 */
export async function processChatMessage(
  supabase: SupabaseClient<Database>,
  orgId: string,
  request: ChatRequest,
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is not configured. Set it in environment variables.",
    );
  }

  const tools = createTolomTools(supabase, orgId);

  const conversationHistory = normalizeHistory(request.history);
  const userMessage = request.message.slice(0, MAX_MESSAGE_LENGTH);

  const response = await runWithTools({
    apiKey,
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    tools,
    maxRounds: 4,
    conversationHistory,
  });

  return response;
}
