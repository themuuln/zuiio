/**
 * Integration tests for the Blog system.
 *
 * Covers: blog_posts table CRUD, RLS policies, public RPCs
 * (get_public_blog_posts / get_public_blog_post).
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestUserWithPermissions,
  trackCleanup,
} from "./helpers";

describe("Blog CRUD", () => {
  const admin = createAdminClient();

  it("service role can create a blog post", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: post, error } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgId,
        title: "Анхны нийтлэл",
        slug: `first-post-${Date.now()}`,
        content: "Нийтлэлийн агуулга",
        excerpt: "Товч",
        is_published: false,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(post).not.toBeNull();
    expect(post!.title).toBe("Анхны нийтлэл");
    expect(post!.is_published).toBe(false);
    expect(post!.organization_id).toBe(orgId);
    trackCleanup("blog_posts", post!.id);
  });

  it("blog post slug is unique per organization", async () => {
    const { orgId } = await createTestOrg(admin);

    const slug = `dup-${Date.now()}`;
    const { error: firstErr } = await admin.from("blog_posts").insert({
      organization_id: orgId,
      title: "Дубликат 1",
      slug,
      content: "Агуулга 1",
      is_published: true,
    });
    expect(firstErr).toBeNull();

    const { error: secondErr } = await admin.from("blog_posts").insert({
      organization_id: orgId,
      title: "Дубликат 2",
      slug,
      content: "Агуулга 2",
      is_published: true,
    });
    expect(secondErr).not.toBeNull();
    expect(secondErr!.code).toBe("23505");
  });

  it("service role can publish a post", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: post } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgId,
        title: "Хэвлэлд",
        slug: `publish-${Date.now()}`,
        content: "Агуулга",
        is_published: false,
      })
      .select()
      .single();
    trackCleanup("blog_posts", post!.id);

    const { data: updated, error } = await admin
      .from("blog_posts")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq("id", post!.id)
      .eq("organization_id", orgId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updated!.is_published).toBe(true);
    expect(updated!.published_at).not.toBeNull();
  });
});

describe("Blog RLS", () => {
  const admin = createAdminClient();

  it("anon cannot read blog_posts directly", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: post } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgId,
        title: "Хувийн нийтлэл",
        slug: `private-${Date.now()}`,
        content: "Агуулга",
        is_published: true,
      })
      .select()
      .single();
    trackCleanup("blog_posts", post!.id);

    // Anon has no table grants — PostgREST returns permission denied.
    const anon = createAnonClient();
    const { data, error } = await anon
      .from("blog_posts")
      .select("*")
      .eq("id", post!.id);

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("user with blog.read can read own org posts", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const { data: post } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgId,
        title: "Дотоод нийтлэл",
        slug: `internal-${Date.now()}`,
        content: "Агуулга",
        is_published: true,
      })
      .select()
      .single();
    trackCleanup("blog_posts", post!.id);

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "blog.read",
    ]);

    const { data: results, error } = await user.client
      .from("blog_posts")
      .select("*")
      .eq("id", post!.id);

    expect(error).toBeNull();
    expect(results).toHaveLength(1);
    expect(results![0].id).toBe(post!.id);
  });

  it("user with blog.create can create posts", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "blog.create",
    ]);

    // Insert succeeds (no .select() — read-back needs blog.read)
    const { error } = await user.client.from("blog_posts").insert({
      organization_id: orgId,
      title: "Хэрэглэгчийн нийтлэл",
      slug: `user-created-${Date.now()}`,
      content: "Агуулга",
      is_published: false,
    });

    expect(error).toBeNull();

    // Verify via service role
    const { data: posts } = await admin
      .from("blog_posts")
      .select("id")
      .eq("organization_id", orgId)
      .eq("title", "Хэрэглэгчийн нийтлэл");
    expect(posts).toHaveLength(1);
    trackCleanup("blog_posts", posts![0].id);
  });

  it("user without blog.read cannot read posts", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const { data: post } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgId,
        title: "Хязгаарлагдмал",
        slug: `restricted-${Date.now()}`,
        content: "Агуулга",
        is_published: true,
      })
      .select()
      .single();
    trackCleanup("blog_posts", post!.id);

    // User with products.read only — no blog.read
    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "products.read",
    ]);

    const { data: results, error } = await user.client
      .from("blog_posts")
      .select("*")
      .eq("id", post!.id);

    expect(error).toBeNull();
    expect(results).toEqual([]);
  });

  it("RLS scopes blog_posts to organization", async () => {
    const { orgId: orgA, org: orgAEntity } = await createTestOrg(admin);
    const { orgId: orgB } = await createTestOrg(admin);

    const { data: postB } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgB,
        title: "Org B post",
        slug: `orgb-${Date.now()}`,
        content: "Агуулга",
        is_published: true,
      })
      .select()
      .single();
    trackCleanup("blog_posts", postB!.id);

    const userA = await createTestUserWithPermissions(
      admin,
      orgA,
      orgAEntity.name,
      ["blog.read"],
    );

    const { data: results, error } = await userA.client
      .from("blog_posts")
      .select("*")
      .eq("id", postB!.id);

    expect(error).toBeNull();
    expect(results).toEqual([]);
  });
});

describe("Public blog RPCs", () => {
  const admin = createAdminClient();

  it("get_public_blog_posts returns only published posts", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const { data: published } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgId,
        title: "Нийтэлсэн нийтлэл",
        slug: `pub-${Date.now()}`,
        content: "Агуулга",
        excerpt: "Товч",
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();
    trackCleanup("blog_posts", published!.id);

    const { data: draft } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgId,
        title: "Ноорог нийтлэл",
        slug: `draft-${Date.now()}`,
        content: "Агуулга",
        is_published: false,
      })
      .select()
      .single();
    trackCleanup("blog_posts", draft!.id);

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_public_blog_posts", {
      p_slug: org.slug,
    });

    expect(error).toBeNull();
    const posts = data as Array<{ id: string; title: string }>;
    expect(posts.some((p) => p.id === published!.id)).toBe(true);
    expect(posts.some((p) => p.id === draft!.id)).toBe(false);
  });

  it("get_public_blog_post returns a published post by slug", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const slug = `detail-${Date.now()}`;

    const { data: post } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgId,
        title: "Дэлгэрэнгүй нийтлэл",
        slug,
        content: "Бүтэн агуулга",
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();
    trackCleanup("blog_posts", post!.id);

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_public_blog_post", {
      p_slug: org.slug,
      p_post_slug: slug,
    });

    expect(error).toBeNull();
    const result = data as { id: string; title: string; content: string };
    expect(result.id).toBe(post!.id);
    expect(result.content).toBe("Бүтэн агуулга");
  });

  it("get_public_blog_post returns null for draft posts", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const slug = `hidden-${Date.now()}`;

    const { data: post } = await admin
      .from("blog_posts")
      .insert({
        organization_id: orgId,
        title: "Нуугдмал нийтлэл",
        slug,
        content: "Агуулга",
        is_published: false,
      })
      .select()
      .single();
    trackCleanup("blog_posts", post!.id);

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_public_blog_post", {
      p_slug: org.slug,
      p_post_slug: slug,
    });

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("get_public_blog_posts returns null for unknown org", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_public_blog_posts", {
      p_slug: "no-such-org",
    });

    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});
