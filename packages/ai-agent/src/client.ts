import type { AiOptions } from "./types";

interface Message {
 role: "system" | "user" | "assistant";
 content: string;
}

interface ChatCompletionOptions {
 systemPrompt?: string;
 messages: Message[];
 model?: string;
 temperature?: number;
 maxTokens?: number;
 responseFormat?: "text" | "json_object";
}

/**
 * Raw DeepSeek Flash chat completion call.
 * OpenAI-compatible — works with any OpenAI-compatible API.
 */
export async function chatCompletion(
 opts: ChatCompletionOptions & AiOptions,
): Promise<string> {
 const { apiKey, baseUrl = "https://api.deepseek.com", model = "deepseek-chat" } = opts;

 const messages: Message[] = [];
 if (opts.systemPrompt) {
  messages.push({ role: "system", content: opts.systemPrompt });
 }
 messages.push(...opts.messages);

 const body: Record<string, unknown> = {
  model,
  messages,
  temperature: opts.temperature ?? 0.7,
  max_tokens: opts.maxTokens ?? 1024,
 };

 if (opts.responseFormat) {
  body.response_format = { type: opts.responseFormat };
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
 const message = json.choices?.[0]?.message;
const content: string | undefined = message?.content;
 if (!content) {
  throw new Error("DeepSeek API returned empty response");
 }

 return content;
}

/**
 * Structured completion — asks the model to return valid JSON matching a schema.
 * The schema is described via a system prompt instruction.
 */
export async function structuredCompletion<T>(
 opts: {
  systemPrompt: string;
  userPrompt: string;
  schemaDescription: string;
  temperature?: number;
  maxTokens?: number;
 } & AiOptions,
): Promise<T> {
 const content = await chatCompletion({
  ...opts,
  systemPrompt: `${opts.systemPrompt}\n\nYou MUST respond with valid JSON only, no markdown, no code fences. Schema:\n${opts.schemaDescription}`,
  messages: [{ role: "user", content: opts.userPrompt }],
  temperature: opts.temperature ?? 0.1,
  maxTokens: opts.maxTokens ?? 2048,
  responseFormat: "json_object",
 });

 try {
  return JSON.parse(content) as T;
 } catch {
  throw new Error(
   `DeepSeek returned invalid JSON. Raw:\n${content.slice(0, 500)}`,
  );
 }
}
