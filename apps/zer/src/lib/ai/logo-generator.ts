import "server-only";
import { fal } from "@fal-ai/client";
import { capture } from "@zuiio/capture";

export async function generateLogo(params: {
  businessName: string;
  industry?: string;
  style?: "minimal" | "modern" | "classic" | "playful";
}): Promise<{ imageUrl?: string; error?: string }> {
  try {
    fal.config({ credentials: process.env.FAL_API_KEY });

    const prompt = buildLogoPrompt(
      params.businessName,
      params.industry,
      params.style,
    );

    const result = await fal.run("fal-ai/flux-pro/v1.1", {
      input: {
        prompt,
        image_size: { width: 512, height: 512 },
        num_images: 1,
      },
    });

    return { imageUrl: result.data.images[0].url };
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
