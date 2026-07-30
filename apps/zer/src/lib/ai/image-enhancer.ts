import "server-only";
import { fal } from "@fal-ai/client";
import { capture } from "@zuiio/capture";

export async function removeBackground(
  imageUrl: string,
): Promise<{ imageUrl?: string; error?: string }> {
  try {
    fal.config({ credentials: process.env.FAL_API_KEY });

    const result = await fal.run("fal-ai/bria/background/remove", {
      input: { image_url: imageUrl },
    });

    return { imageUrl: result.data.image.url };
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
    fal.config({ credentials: process.env.FAL_API_KEY });

    const result = await fal.run("fal-ai/image-apps-v2/product-photography", {
      input: {
        product_image_url: imageUrl,
      },
    });

    return { imageUrl: result.data.images[0].url };
  } catch (e) {
    capture(e, { context: "enhanceProductPhoto" });
    return { error: "Зураг сайжруулахад алдаа гарлаа." };
  }
}
