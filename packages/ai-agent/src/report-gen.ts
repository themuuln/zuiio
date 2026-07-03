import type { ReportInput, AiOptions } from "./types";
import { chatCompletion } from "./client";

/**
 * Generate a natural-language evening report in Mongolian from daily data.
 * Returns Telegram-ready Markdown text.
 *
 * Set `input.businessType` for vertical-specific prompts (e.g. "шашны дэлгүүр").
 */
export async function generateEveningReport(
  input: ReportInput,
  opts: AiOptions,
): Promise<string> {
  const dataJson = JSON.stringify(input, null, 2);

  const businessContext = input.businessType
    ? `${input.businessType}-ийн `
    : "";
  const systemPrompt = `Та ${businessContext}өдөр тутмын тайлан бичдэг туслах.
Өгөгдсөн тоон мэдээллээр Монгол хэлээр богино, мэдээлэлтэй өдрийн тойм бичнэ үү.

Дүрэм:
- Монгол хэлээр, энгийн ойлгомжтой бичнэ
- Хамгийн чухал 3-5 зүйлийг онцолно
- Борлуулалт, ашиг, зарлага, онцлох бараа, дуусаж буй нөөцийг дурдах
- Telegram Markdown формат ашиглах (*bold*)
- 300 тэмдэгтээс хэтрэхгүй
- Эерэг, хэрэгтэй мэдээлэл өгөх
- Хэрэв тухайн өдөр борлуулалт байхгүй бол шалтгааныг товч дурдах

Гаргах формат:
*[Оргины нэр]* — Өдрийн тойм [огноо]

[Тойм текст]

📊 *Борлуулалт:* [дүн]₮
💵 *Ашиг:* [дүн]₮
📉 *Зарлага:* [дүн]₮
📦 *Шилдэг бараа:* [нэр] — [тоо]ш
⚠️ *Дуусаж буй:* [тоо] бараа`;

  const userPrompt = `Дараах өдрийн мэдээллээр тайлан бичнэ үү:\n\n${dataJson}`;

  return chatCompletion({
    ...opts,
    systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.7,
    maxTokens: 800,
  });
}
