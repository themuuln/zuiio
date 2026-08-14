"use server";

import { capture } from "@zuiio/capture";
import { generateLogo } from "@/lib/ai/logo-generator";

export interface GenerateLogoResult {
  imageUrl?: string;
  error?: string;
  businessName?: string;
  industry?: string;
  style?: string;
}

export async function generateLogoAction(
  _prev: GenerateLogoResult | undefined,
  formData: FormData,
): Promise<GenerateLogoResult> {
  try {
    const businessName = formData.get("businessName") as string;
    const industry = (formData.get("industry") as string) || undefined;
    const style = (formData.get("style") as string) || undefined;

    if (!businessName?.trim()) {
      return { error: "Бизнесийн нэр оруулна уу." };
    }

    const result = await generateLogo({
      businessName: businessName.trim(),
      industry,
      style: style as "minimal" | "modern" | "classic" | "playful" | undefined,
    });

    return {
      imageUrl: result.imageUrl,
      error: result.error,
      businessName: businessName.trim(),
      industry,
      style,
    };
  } catch (e) {
    capture(e, { context: "generateLogoAction" });
    return { error: "Лого үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." };
  }
}
