"use server";

import * as Sentry from "@sentry/nextjs";
import { capture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity, revalidateEntityTag } from "@/lib/revalidate";
import {
  generatePosterCore,
  POSTER_STYLES,
  PLATFORM_SIZES,
  type GeneratePosterCoreResult,
  type PosterStyle,
  type PlatformSize,
} from "@/lib/ai/poster-core";

// Re-export types for consumers
export type { PosterStyle, PlatformSize };
export { POSTER_STYLES, PLATFORM_SIZES };

export type GeneratePosterResult = GeneratePosterCoreResult;

/**
 * generatePoster — Server Action
 *
 * Receives a FormData from the client, validates auth, delegates to
 * generatePosterCore for the Fal.ai + Sharp pipeline, then stores the
 * result in Supabase Storage and revalidates.
 */
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
      const productImageUrl = formData.get("product_image_url")?.toString() ?? "";
      const styleId = formData.get("style_id")?.toString() ?? "";
      const platform = formData.get("platform")?.toString() ?? "";
      const customPrompt = formData.get("custom_prompt")?.toString() ?? "";
      const promotionalText = formData.get("promotional_text")?.toString() ?? "";

      if (!productName || !productImageUrl || !styleId || !platform) {
        return { error: "Бүх шаардлагатай талбаруудыг бөглөнө үү." };
      }

      span.setAttributes({ style_id: styleId, platform, has_custom_prompt: !!customPrompt, has_promotional_text: !!promotionalText });

      // ── Phase 3: Generate via core ──────────────────────────────────────
      const coreResult = await generatePosterCore({
        productName,
        productImageUrl,
        styleId,
        platform,
        customPrompt,
        promotionalText,
      });

      if ("error" in coreResult) {
        return coreResult;
      }

      // ── Phase 4: Store in Supabase Storage ──────────────────────────────
      if (!coreResult.posterUrl) {
        return { error: "Постер үүсгэхэд алдаа гарлаа." };
      }

      try {
        const base64Data = coreResult.posterUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}_${random}`;
        const filePath = `posters/${organizationId}/${fileName}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("ai-posters")
          .upload(filePath, buffer, {
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) {
          capture(uploadError, { context: "generatePoster: storage upload" });
        } else {
          const { data: publicUrl } = supabase.storage
            .from("ai-posters")
            .getPublicUrl(filePath);

          revalidateEntity("shop");
          revalidateEntityTag("products", organizationId);

          span.setAttribute("poster_path", filePath);
          return { posterUrl: publicUrl.publicUrl };
        }
      } catch (err) {
        capture(err, { context: "generatePoster: storage post-process" });
      }

      // Fallback: return base64 data URL if storage fails
      return { posterUrl: coreResult.posterUrl };
    },
  );
}
