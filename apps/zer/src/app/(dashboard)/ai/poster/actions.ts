"use server";

import { fal } from "@fal-ai/client";
import * as Sentry from "@sentry/nextjs";
import { capture } from "@zuiio/capture";
import sharp from "sharp";

import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity, revalidateEntityTag } from "@/lib/revalidate";

// ─── Types & Constants ──────────────────────────────────────────────────────

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
  {
    id: "minimal",
    label: "Минимал",
    prompt:
      "clean minimal design, lots of white space, elegant, product-focused",
  },
  {
    id: "luxury",
    label: "Тансаг",
    prompt: "luxury premium design, gold accents, sophisticated, high-end feel",
  },
  {
    id: "sale",
    label: "Хямдрал",
    prompt:
      "sale promotion, bright colors, attention-grabbing, discount feel, celebratory",
  },
  {
    id: "seasonal",
    label: "Улирлын",
    prompt: "seasonal theme, festive decorations, holiday-appropriate colors",
  },
  {
    id: "modern",
    label: "Орчин үеийн",
    prompt: "modern trendy design, bold colors, contemporary, minimalist",
  },
  {
    id: "nature",
    label: "Байгалийн",
    prompt: "natural outdoor setting, green tones, organic feel, eco-friendly",
  },
  {
    id: "tech",
    label: "Технологи",
    prompt: "tech modern design, blue tones, digital feel, innovative",
  },
  {
    id: "food",
    label: "Хоол",
    prompt: "appetizing food presentation, warm colors, delicious, fresh",
  },
  {
    id: "custom",
    label: "Тохируулах",
    prompt: "",
  },
];

export const PLATFORM_SIZES: Record<string, PlatformSize> = {
  instagram: { label: "Instagram (1:1)", width: 1080, height: 1080 },
  facebook: { label: "Facebook (1.91:1)", width: 1200, height: 630 },
  web: { label: "Вэб (16:9)", width: 1920, height: 1080 },
  print_a4: { label: "A4", width: 2480, height: 3508 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getDimensions(
  platform: string,
): { width: number; height: number } | undefined {
  const size = PLATFORM_SIZES[platform];
  if (size) {
    return { width: size.width, height: size.height };
  }
  return undefined;
}

function generateSvgOverlay(
  text: string,
  width: number,
  height: number,
): string {
  const escaped = escapeXml(text);

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { fill: white; font-family: 'Arial', 'Sans-serif'; font-size: 48px; font-weight: bold; }
    .subtitle { fill: #cccccc; font-family: 'Arial', 'Sans-serif'; font-size: 24px; }
    .price { fill: #FFD700; font-family: 'Arial', 'Sans-serif'; font-size: 36px; font-weight: bold; }
  </style>
  <rect width="100%" height="100%" fill="rgba(0,0,0,0.35)" rx="12"/>
  <text x="50%" y="45%" text-anchor="middle" class="title" dominant-baseline="middle">${escaped}</text>
</svg>`;
}

// ─── Server Action ───────────────────────────────────────────────────────────

export type GeneratePosterResult = {
  posterUrl?: string;
  error?: string;
};

export async function generatePoster(
  _prevState: GeneratePosterResult | undefined,
  formData: FormData,
): Promise<GeneratePosterResult> {
  return Sentry.startSpan(
    { name: "generatePoster", op: "ai.poster" },
    async (span) => {
      // ── Phase 1: Auth ───────────────────────────────────────────────────
      const ctx = await requireActionContext("products.update");
      if ("error" in ctx) return ctx;
      const { supabase, organizationId } = ctx;
      span.setAttribute("org_id", organizationId);

      // ── Phase 2: Parse input ────────────────────────────────────────────
      const productName = formData.get("product_name")?.toString() ?? "";
      const productImageUrl =
        formData.get("product_image_url")?.toString() ?? "";
      const styleId = formData.get("style_id")?.toString() ?? "";
      const platform = formData.get("platform")?.toString() ?? "";
      const customPrompt = formData.get("custom_prompt")?.toString() ?? "";
      const promotionalText =
        formData.get("promotional_text")?.toString() ?? "";

      if (!productName || !productImageUrl || !styleId || !platform) {
        return { error: "Бүх шаардлагатай талбаруудыг бөглөнө үү." };
      }

      // ── Phase 3: Build Fal.ai prompt ────────────────────────────────────
      const style = POSTER_STYLES.find((s) => s.id === styleId);
      const stylePrompt =
        styleId === "custom" && customPrompt
          ? customPrompt
          : (style?.prompt ?? "");

      const prompt = stylePrompt
        ? `A product poster for ${productName}, ${stylePrompt}, Mongolian market, ${platform}`
        : `A product poster for ${productName}, Mongolian market, ${platform}`;

      const imageSize = getDimensions(platform);

      span.setAttributes({
        style_id: styleId,
        platform,
        has_custom_prompt: !!customPrompt,
        has_promotional_text: !!promotionalText,
        image_size: imageSize
          ? `${imageSize.width}x${imageSize.height}`
          : "default",
      });

      // ── Phase 4: Call Fal.ai ────────────────────────────────────────────
      let generatedImageBuffer: Buffer | null = null;

      try {
        fal.config({
          credentials: process.env.FAL_API_KEY,
        });

        const result = await fal.run("fal-ai/flux-pro/v1.1/redux", {
          input: {
            prompt,
            image_url: productImageUrl,
            image_size: imageSize,
            num_images: 1,
          },
        });

        // The result contains an array of images
        const imageUrl = result.data?.images?.[0]?.url;
        if (!imageUrl) {
          return { error: "Зураг үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." };
        }

        // Fetch the generated image as a buffer
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return {
            error: "Үүсгэсэн зургийг татахад алдаа гарлаа. Дахин оролдоно уу.",
          };
        }
        generatedImageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // ── Phase 5: Composite text overlay (optional) ────────────────────
        if (promotionalText && imageSize) {
          const svgText = generateSvgOverlay(
            promotionalText,
            imageSize.width,
            imageSize.height,
          );

          generatedImageBuffer = await sharp(generatedImageBuffer)
            .resize(imageSize.width, imageSize.height, {
              fit: "contain",
              background: { r: 255, g: 255, b: 255, alpha: 0 },
            })
            .composite([
              {
                input: Buffer.from(svgText),
                top: 0,
                left: 0,
              },
            ])
            .webp({ quality: 85 })
            .toBuffer();
        } else if (!promotionalText) {
          // Still convert to webp for consistency
          generatedImageBuffer = await sharp(generatedImageBuffer)
            .resize(imageSize?.width, imageSize?.height, {
              fit: "contain",
              background: { r: 255, g: 255, b: 255, alpha: 0 },
            })
            .webp({ quality: 85 })
            .toBuffer();
        }

        // ── Phase 6: Upload to Supabase Storage ───────────────────────────
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}_${random}`;
        const filePath = `posters/${organizationId}/${fileName}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("ai-posters")
          .upload(filePath, generatedImageBuffer, {
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) {
          capture(uploadError, {
            context: "ai-poster: storage upload",
            orgId: organizationId,
          });
          return { error: "Постер хадгалахад алдаа гарлаа." };
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("ai-posters").getPublicUrl(filePath);

        // Revalidate products since the poster updates product assets
        revalidateEntity("products");
        revalidateEntityTag("products", organizationId);

        return { posterUrl: publicUrl };
      } catch (err) {
        capture(err, {
          context: "ai-poster: generation failed",
          orgId: organizationId,
        });

        // Clean up any partial upload if the buffer was generated but upload failed
        // (the final upload error is already handled above; this catches earlier failures)

        // Determine user-facing error message
        const message =
          err instanceof Error
            ? err.message?.includes("API key")
              ? "AI постер үүсгэгчийн түлхүүр тохируулаагүй байна."
              : err.message?.includes("rate limit")
                ? "Хэт олон хүсэлт илгээсэн байна. Түр хүлээгээд дахин оролдоно уу."
                : err.message?.includes("quota")
                  ? "AI постер үүсгэх квота дууссан байна."
                  : "Постер үүсгэхэд алдаа гарлаа. Дахин оролдоно уу."
            : "Постер үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.";

        return { error: message };
      }
    },
  );
}
