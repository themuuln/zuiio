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
  /** Max output tokens per agent round (default 4096). */
  maxTokens?: number;
  /**
   * When provided, the chat completion is streamed (SSE) and this callback
   * receives each text delta as it arrives. Tool-call rounds emit no text
   * deltas, so callers only see the final answer's tokens.
   */
  onToken?: (delta: string) => void;
  /** Abort signal forwarded to the upstream chat completion request. */
  signal?: AbortSignal;
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
    model: explicitModel,
    systemPrompt,
    userMessage,
    images,
    tools,
    maxRounds = 3,
    maxTokens = 4096,
    onToken,
    signal,
    conversationHistory,
  } = opts;

  const stream = typeof onToken === "function";

  // Text calls use DEEPSEEK_MODEL (deepseek-v4-flash); image/vision calls use
  // DEEPSEEK_IMAGE_MODEL (mimo-v2.5) so image understanding is never sent to a
  // non-vision model.
  const hasImages = !!images && images.length > 0;
  const model =
    explicitModel ??
    (hasImages
      ? (process.env.DEEPSEEK_IMAGE_MODEL ?? process.env.DEEPSEEK_MODEL)
      : process.env.DEEPSEEK_MODEL) ??
    "deepseek-chat";

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
      max_tokens: maxTokens,
      stream,
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
      signal,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "unknown error");
      throw new Error(`DeepSeek API error: ${response.status} — ${errBody}`);
    }

    const message: Message | undefined = stream
      ? await readStreamedMessage(response, onToken)
      : (await response.json())?.choices?.[0]?.message;

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

    // Execute every tool call in parallel (multi-tool rounds like
    // per-product lookups are the common storefront case) while preserving
    // the tool_calls order in the results that go back to the model.
    const results = await Promise.all(
      message.tool_calls.map(async (tc) => {
        const tool = toolByName.get(tc.function.name);
        if (!tool) {
          return {
            toolCallId: tc.id,
            content: JSON.stringify({
              error: `Багаж олдсонгүй: ${tc.function.name}`,
            }),
          };
        }
        try {
          const args = JSON.parse(tc.function.arguments) as Record<
            string,
            unknown
          >;
          const raw = await tool.execute(args);
          return {
            toolCallId: tc.id,
            content: typeof raw === "string" ? raw : JSON.stringify(raw),
          };
        } catch (err) {
          return {
            toolCallId: tc.id,
            content: JSON.stringify({
              error:
                err instanceof Error
                  ? err.message
                  : "Багаж ажиллуулахад алдаа гарлаа",
            }),
          };
        }
      }),
    );

    for (const { toolCallId, content } of results) {
      messages.push({ role: "tool", tool_call_id: toolCallId, content });
    }
  }

  // Exhausted maxRounds — return whatever we have
  return (
    lastContent ??
    "Уучлаарай, хүсэлтийг боловсруулж дуусгах боломжгүй байна. Дахин оролдоно уу."
  );
}

// ---------------------------------------------------------------------------
// SSE streaming (OpenAI-compatible chat.completions with stream: true)
// ---------------------------------------------------------------------------

interface StreamedToolCall {
  id?: string;
  name?: string;
  args: string;
}

/**
 * Reads a streamed chat completion response and reconstructs the final
 * message — text content plus any tool calls (deltas arrive fragmented and
 * must be re-assembled per tool index). `onToken` receives each content
 * delta as it arrives; `reasoning_content` deltas are deliberately ignored
 * (chain-of-thought must never surface to the caller).
 */
async function readStreamedMessage(
  response: Response,
  onToken: (delta: string) => void,
): Promise<Message> {
  if (!response.body) throw new Error("DeepSeek returned an empty stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  const toolCalls = new Map<number, StreamedToolCall>();

  const handleEvent = (raw: string) => {
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "" || payload === "[DONE]") continue;
      let json: { choices?: Array<{ delta?: Record<string, unknown> }> };
      try {
        json = JSON.parse(payload) as {
          choices?: Array<{ delta?: Record<string, unknown> }>;
        };
      } catch {
        continue; // ignore malformed keep-alive/comment frames
      }
      const delta = json.choices?.[0]?.delta;
      if (!delta) continue;

      if (typeof delta.content === "string" && delta.content.length > 0) {
        content += delta.content;
        onToken(delta.content);
      }

      const deltas = delta.tool_calls;
      if (!Array.isArray(deltas)) continue;
      for (const tc of deltas as Array<{
        index?: number;
        id?: string;
        function?: { name?: string; arguments?: unknown };
      }>) {
        const index = tc.index ?? 0;
        const entry = toolCalls.get(index) ?? { args: "", name: "" };
        if (tc.id) entry.id = tc.id;
        // Name fragments append like arguments — providers may split the
        // name across deltas too (rare, but the args path already assumes
        // arbitrary fragmentation).
        if (tc.function?.name) entry.name += tc.function.name;
        if (typeof tc.function?.arguments === "string") {
          entry.args += tc.function.arguments;
        }
        toolCalls.set(index, entry);
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line (\n\n or \r\n\r\n).
    let sep = buffer.search(/\r?\n\r?\n/);
    while (sep !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + (buffer[sep] === "\r" ? 4 : 2));
      handleEvent(raw);
      sep = buffer.search(/\r?\n\r?\n/);
    }
  }
  // Flush a trailing event that arrived without a blank-line terminator.
  handleEvent(buffer);

  const message: Message = { role: "assistant", content: content || null };
  if (toolCalls.size > 0) {
    message.tool_calls = Array.from(toolCalls.entries())
      .sort(([a], [b]) => a - b)
      .map(([, e]) => ({
        id: e.id ?? "",
        type: "function" as const,
        function: { name: e.name ?? "", arguments: e.args },
      }));
  }
  return message;
}
