import type { Tool } from "@zuiio/ai-agent";
import { runWithTools } from "@zuiio/ai-agent";
import type { AiProvider, GatewayTool, ToolContext } from "./types";

/**
 * Converts a gateway tool (which takes context) into an @zuiio/ai-agent Tool
 * (which doesn't) by closing over the context.
 */
function wrapTool(tool: GatewayTool, context: ToolContext): Tool {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    execute: (args: Record<string, unknown>) => tool.execute(args, context),
  };
}

/**
 * DeepSeek provider via OpenCodeGo.
 * Wraps the existing @zuiio/ai-agent runWithTools function.
 */
export class DeepSeekProvider implements AiProvider {
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

    // Wrap gateway tools to close over context
    const wrappedTools = tools.map((t) => wrapTool(t, context));

    return runWithTools({
      apiKey: this.options.apiKey,
      baseUrl: this.options.baseUrl ?? "https://api.deepseek.com",
      model: this.options.model ?? "deepseek-chat",
      systemPrompt: system,
      userMessage,
      tools: wrappedTools,
      maxRounds,
    });
  }
}
