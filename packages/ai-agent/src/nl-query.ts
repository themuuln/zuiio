import type { NLQueryInput, NLQueryResult, AiOptions } from "./types";
import { structuredCompletion } from "./client";

/**
 * Convert a natural language question about shop data into SQL,
 * then explain the result in Mongolian.
 *
 * IMPORTANT: This function ONLY generates the SQL and explanation.
 * Execution of the SQL against the database must be done by the caller
 * with proper read-only role and RLS checks.
 */
export async function nlQuery(
  input: NLQueryInput,
  opts: AiOptions,
): Promise<NLQueryResult> {
  const systemPrompt = `Та Supabase PostgreSQL (14.5) өгөгдлийн сангийн асуултанд хариулдаг AI туслах.
Зөвхөн SELECT query үүсгэнэ. INSERT/UPDATE/DELETE ХОРИГЛОНО.

Таны үүрэг:
1. Асуултыг ойлгож, тохирох SQL SELECT query бичих
2. Тухайн query ямар хариулт өгөхийг Монгол хэлээр тайлбарлах`;

  const schemaPrompt = `Table schema for context:\n${input.tableSchema}\n\n`;
  const userPrompt = `${schemaPrompt}Хэрэглэгчийн асуулт: "${input.question}"\n\nJSON хэлбэрээр хариулах: { "sql": "...", "explanation": "..." }`;

  return structuredCompletion<NLQueryResult>({
    ...opts,
    systemPrompt,
    userPrompt,
    schemaDescription: `{ "sql": "generated SELECT query", "explanation": "Монгол хэлээр тайлбар (100 тэмдэгт)" }`,
    temperature: 0.1,
    maxTokens: 1024,
  });
}
