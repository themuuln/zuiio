# @zuiio/ai-agent — LLM Client for DeepSeek / OpenAI

Thin OpenAI-compatible client for DeepSeek Flash (default) or any compatible API. Provides chat completions, structured JSON output, natural-language→SQL, expense categorization, Mongolian report generation, and an agentic tool-calling loop.

All functions accept `AiOptions` (`apiKey`, optional `model`/`baseUrl`).

## Exports

| Function | Signature | Description |
|---|---|---|
| `chatCompletion` | `(opts) → Promise<string>` | Raw chat completion — returns model text |
| `structuredCompletion<T>` | `(opts) → Promise<T>` | Chat completion that parses model response as typed JSON |
| `generateEveningReport` | `(input, opts) → Promise<string>` | Mongolian daily report in Telegram Markdown from `ReportInput` data |
| `nlQuery` | `(input, opts) → Promise<NLQueryResult>` | Natural-language question → SQL SELECT + Mongolian explanation (caller executes SQL) |
| `categorizeExpense` | `(input, opts) → Promise<CategorizeResult>` | Expense description → best-matching category with confidence score |
| `runWithTools` | `(opts) → Promise<string>` | Agentic tool-calling loop — model calls tools until final text answer |

### Types

`Message`, `Tool`, `ToolParam`, `ToolResult`, `AiOptions`, `ReportInput`, `NLQueryInput`, `NLQueryResult`, `CategorizeInput`, `CategorizeResult`

## Tool-calling pattern

```ts
import { runWithTools, type Tool } from "@zuiio/ai-agent";

const tools: Tool[] = [{
  name: "get_sales",
  description: "Fetch today's sales total",
  parameters: [
    { name: "date", type: "string", description: "ISO date", required: true },
  ],
  execute: async (args) => db.query("SELECT ...", [args.date]),
}];

const answer = await runWithTools({
  apiKey: process.env.DEEPSEEK_API_KEY,
  systemPrompt: "You are a helpful assistant.",
  userMessage: "What were today's sales?",
  tools,
  maxRounds: 5,              // default 3
  conversationHistory: [],   // optional prior messages
});
```

`runWithTools` round-trips: model returns `tool_calls` → `execute()` runs them → results fed back → loop until model produces text (up to `maxRounds` iterations).

## Structured output

`structuredCompletion<T>` forces `response_format: "json_object"` and `temperature: 0.1`. The caller provides a schema description as natural-language text — the model returns valid JSON matching that schema.

```ts
import { structuredCompletion } from "@zuiio/ai-agent";

const result = await structuredCompletion<{ label: string; score: number }>({
  apiKey: process.env.DEEPSEEK_API_KEY,
  systemPrompt: "Classify the sentiment of the input.",
  userPrompt: "This product is amazing!",
  schemaDescription: '{ "label": "positive | negative | neutral", "score": 0.0-1.0 }',
});
```

## Agent Gateway usage

`apps/agent-gateway` wraps this package via `DeepSeekProvider` (`src/providers/deepseek.ts`), closing over `ToolContext` (orgId, userId, supabase) so gateway tools can filter by tenant. The gateway converts `GatewayTool` (which receives context) into `@zuiio/ai-agent` `Tool` (which doesn't) at the provider boundary.

## Module map

| File | Public exports |
|---|---|
| `client.ts` | `chatCompletion`, `structuredCompletion` |
| `report-gen.ts` | `generateEveningReport` |
| `nl-query.ts` | `nlQuery` |
| `categorize.ts` | `categorizeExpense` |
| `tool-runner.ts` | `runWithTools`, `Message` |
| `types.ts` | All interfaces (`Tool`, `ToolParam`, `ToolResult`, `AiOptions`, …) |

## Key details

- **Default model**: `deepseek-chat` (DeepSeek Flash) via `https://api.deepseek.com`
- **`structuredCompletion`** forces `response_format: "json_object"` and `temperature: 0.1` — caller provides schema as natural-language description
- **`nlQuery`** only generates SQL; it does NOT execute it — caller must use a read-only role with RLS
- **`runWithTools`** round-trips: model returns `tool_calls` → `execute()` runs them → results fed back → loop until model produces text (max `maxRounds` iterations)
- Mongolian (Cyrillic) prompt text in `report-gen`, `nl-query`, `categorize` — UI should use output directly
