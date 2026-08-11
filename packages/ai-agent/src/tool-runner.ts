import type { AiOptions, Tool, ToolParam } from "./types";

// ---------------------------------------------------------------------------
// OpenAI-compatible message types (not exported — internal to this module)
// ---------------------------------------------------------------------------

export interface TextPart {
  type: "text";
  text: string;
}

export interface ImageUrlPart {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
}

export type MultimodalContent = string | null | Array<TextPart | ImageUrlPart>;

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: MultimodalContent;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAiTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function paramToJsonSchema(param: ToolParam): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    type: param.type,
    description: param.description,
  };
  if (param.enum) {
    schema.enum = param.enum;
  }
  if (param.type === "array" && param.items) {
    schema.items = param.items;
  }
  if (param.type === "object" && param.properties) {
    schema.properties = param.properties;
  }
  return schema;
}

function toolsToOpenAi(tools: Tool[]): OpenAiTool[] {
  return tools.map((tool) => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const param of tool.parameters) {
      properties[param.name] = paramToJsonSchema(param);
      if (param.required) {
        required.push(param.name);
      }
    }

    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties,
          required,
        },
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RunWithToolsOpts extends AiOptions {
  systemPrompt: string;
  userMessage: string;
  /** Optional image URLs or base64 data URLs for vision-capable models. */
  images?: string[];
  tools: Tool[];
  maxRounds?: number;
  /** Prior conversation messages to include before the current user message. */
  conversationHistory?: Message[];
}

/**
 * Run a conversation with tool-calling capabilities.
 *
 * Sends the user message with a list of curated tools to the LLM.
 * If the model requests tool calls, we execute them, feed results back,
 * and let the model continue — up to `maxRounds` iterations.
 *
 * Returns the final natural-language answer (Mongolian prose).
 */
export async function runWithTools(opts: RunWithToolsOpts): Promise<string> {
  const {
    apiKey,
    baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    systemPrompt,
    userMessage,
    images,
    tools,
    maxRounds = 3,
    conversationHistory,
  } = opts;

  const openAiTools = toolsToOpenAi(tools);
  const toolByName = new Map(tools.map((t) => [t.name, t]));

  const messages: Message[] = [{ role: "system", content: systemPrompt }];

  // Prepend prior conversation history (before current user message)
  if (conversationHistory && conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }
  if (images && images.length > 0) {
    const content: Array<TextPart | ImageUrlPart> = [
      { type: "text", text: userMessage },
      ...images.map((url) => ({
        type: "image_url" as const,
        image_url: { url, detail: "auto" as const },
      })),
    ];
    messages.push({ role: "user", content });
  } else {
    messages.push({ role: "user", content: userMessage });
  }

  let lastContent: string | null = null;

  for (let round = 0; round < maxRounds; round++) {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    };

    if (openAiTools.length > 0) {
      body.tools = openAiTools;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "unknown error");
      throw new Error(`DeepSeek API error: ${response.status} — ${errBody}`);
    }

    const json = await response.json();
    const choice = json.choices?.[0];
    const message: Message | undefined = choice?.message;

    if (!message) {
      throw new Error("DeepSeek API returned empty response");
    }

    // Track text content — NEVER use reasoning_content as response fallback
    // (reasoning_content is the model's chain-of-thought, not the final answer)
    if (message.content) {
      if (typeof message.content === "string") {
        lastContent = message.content;
      } else if (Array.isArray(message.content)) {
        const textParts = message.content.filter(
          (p): p is TextPart => p.type === "text",
        );
        lastContent = textParts.map((p) => p.text).join("");
      }
    }

    // No tool calls → we're done
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return (
        lastContent ??
        "Уучлаарай, хариулт үүсгэхэд алдаа гарлаа. Дахин оролдоно уу."
      );
    }

    // Push the assistant message (with tool_calls) into the conversation
    messages.push(message);

    // Execute each tool call and push results
    for (const tc of message.tool_calls) {
      const tool = toolByName.get(tc.function.name);
      let resultContent: string;

      if (!tool) {
        resultContent = JSON.stringify({
          error: `Багаж олдсонгүй: ${tc.function.name}`,
        });
      } else {
        try {
          const args = JSON.parse(tc.function.arguments) as Record<
            string,
            unknown
          >;
          const raw = await tool.execute(args);
          resultContent = typeof raw === "string" ? raw : JSON.stringify(raw);
        } catch (err) {
          resultContent = JSON.stringify({
            error:
              err instanceof Error
                ? err.message
                : "Багаж ажиллуулахад алдаа гарлаа",
          });
        }
      }

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: resultContent,
      });
    }
  }

  // Exhausted maxRounds — return whatever we have
  return (
    lastContent ??
    "Уучлаарай, хүсэлтийг боловсруулж дуусгах боломжгүй байна. Дахин оролдоно уу."
  );
}
