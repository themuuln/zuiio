# Adding Providers

Providers implement the multi-turn tool-calling loop for different AI APIs. This guide explains how to add a new provider.

## Provider Interface

Every provider implements the `AiProvider` interface from `src/providers/types.ts`:

```typescript
interface AiProvider {
  runWithTools(params: {
    system: string;
    userMessage: string;
    tools: GatewayTool[];
    context: ToolContext;
    maxRounds?: number;
    conversationHistory?: Array<{
      role: "system" | "user" | "assistant" | "tool";
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }>;
      tool_call_id?: string;
    }>;
  }): Promise<string>;
}
```

## The Tool-Calling Loop

Each provider owns its own multi-turn loop:

```
1. Build messages array (system + history + user message)
2. Call LLM API with tools in function-calling format
3. If LLM returns tool_calls:
   a. Execute each tool with context
   b. Append tool results to messages
   c. Call LLM again
   d. Repeat until no tool calls or maxRounds reached
4. Return final text response
```

## Step-by-Step

### 1. Create the provider file

```typescript
// src/providers/my-provider.ts

import type { AiProvider, GatewayTool, ToolContext } from "./types";

export class MyProvider implements AiProvider {
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
    conversationHistory?: Array<{
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: { name: string; arguments: string };
      }>;
      tool_call_id?: string;
    }>;
  }): Promise<string> {
    const { system, userMessage, tools, context, maxRounds = 5, conversationHistory } = params;

    // Convert tools to your API's format
    const apiTools = tools.map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: "object",
          properties: Object.fromEntries(
            t.parameters.map(p => [p.name, { type: p.type, description: p.description }])
          ),
          required: t.parameters.filter(p => p.required).map(p => p.name),
        },
      },
    }));

    const toolByName = new Map(tools.map(t => [t.name, t]));

    // Build messages
    const messages: Array<Record<string, unknown>> = [
      { role: "system", content: system },
    ];

    if (conversationHistory?.length) {
      messages.push(...conversationHistory);
    }
    messages.push({ role: "user", content: userMessage });

    let lastContent: string | null = null;

    // Multi-turn loop
    for (let round = 0; round < maxRounds; round++) {
      const response = await fetch(`${this.options.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: this.options.model ?? "my-model",
          messages,
          tools: apiTools,
        }),
      });

      if (!response.ok) {
        throw new Error(`Provider API error: ${response.status}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      lastContent = message?.content ?? lastContent;
      messages.push(message);

      // No tool calls — done
      if (!message?.tool_calls?.length) break;

      // Execute tools
      for (const toolCall of message.tool_calls) {
        const tool = toolByName.get(toolCall.function.name);
        if (!tool) continue;

        const args = JSON.parse(toolCall.function.arguments);
        const result = await tool.execute(args, context);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    return lastContent ?? "Хүсэлтийг боловсруулж дуусгах боломжгүй байна.";
  }
}
```

### 2. Register the provider

In `src/lib/env.ts`, add configuration:

```typescript
export function myProviderConfig() {
  const apiKey = env("MY_PROVIDER_API_KEY");
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: env("MY_PROVIDER_BASE_URL") ?? "https://api.myprovider.com/v1",
    model: env("MY_PROVIDER_MODEL") ?? "my-model",
  };
}
```

### 3. Wire into the gateway

In `src/gateway/agent-handler.ts`, add the provider to the gateway:

```typescript
import { MyProvider } from "@/providers/my-provider";
import { myProviderConfig } from "@/lib/env";

function getGateway(): AiGateway {
  if (!_gateway) {
    const opencodego = new OpenCodeGoProvider(openCodeGoConfig());
    const myProvider = myProviderConfig()
      ? new MyProvider(myProviderConfig()!)
      : undefined;
    const fallback = openAiConfig()
      ? new GptMiniProvider(openAiConfig()!)
      : undefined;

    // Use myProvider as primary, opencodego as fallback, openai as last resort
    _gateway = new AiGateway(
      myProvider ?? opencodego,
      myProvider ? opencodego : fallback,
    );
  }
  return _gateway;
}
```

### 4. Add environment variables

Add to `.env.example` and deployment:

```
MY_PROVIDER_API_KEY=...
MY_PROVIDER_BASE_URL=https://api.myprovider.com/v1
MY_PROVIDER_MODEL=my-model
```

### 5. Update security audit

In `src/state/security.ts`, add a check:

```typescript
const myProviderKey = process.env.MY_PROVIDER_API_KEY ?? "";
if (!myProviderKey || myProviderKey === "placeholder") {
  warnings.push("MY_PROVIDER_API_KEY is missing or placeholder");
}
```

## Tool Format Conversion

Different APIs use different tool/function formats:

| Provider | Format |
|---|---|
| OpenAI | `{ type: "function", function: { name, description, parameters } }` |
| OpenCodeGo | Same as OpenAI (OpenAI-compatible) |
| Anthropic | `{ name, description, input_schema }` |
| Google | `{ function_declarations: [{ name, description, parameters }] }` |

Convert `GatewayTool[]` to the target format in your provider's `runWithTools`.

## Conversation History

The `conversationHistory` parameter contains previous messages from the session. Providers should:

1. Prepend history to the messages array
2. Preserve `tool_calls` and `tool_call_id` for multi-turn tool calling
3. The gateway handles session persistence — providers just consume history

## Error Handling

- Throw on API errors — the `AiGateway` will catch and try the fallback
- Don't catch provider-level errors silently — let them propagate for Sentry capture
- Return the user's language (Mongolian) for timeout/fallback messages

## Testing

Test your provider by:

1. Adding it to the gateway in a test file
2. Mocking the API response
3. Verifying tool calls are executed correctly

```typescript
it("MyProvider executes tools and returns result", async () => {
  const provider = new MyProvider({ apiKey: "test", baseUrl: "https://mock.api" });
  const result = await provider.runWithTools({
    system: "You are a test assistant.",
    userMessage: "What's the weather?",
    tools: [mockTool],
    context: mockContext,
    maxRounds: 3,
  });
  expect(result).toBeDefined();
});
```
