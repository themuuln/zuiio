import "server-only";
import { chatCompletion } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";

export async function generateProductDescription(params: {
  productName: string;
  category?: string;
  price?: number;
  sku?: string;
  existingDescription?: string;
}): Promise<{ description?: string; error?: string }> {
  try {
    const prompt = buildPrompt(params);
    const description = await chatCompletion({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "",
      systemPrompt:
        "Та Монгол e-commerce бүтээгдэхүүний тайлбар бичдэг мэргэжилтэн. Таны бичсэн тайлбар нь худалдан авагчийн анхаарлыг татаж, бүтээгдэхүүний борлуулалтыг нэмэгдүүлэхэд чиглэгдсэн байх ёстой.",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 500,
    });
    return { description: description.trim() };
  } catch (e) {
    capture(e, { context: "generateProductDescription" });
    return {
      error: "Тайлбар үүсгэхэд алдаа гарлаа. Дахиж оролдоно уу.",
    };
  }
}

function buildPrompt(params: {
  productName: string;
  category?: string;
  price?: number;
  sku?: string;
  existingDescription?: string;
}): string {
  let prompt = `Бүтээгдэхүүний нэр: ${params.productName}\n`;
  if (params.category) prompt += `Ангилал: ${params.category}\n`;
  if (params.price) prompt += `Үнэ: ${params.price}₮\n`;
  if (params.sku) prompt += `SKU: ${params.sku}\n`;
  if (params.existingDescription)
    prompt += `Одоогийн тайлбар: ${params.existingDescription}\n`;
  prompt += `\nДээрх бүтээгдэхүүний борлуулалтын тайлбарыг 3-4 өгүүлбэрээр бичнэ үү.\nТайлбар:\n- Монгол хэлээр (Кирилл)\n- Худалдан авагчийн анхаарлыг татсан\n- Бүтээгдэхүүний гол онцлогуудыг тодорхойлсон\n- 2000 тэмдэгтээс хэтрэхгүй`;
  return prompt;
}
