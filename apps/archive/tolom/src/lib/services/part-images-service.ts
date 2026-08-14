import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";

// ── Types ──────────────────────────────────────────────────────

export interface PartImageRow {
  id: string;
  organization_id: string;
  part_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_by: string;
  created_at: string;
}

// ── Get Part Images ────────────────────────────────────────────

/**
 * Returns all images for a part, ordered by sort_order then primary first.
 */
export async function getPartImages(
  db: SupabaseClient,
  orgId: string,
  partId: string,
): Promise<PartImageRow[]> {
  const { data, error } = await db
    .from("part_images")
    .select(
      "id, organization_id, part_id, image_url, is_primary, sort_order, created_by, created_at",
    )
    .eq("organization_id", orgId)
    .eq("part_id", partId)
    .order("sort_order", { ascending: true })
    .order("is_primary", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Add Part Image ─────────────────────────────────────────────

/**
 * Adds an image reference to a part.
 * If isPrimary is true, unsets primary on all other images for this part.
 */
export async function addPartImage(
  db: SupabaseClient,
  orgId: string,
  partId: string,
  imageUrl: string,
  isPrimary?: boolean,
  userId?: string,
): Promise<PartImageRow> {
  if (!imageUrl?.trim()) throw new ValidationError("Image URL is required");

  const resolvedUserId = userId ?? (await db.auth.getUser()).data.user?.id;
  if (!resolvedUserId) throw new Error("User not authenticated");

  // Get next sort_order
  const { data: maxSort } = await db
    .from("part_images")
    .select("sort_order")
    .eq("organization_id", orgId)
    .eq("part_id", partId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSort = (maxSort?.sort_order ?? -1) + 1;

  // If primary, unset existing primary
  if (isPrimary) {
    const { error: unsetError } = await db
      .from("part_images")
      .update({ is_primary: false })
      .eq("organization_id", orgId)
      .eq("part_id", partId)
      .eq("is_primary", true);

    if (unsetError) throw new Error(unsetError.message);
  }

  const { data, error } = await db
    .from("part_images")
    .insert({
      organization_id: orgId,
      part_id: partId,
      image_url: imageUrl.trim(),
      is_primary: isPrimary ?? false,
      sort_order: nextSort,
      created_by: resolvedUserId,
    })
    .select(
      "id, organization_id, part_id, image_url, is_primary, sort_order, created_by, created_at",
    )
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add image");

  logAuditAfter({
    supabase: db,
    action: "create",
    table_name: "part_images",
    record_id: data.id,
    user_id: resolvedUserId,
    organization_id: orgId,
    new_data: data,
  });

  revalidateTag(cacheTags.partImages(orgId, partId), "max");
  return data;
}

// ── Remove Part Image ──────────────────────────────────────────

/**
 * Removes an image reference from a part.
 */
export async function removePartImage(
  db: SupabaseClient,
  orgId: string,
  imageId: string,
  userId?: string,
): Promise<void> {
  const resolvedUserId = userId ?? (await db.auth.getUser()).data.user?.id;

  // Fetch the image first to get part_id for cache invalidation
  const { data: image } = await db
    .from("part_images")
    .select("id, part_id, organization_id")
    .eq("id", imageId)
    .eq("organization_id", orgId)
    .single();

  if (!image) throw new NotFoundError("Image not found");

  const { error } = await db
    .from("part_images")
    .delete()
    .eq("id", imageId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  logAuditAfter({
    supabase: db,
    action: "delete",
    table_name: "part_images",
    record_id: imageId,
    user_id: resolvedUserId,
    organization_id: orgId,
    old_data: image as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.partImages(orgId, image.part_id), "max");
}

// ── Set Primary Image ──────────────────────────────────────────

/**
 * Sets an image as the primary image for a part.
 * Unsets primary on any other image for the same part.
 */
export async function setPrimaryImage(
  db: SupabaseClient,
  orgId: string,
  partId: string,
  imageId: string,
  userId?: string,
): Promise<PartImageRow> {
  const resolvedUserId = userId ?? (await db.auth.getUser()).data.user?.id;

  // Verify the image exists and belongs to this org/part
  const { data: image } = await db
    .from("part_images")
    .select("id, organization_id, part_id")
    .eq("id", imageId)
    .eq("organization_id", orgId)
    .eq("part_id", partId)
    .single();

  if (!image) throw new NotFoundError("Image not found");

  // Unset existing primary
  const { error: unsetError } = await db
    .from("part_images")
    .update({ is_primary: false })
    .eq("organization_id", orgId)
    .eq("part_id", partId)
    .eq("is_primary", true);

  if (unsetError) throw new Error(unsetError.message);

  // Set new primary
  const { data, error } = await db
    .from("part_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("organization_id", orgId)
    .select(
      "id, organization_id, part_id, image_url, is_primary, sort_order, created_by, created_at",
    )
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to set primary image");

  logAuditAfter({
    supabase: db,
    action: "update",
    table_name: "part_images",
    record_id: imageId,
    user_id: resolvedUserId,
    organization_id: orgId,
    new_data: data,
    old_data: image as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.partImages(orgId, partId), "max");
  return data;
}
