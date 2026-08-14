"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { after } from "next/server";
import { requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities, revalidateEntityTag } from "@/lib/revalidate";

export type ReviewStatus = "pending" | "approved" | "rejected";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Хүлээгдэж буй",
  approved: "Батлагдсан",
  rejected: "Татгалзсан",
};

/**
 * Moderate (approve/reject) a review.
 * Requires `reviews.update` permission.
 */
export async function moderateReview(reviewId: string, status: ReviewStatus) {
  const ctx = await requireWriteAction("reviews.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return { error: "Буруу төлөв." };
  }

  // Fetch review for audit before updating
  const { data: review, error: fetchError } = await withDbCapture(
    "reviews: fetch for moderation",
    supabase
      .from("reviews")
      .select("id, status, product_id")
      .eq("id", reviewId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !review) {
    return { error: "Сэтгэгдэл олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "reviews: moderate",
    supabase
      .from("reviews")
      .update({
        status,
        moderated_by: userId,
        moderated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "moderateReview: update" });
    return { error: `Сэтгэгдэл шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "updated",
      "review",
      reviewId,
      { status: { old: review.status, new: status } },
      `Сэтгэгдэл ${STATUS_LABELS[status].toLowerCase()} хийсэн`,
    ),
  );

  revalidateEntities(["reviews"]);
  revalidateEntityTag("products", organizationId);
  return { success: true as const, error: undefined };
}

/**
 * Delete a review.
 * Requires `reviews.delete` permission.
 */
export async function deleteReview(reviewId: string) {
  const ctx = await requireWriteAction("reviews.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  // Fetch review for audit before deleting
  const { data: review, error: fetchError } = await withDbCapture(
    "reviews: fetch for delete",
    supabase
      .from("reviews")
      .select("id, customer_name")
      .eq("id", reviewId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !review) {
    return { error: "Сэтгэгдэл олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "reviews: delete",
    supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "deleteReview: delete" });
    return { error: `Сэтгэгдэл устгахад алдаа гарлаа: ${error.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "deleted",
      "review",
      reviewId,
      undefined,
      `Сэтгэгдэл "${review.customer_name}" устгасан`,
    ),
  );

  revalidateEntities(["reviews"]);
  revalidateEntityTag("products", organizationId);
  return { success: true as const, error: undefined };
}
