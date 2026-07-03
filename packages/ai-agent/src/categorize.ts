import type { CategorizeInput, CategorizeResult, AiOptions } from "./types";
import { structuredCompletion } from "./client";

/**
 * Categorize an expense based on its description and amount.
 * Returns the best matching category from the available list.
 */
export async function categorizeExpense(
  input: CategorizeInput,
  opts: AiOptions,
): Promise<CategorizeResult> {
  const systemPrompt = `Та зарлагын бичлэгийг ангилалд хуваарилдаг AI туслах.
Өгөгдсөн тайлбар болон дүнгээр хамгийн тохирох ангиллыг сонгоно.`;

  const userPrompt = `Зарлагын дэлгэрэнгүй: "${input.description}"
Дүн: ${input.amount}₮
Боломжит ангилалууд: ${input.availableCategories.join(", ")}

JSON хэлбэрээр хариулах: { "category": "...", "confidence": 0.0-1.0 }`;

  return structuredCompletion<CategorizeResult>({
    ...opts,
    systemPrompt,
    userPrompt,
    schemaDescription: `{ "category": "selected category name", "confidence": 0.0-1.0 (итгэлтэй байдлын түвшин) }`,
    temperature: 0.1,
    maxTokens: 256,
  });
}
