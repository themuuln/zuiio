import "server-only";
import { capture } from "@zuiio/capture";
import { editImage } from "@/lib/ai/openai-image";

export async function removeBackground(
  imageUrl: string,
): Promise<{ imageUrl?: string; error?: string }> {
  try {
    const result = await editImage({
      imageUrl,
      prompt:
        "Remove the background of this image. Keep only the main subject, cut out cleanly with a transparent background.",
      background: "transparent",
      outputFormat: "png",
      inputFidelity: "high",
    });

    if (result.error) {
      return { error: result.error };
    }
    return result.dataUrl
      ? { imageUrl: result.dataUrl }
      : { error: "Зургийн дэвсгэр арилгахад алдаа гарлаа." };
  } catch (e) {
    capture(e, { context: "removeBackground" });
    return { error: "Зургийн дэвсгэр арилгахад алдаа гарлаа." };
  }
}

export async function enhanceProductPhoto(
  imageUrl: string,
  _style?: string,
): Promise<{ imageUrl?: string; error?: string }> {
  try {
    const result = await editImage({
      imageUrl,
      prompt:
        "Enhance this product photo professionally: improve lighting, colors, sharpness and composition. Make the product look premium and appealing. Keep the product exactly the same.",
      quality: "high",
      outputFormat: "webp",
      inputFidelity: "high",
    });

    if (result.error) {
      return { error: result.error };
    }
    return result.dataUrl
      ? { imageUrl: result.dataUrl }
      : { error: "Зураг сайжруулахад алдаа гарлаа." };
  } catch (e) {
    capture(e, { context: "enhanceProductPhoto" });
    return { error: "Зураг сайжруулахад алдаа гарлаа." };
  }
}
