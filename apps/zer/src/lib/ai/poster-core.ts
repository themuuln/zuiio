import { fal } from "@fal-ai/client";
import { capture } from "@zuiio/capture";
import sharp from "sharp";

export type PosterStyle = {
  id: string;
  label: string;
  prompt: string;
};

export type PlatformSize = {
  label: string;
  width: number;
  height: number;
};

export const POSTER_STYLES: PosterStyle[] = [
  { id: "minimal", label: "Минимал", prompt: "clean minimal design, lots of white space, elegant, product-focused" },
  { id: "studio", label: "Studio", prompt: "professional studio photography, soft lighting, clean background, high-end product shot" },
  { id: "elegant", label: "Elegant", prompt: "elegant luxury design, premium feel, sophisticated tones, refined" },
  { id: "nature", label: "Байгалийн", prompt: "natural outdoor setting, green tones, organic feel, eco-friendly" },
  { id: "gradient", label: "Gradient", prompt: "smooth gradient background, modern colorful design, trending gradient style" },
  { id: "model_male", label: "Эрэгтэй загвар", prompt: "male model wearing or holding the product, lifestyle fashion photography" },
  { id: "model_female", label: "Эмэгтэй загвар", prompt: "female model wearing or holding the product, lifestyle fashion photography" },
  { id: "model_couple", label: "Хос загвар", prompt: "couple together with the product, lifestyle photography, warm and inviting" },
  { id: "custom", label: "Тохируулах", prompt: "" },
];

export const PLATFORM_SIZES: Record<string, PlatformSize> = {
  instagram: { label: "Instagram (1:1)", width: 1080, height: 1080 },
  facebook: { label: "Facebook (1.91:1)", width: 1200, height: 630 },
  web: { label: "Вэб (16:9)", width: 1920, height: 1080 },
  print_a4: { label: "A4", width: 2480, height: 3508 },
};

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function getDimensions(platform: string): { width: number; height: number } | undefined {
  const size = PLATFORM_SIZES[platform];
  return size ? { width: size.width, height: size.height } : undefined;
}

function generateSvgOverlay(text: string, width: number, height: number): string {
  const escaped = escapeXml(text);
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { fill: white; font-family: 'Arial', 'Sans-serif'; font-size: 48px; font-weight: bold; }
    .subtitle { fill: #cccccc; font-family: 'Arial', 'Sans-serif'; font-size: 24px; }
  </style>
  <rect width="100%" height="100%" fill="rgba(0,0,0,0.35)" rx="12"/>
  <text x="50%" y="45%" text-anchor="middle" class="title" dominant-baseline="middle">${escaped}</text>
</svg>`;
}

export interface GeneratePosterParams {
  productName: string;
  productImageUrl: string;
  styleId: string;
  platform: string;
  customPrompt?: string;
  promotionalText?: string;
}

export interface GeneratePosterCoreResult {
  posterUrl?: string;
  error?: string;
}

export async function generatePosterCore(params: GeneratePosterParams): Promise<GeneratePosterCoreResult> {
  const { productName, productImageUrl, styleId, platform, customPrompt, promotionalText } = params;

  const style = POSTER_STYLES.find((s) => s.id === styleId);
  const stylePrompt = styleId === "custom" && customPrompt ? customPrompt : (style?.prompt ?? "");
  const prompt = stylePrompt
    ? `A product poster for ${productName}, ${stylePrompt}, Mongolian market, ${platform}`
    : `A product poster for ${productName}, Mongolian market, ${platform}`;

  const imageSize = getDimensions(platform);

  try {
    fal.config({ credentials: process.env.FAL_API_KEY });
  } catch {
    return { error: "AI үйлчилгээний тохиргоо дутуу байна. FAL_API_KEY тохируулна уу." };
  }

  try {
    const result = await fal.run("fal-ai/flux-pro/v1.1/redux", {
      input: {
        prompt,
        image_url: productImageUrl,
        image_size: imageSize,
        num_images: 1,
      },
    });

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      return { error: "Зураг үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." };
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return { error: "Үүсгэсэн зургийг татахад алдаа гарлаа." };
    }

    let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Composite text overlay
    if (promotionalText && imageSize) {
      const svgText = generateSvgOverlay(promotionalText, imageSize.width, imageSize.height);
      imageBuffer = await sharp(imageBuffer)
        .resize(imageSize.width, imageSize.height, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      imageBuffer = await sharp(imageBuffer)
        .resize(imageSize?.width, imageSize?.height, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .webp({ quality: 85 })
        .toBuffer();
    }

    return { posterUrl: `data:image/webp;base64,${imageBuffer.toString("base64")}` };
  } catch (e) {
    capture(e, { context: "generatePosterCore" });
    const message = e instanceof Error ? e.message : "Тодорхойгүй алдаа";
    return { error: `Постер үүсгэхэд алдаа гарлаа: ${message}` };
  }
}
