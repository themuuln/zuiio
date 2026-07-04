/**
 * Type-safe environment variable access.
 * Returns the value or throws if required and missing.
 */
export function env(name: string, options?: { required?: boolean }): string | undefined {
  const value = process.env[name];
  if (options?.required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function envOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** DeepSeek API configuration. */
export function deepSeekConfig() {
  return {
    apiKey: envOrThrow("DEEPSEEK_API_KEY"),
    baseUrl: env("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com",
    model: env("DEEPSEEK_MODEL") ?? "deepseek-chat",
  };
}

/** OpenAI fallback configuration. */
export function openAiConfig() {
  return {
    apiKey: envOrThrow("OPENAI_API_KEY"),
    baseUrl: env("OPENAI_BASE_URL") ?? "https://api.openai.com/v1",
    model: env("OPENAI_FALLBACK_MODEL") ?? "gpt-4o-mini",
  };
}
