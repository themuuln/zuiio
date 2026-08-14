import "server-only";
import { chatCompletion } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";

export async function suggestStoreNames(params: {
  businessType: string;
  keywords?: string[];
  count?: number;
}): Promise<{ names?: string[]; error?: string }> {
  try {
    const result = await chatCompletion({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "",
      systemPrompt: "Та Монгол бизнесийн нэр санал болгодог мэргэжилтэн.",
      messages: [
        {
          role: "user",
          content: `Бизнесийн төрөл: ${params.businessType}${params.keywords?.length ? `\nТүлхүүр үгс: ${params.keywords.join(", ")}` : ""}\n\nДээрх бизнест тохирох ${params.count || 5} онлайн дэлгүүрийн нэрийг Монгол хэлээр санал болгоно уу. Нэр нь богино, санахад хялбар, Mongolian Cyrillic байх.`,
        },
      ],
      temperature: 0.8,
      maxTokens: 300,
    });
    const names = result
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => l.replace(/^\d+\.\s*/, ""));
    return { names };
  } catch (e) {
    capture(e, { context: "suggestStoreNames" });
    return { error: "Нэр санал болгоход алдаа гарлаа." };
  }
}

export async function suggestDomainNames(params: {
  storeName: string;
}): Promise<{ domains?: string[]; error?: string }> {
  try {
    const result = await chatCompletion({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "",
      systemPrompt:
        "Та Монгол бизнесийн домэйн нэр санал болгодог мэргэжилтэн.",
      messages: [
        {
          role: "user",
          content: `Дэлгүүрийн нэр: ${params.storeName}\n\nДээрх дэлгүүрт тохирох 5 домэйн нэрийг санал болгоно уу. .mn, .com, .co өргөтгөлтэй байж болно. Нэр нь богино, санахад хялбар байх.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 200,
    });
    const domains = result
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => l.replace(/^\d+\.\s*/, ""));
    return { domains };
  } catch (e) {
    capture(e, { context: "suggestDomainNames" });
    return { error: "Домэйн нэр санал болгоход алдаа гарлаа." };
  }
}
