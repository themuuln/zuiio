"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { after } from "next/server";
import { requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || `post-${Date.now()}`;
}

// ─── Create ────────────────────────────────────────────────────────

export async function createBlogPost(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("blog.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const title = getString(formData, "title");
  const content = getString(formData, "content");
  const excerpt = getString(formData, "excerpt");
  const coverImageUrl = getString(formData, "cover_image_url");
  const isPublished = formData.get("is_published") === "true";

  if (!title) {
    return { error: "Гарчиг шаардлагатай." };
  }
  if (!content) {
    return { error: "Агуулга шаардлагатай." };
  }

  const slug = slugify(title);
  const publishedAt = isPublished ? new Date().toISOString() : null;

  const { data: post, error: postError } = await withDbCapture(
    "blog: create post",
    supabase
      .from("blog_posts")
      .insert({
        organization_id: organizationId,
        title,
        slug,
        excerpt: excerpt || null,
        content,
        cover_image_url: coverImageUrl || null,
        is_published: isPublished,
        published_at: publishedAt,
        created_by: userId,
      })
      .select("id, slug")
      .single(),
  );

  if (postError) {
    // Slug collision → append a suffix for uniqueness
    if (postError.code === "23505") {
      const { data: retryPost, error: retryError } = await withDbCapture(
        "blog: create post with unique slug",
        supabase
          .from("blog_posts")
          .insert({
            organization_id: organizationId,
            title,
            slug: `${slug}-${Date.now().toString(36)}`,
            excerpt: excerpt || null,
            content,
            cover_image_url: coverImageUrl || null,
            is_published: isPublished,
            published_at: publishedAt,
            created_by: userId,
          })
          .select("id")
          .single(),
      );
      if (retryError) {
        capture(retryError, { context: "createBlogPost: unique slug retry" });
        return {
          error: `Нийтлэл үүсгэхэд алдаа гарлаа: ${retryError.message}`,
        };
      }
      after(() =>
        logAuditEventWithClient(
          supabase,
          organizationId,
          userId,
          "created",
          "blog_post",
          retryPost.id,
          undefined,
          `Нийтлэл "${title}" үүсгэсэн`,
        ),
      );
      revalidateEntities(["blog"]);
      return { success: true as const, error: undefined };
    }
    capture(postError, { context: "createBlogPost: insert" });
    return { error: `Нийтлэл үүсгэхэд алдаа гарлаа: ${postError.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "blog_post",
      post.id,
      undefined,
      `Нийтлэл "${title}" үүсгэсэн`,
    ),
  );

  revalidateEntities(["blog"]);
  return { success: true as const, error: undefined };
}

// ─── Update ────────────────────────────────────────────────────────

export async function updateBlogPost(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("blog.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const postId = getString(formData, "id");
  if (!postId) {
    return { error: "Нийтлэлийн ID олдсонгүй." };
  }

  const title = getString(formData, "title");
  const content = getString(formData, "content");
  const excerpt = getString(formData, "excerpt");
  const coverImageUrl = getString(formData, "cover_image_url");
  const isPublished = formData.get("is_published") === "true";

  if (!title) {
    return { error: "Гарчиг шаардлагатай." };
  }
  if (!content) {
    return { error: "Агуулга шаардлагатай." };
  }

  // Fetch existing post to determine published_at handling
  const { data: existing, error: fetchError } = await withDbCapture(
    "blog: fetch post for update",
    supabase
      .from("blog_posts")
      .select("title, slug, is_published")
      .eq("id", postId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !existing) {
    return { error: "Нийтлэл олдсонгүй." };
  }

  // Keep existing slug unless title changed; new publish sets published_at.
  const slug = existing.title === title ? existing.slug : slugify(title);
  const publishedAt =
    isPublished && !existing.is_published ? new Date().toISOString() : null;

  const { error: updateError } = await withDbCapture(
    "blog: update post",
    supabase
      .from("blog_posts")
      .update({
        title,
        slug,
        excerpt: excerpt || null,
        content,
        cover_image_url: coverImageUrl || null,
        is_published: isPublished,
        published_at: isPublished
          ? (publishedAt ?? (existing.is_published ? undefined : null))
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("organization_id", organizationId),
  );

  if (updateError) {
    capture(updateError, { context: "updateBlogPost: update" });
    return { error: `Нийтлэл шинэчлэхэд алдаа гарлаа: ${updateError.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "updated",
      "blog_post",
      postId,
      undefined,
      `Нийтлэл "${title}" шинэчилсэн`,
    ),
  );

  revalidateEntities(["blog"]);
  return { success: true as const, error: undefined };
}

// ─── Toggle publish ────────────────────────────────────────────────

export async function toggleBlogPostPublished(
  postId: string,
  isPublished: boolean,
) {
  const ctx = await requireWriteAction("blog.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const { data: post, error: fetchError } = await withDbCapture(
    "blog: fetch for publish toggle",
    supabase
      .from("blog_posts")
      .select("title")
      .eq("id", postId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !post) {
    return { error: "Нийтлэл олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "blog: toggle publish",
    supabase
      .from("blog_posts")
      .update({
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "toggleBlogPostPublished: update" });
    return {
      error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  const action = isPublished ? "Нийтэлсэн" : "Нийтлэлээс хассан";

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      isPublished ? "published" : "unpublished",
      "blog_post",
      postId,
      { is_published: { old: !isPublished, new: isPublished } },
      `Нийтлэл "${post.title}" ${action}`,
    ),
  );

  revalidateEntities(["blog"]);
  return { success: true as const, error: undefined };
}

// ─── Delete ────────────────────────────────────────────────────────

export async function deleteBlogPost(postId: string) {
  const ctx = await requireWriteAction("blog.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const { data: post, error: fetchError } = await withDbCapture(
    "blog: fetch for delete",
    supabase
      .from("blog_posts")
      .select("title")
      .eq("id", postId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !post) {
    return { error: "Нийтлэл олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "blog: delete post",
    supabase
      .from("blog_posts")
      .delete()
      .eq("id", postId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "deleteBlogPost: delete" });
    return { error: `Нийтлэл устгахад алдаа гарлаа: ${error.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "deleted",
      "blog_post",
      postId,
      undefined,
      `Нийтлэл "${post.title}" устгасан`,
    ),
  );

  revalidateEntities(["blog"]);
  return { success: true as const, error: undefined };
}
