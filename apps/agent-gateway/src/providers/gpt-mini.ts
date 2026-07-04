import type { AiProvider, GatewayTool, ToolContext } from "./types";

/**
 * OpenAI-compatible provider (GPT-4o-mini fallback).
 * Implements the same multi-turn tool-calling loop as DeepSeekProvider,
 * but uses OpenAI's native API format.
 */
export class GptMiniProvider implements AiProvider {
  constructor(
    private options: {
      apiKey: string;
      baseUrl?: string;
      model?: string;
    },
  ) {}

  async runWithTools(params: {
    system: string;
    userMessage: string;
    tools: GatewayTool[];
    context: ToolContext;
    maxRounds?: number;
  }): Promise<string> {
    const { system, userMessage, tools, context, maxRounds = 5 } = params;
    const baseUrl = this.options.baseUrl ?? "https://api.openai.com/v1";

    // Convert tools to OpenAI function-calling format
    const openAiTools = tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: "object" as const,
          properties: Object.fromEntries(
            t.parameters.map((p) => [
              p.name,
              {
                type: p.type,
                description: p.description,
                ...(p.enum ? { enum: p.enum } : {}),
              },
            ]),
          ),
          required: t.parameters.filter((p) => p.required).map((p) => p.name),
        },
      },
    }));

    const toolByName = new Map(tools.map((t) => [t.name, t]));

    const messages: Array<Record<string, unknown>> = [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ];

    let lastContent: string | null = null;

    for (let round = 0; round < maxRounds; round++) {
      const body: Record<string, unknown> = {
        model: this.options.model ?? "gpt-4o-mini",
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      };

      if (openAiTools.length > 0) {
        body.tools = openAiTools;
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "unknown error");
        throw new Error(`OpenAI API error: ${response.status} — ${errBody}`);
      }

      const json = await response.json();
      const choice = json.choices?.[0];
      const message = choice?.message;

      if (!message) {
        throw new Error("OpenAI API returned empty response");
      }

      if (message.content) {
        lastContent = message.content;
      }

      // No tool calls → done
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return (
          lastContent ??
          "Уучлаарай, хариулт үүсгэхэд алдаа гарлаа. Дахин оролдоно уу."
        );
      }

      // Push assistant message with tool_calls
      messages.push(message);

      // Execute each tool call
      for (const tc of message.tool_calls) {
        const tool = toolByName.get(tc.function.name);
        let resultContent: string;

        if (!tool) {
          resultContent = JSON.stringify({
            error: `Багаж олдсонгүй: ${tc.function.name}`,
          });
        } else {
          try {
            const args = JSON.parse(
              tc.function.arguments,
            ) as Record<string, unknown>;
            const raw = await tool.execute(args, context);
            resultContent =
              typeof raw === "string" ? raw : JSON.stringify(raw);
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

    return (
      lastContent ??
      "Уучлаарай, хүсэлтийг боловсруулж дуусгах боломжгүй байна. Дахин оролдоно уу."
    );
  }
}
