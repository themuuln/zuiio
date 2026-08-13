import "server-only";
import { capture } from "@zuiio/capture";
import { generateImage } from "@/lib/ai/openai-image";

export async function generateLogo(params: {
  businessName: string;
  industry?: string;
  style?: "minimal" | "modern" | "classic" | "playful";
}): Promise<{ imageUrl?: string; error?: string }> {
  try {
    const prompt = buildLogoPrompt(
      params.businessName,
      params.industry,
      params.style,
    );

    const result = await generateImage({
      prompt,
      size: "1024x1024",
      quality: "high",
      outputFormat: "png",
    });

    if (result.error) {
      return { error: result.error };
    }
    return result.dataUrl
      ? { imageUrl: result.dataUrl }
      : { error: "Лого үүсгэхэд алдаа гарлаа." };
  } catch (e) {
    capture(e, { context: "generateLogo" });
    return { error: "Лого үүсгэхэд алдаа гарлаа." };
  }
}

function buildLogoPrompt(
  name: string,
  industry?: string,
  style?: string,
): string {
  return `Flat vector logo design for "${name}"${industry ? `, a ${industry} business` : ""}. ${style ? `${style} style,` : ""} Clean minimal design, white background, no text, professional, suitable for a Mongolian company.`;
}
