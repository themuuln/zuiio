"use server";

import { capture } from "@zuiio/capture";
import { enhanceProductPhoto, removeBackground } from "@/lib/ai/image-enhancer";

export interface RemoveBgResult {
  imageUrl?: string;
  error?: string;
}

export interface EnhanceResult {
  imageUrl?: string;
  error?: string;
}

export async function removeBackgroundAction(
  imageUrl: string,
): Promise<RemoveBgResult> {
  try {
    const result = await removeBackground(imageUrl);
    return {
      imageUrl: result.imageUrl,
      error: result.error,
    };
  } catch (e) {
    capture(e, { context: "removeBackgroundAction" });
    return { error: "Дэвсгэр арилгахад алдаа гарлаа. Дахин оролдоно уу." };
  }
}

export async function enhanceProductPhotoAction(
  imageUrl: string,
): Promise<EnhanceResult> {
  try {
    const result = await enhanceProductPhoto(imageUrl);
    return {
      imageUrl: result.imageUrl,
      error: result.error,
    };
  } catch (e) {
    capture(e, { context: "enhanceProductPhotoAction" });
    return { error: "Зураг сайжруулахад алдаа гарлаа. Дахин оролдоно уу." };
  }
}
