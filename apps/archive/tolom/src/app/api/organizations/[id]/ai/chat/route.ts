import { NextResponse } from "next/server";
import { type ChatRequest, processChatMessage } from "@/lib/ai/chat-service";
import { createRouteHandler } from "@/lib/api-handler";
import { apiError } from "@/lib/api-response";

const MAX_MESSAGE_LENGTH = 4_000;
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_MESSAGE_LENGTH = 4_000;

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = (await request.json()) as {
      message?: unknown;
      history?: unknown;
    };
    const { message, history: rawHistory } = body;

    const history =
      rawHistory === undefined
        ? undefined
        : (rawHistory as ChatRequest["history"]);

    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return apiError(
        "VALIDATION",
        "Message is required and limited to 4,000 characters",
        400,
      );
    }

    if (
      !Array.isArray(rawHistory) ||
      rawHistory.length > MAX_HISTORY_ITEMS ||
      rawHistory.some(
        (item) =>
          typeof item !== "object" ||
          item === null ||
          !("role" in item) ||
          !("content" in item) ||
          !(
            (item as { role?: unknown }).role === "user" ||
            (item as { role?: unknown }).role === "assistant"
          ) ||
          typeof (item as { content?: unknown }).content !== "string" ||
          (item as { content: string }).content.length >
            MAX_HISTORY_MESSAGE_LENGTH,
      )
    ) {
      if (rawHistory !== undefined) {
        return apiError("VALIDATION", "Invalid conversation history", 400);
      }
    }

    const result = await processChatMessage(supabase, orgId, {
      message,
      history,
    });

    return NextResponse.json({ reply: result });
  },
  {
    requiredPermission: { resource: "inventory", action: "read" },
    rateLimit: true,
  },
);
