/**
 * Cloudflare Workers AI client — free edge inference (10K Neurons/day).
 *
 * Env vars required:
 *   CF_ACCOUNT_ID  — Cloudflare account ID
 *   CF_AI_API_TOKEN — API token with Workers AI:Read permission
 *
 * Available models (examples):
 *   Text:     @cf/meta/llama-3.1-8b-instruct-fp8-fast
 *   Embedding: @cf/baai/bge-base-en-v1.5
 *   Image:    @cf/black-forest-labs/FLUX-1-schnell
 *   Audio:    @cf/openai/whisper
 *
 * Full catalog: https://developers.cloudflare.com/workers-ai/models/
 */

interface WorkersAIConfig {
  accountId?: string;
  apiToken?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  result: { response: string };
  success: boolean;
  errors: string[];
}

interface StreamChunk {
  response?: string;
}

function getConfig(): Required<WorkersAIConfig> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_AI_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("Workers AI not configured. Set CF_ACCOUNT_ID and CF_AI_API_TOKEN.");
  }

  return { accountId, apiToken };
}

/**
 * Run a non-streaming text completion.
 */
export async function workersAIComplete(
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  const { accountId, apiToken } = getConfig();

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Workers AI error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  if (!data.success) {
    throw new Error(`Workers AI failed: ${data.errors.join(", ")}`);
  }

  return data.result.response;
}

/**
 * Run a streaming text completion — returns an async iterable of text chunks.
 */
export async function workersAIStream(
  model: string,
  messages: ChatMessage[],
): Promise<ReadableStream<string>> {
  const { accountId, apiToken } = getConfig();

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, stream: true }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Workers AI error ${res.status}: ${text}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      const text = decoder.decode(value, { stream: true });
      // NDJSON: each line is a JSON object
      for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line) as StreamChunk;
          if (chunk.response) {
            controller.enqueue(chunk.response);
          }
        } catch {
          // skip malformed lines
        }
      }
    },
  });
}

/**
 * Generate embeddings for text (useful for semantic search).
 */
export async function workersAIEmbed(
  model: string,
  texts: string[],
): Promise<number[][]> {
  const { accountId, apiToken } = getConfig();

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: texts }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Workers AI embed error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    result: { data: number[][] };
    success: boolean;
  };

  if (!data.success) {
    throw new Error("Workers AI embedding failed");
  }

  return data.result.data;
}
