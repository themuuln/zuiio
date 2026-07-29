"use server";

import { z } from "zod";
import { captureError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  authorName: z.string().trim().min(1, "Нэрээ оруулна уу"),
  rating: z.number().int().min(1, "Үнэлгээ сонгоно уу").max(5),
  content: z.string().trim().default(""),
});

export async function submitProductReviewAction(
  _prevState: { success: boolean; error?: string },
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    authorName: formData.get("authorName"),
    rating: Number(formData.get("rating")),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Өгөгдөл буруу байна",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("product_reviews").insert({
      product_id: parsed.data.productId,
      author_name: parsed.data.authorName,
      rating: parsed.data.rating,
      content: parsed.data.content,
    });

    if (error) {
      captureError("submitProductReviewAction", error);
      return {
        success: false,
        error: "Сэтгэгдэл хадгалахад алдаа гарлаа. Дахин оролдоно уу.",
      };
    }

    return { success: true };
  } catch (err) {
    captureError("submitProductReviewAction", err);
    return { success: false, error: "Серверийн алдаа. Дахин оролдоно уу." };
  }
}
