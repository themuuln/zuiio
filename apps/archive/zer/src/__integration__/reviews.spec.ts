/**
 * Integration tests for the Reviews system.
 *
 * Covers: reviews table CRUD, RLS policies, public RPCs
 * (get_public_reviews / submit_product_review).
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestProduct,
  createTestUserWithPermissions,
  trackCleanup,
} from "./helpers";

describe("Reviews CRUD", () => {
  const admin = createAdminClient();

  it("service role can create a review", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: review, error } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        product_id: productId,
        customer_name: "Бат",
        rating: 5,
        comment: "Маш сайн бүтээгдэхүүн",
        status: "pending",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(review).not.toBeNull();
    expect(review!.rating).toBe(5);
    expect(review!.status).toBe("pending");
    expect(review!.organization_id).toBe(orgId);
    trackCleanup("reviews", review!.id);
  });

  it("service role can moderate a review status", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: review } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        product_id: productId,
        customer_name: "Дорж",
        rating: 4,
        comment: "Сайн байна",
        status: "pending",
      })
      .select()
      .single();
    trackCleanup("reviews", review!.id);

    const { data: updated, error } = await admin
      .from("reviews")
      .update({ status: "approved", moderated_at: new Date().toISOString() })
      .eq("id", review!.id)
      .eq("organization_id", orgId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updated!.status).toBe("approved");
    expect(updated!.moderated_at).not.toBeNull();
  });
});

describe("Reviews RLS", () => {
  const admin = createAdminClient();

  it("anon cannot read reviews directly", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: review } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        product_id: productId,
        customer_name: "Ану",
        rating: 3,
        comment: "Дунд зэрэг",
        status: "approved",
      })
      .select()
      .single();
    trackCleanup("reviews", review!.id);

    // Anon has no table grants — PostgREST returns permission denied.
    const anon = createAnonClient();
    const { data, error } = await anon
      .from("reviews")
      .select("*")
      .eq("id", review!.id);

    expect(error).toBeNull(); // table grants exist; RLS row policies block
    expect(data ?? []).toHaveLength(0);
  });

  it("user with reviews.read can read own org reviews", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: review } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        product_id: productId,
        customer_name: "Оюун",
        rating: 5,
        comment: "Гайхалтай",
        status: "approved",
      })
      .select()
      .single();
    trackCleanup("reviews", review!.id);

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "reviews.read",
    ]);

    const { data: results, error } = await user.client
      .from("reviews")
      .select("*")
      .eq("id", review!.id);

    expect(error).toBeNull();
    expect(results).toHaveLength(1);
    expect(results![0].id).toBe(review!.id);
  });

  it("user with reviews.update can moderate reviews", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: review } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        product_id: productId,
        customer_name: "Төмөр",
        rating: 2,
        comment: "Сайжруулах зүйл их",
        status: "pending",
      })
      .select()
      .single();
    trackCleanup("reviews", review!.id);

    // UPDATE requires the row to pass the SELECT policy too (reviews.read)
    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "reviews.read",
      "reviews.update",
    ]);

    const { error } = await user.client
      .from("reviews")
      .update({ status: "rejected", moderated_at: new Date().toISOString() })
      .eq("id", review!.id)
      .eq("organization_id", orgId);

    expect(error).toBeNull();

    // Verify via service role (user lacks reviews.read for .select())
    const { data: moderated } = await admin
      .from("reviews")
      .select("status")
      .eq("id", review!.id)
      .single();
    expect(moderated!.status).toBe("rejected");
  });

  it("user without reviews.read cannot read reviews", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: review } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        product_id: productId,
        customer_name: "Наран",
        rating: 4,
        comment: "Сайн",
        status: "approved",
      })
      .select()
      .single();
    trackCleanup("reviews", review!.id);

    // User with products.read only — no reviews.read
    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "products.read",
    ]);

    const { data: results, error } = await user.client
      .from("reviews")
      .select("*")
      .eq("id", review!.id);

    expect(error).toBeNull();
    expect(results).toEqual([]);
  });

  it("RLS scopes reviews to organization", async () => {
    const { orgId: orgA, org: orgAEntity } = await createTestOrg(admin);
    const { orgId: orgB } = await createTestOrg(admin);
    const { productId: productB } = await createTestProduct(admin, orgB);

    const { data: reviewB } = await admin
      .from("reviews")
      .insert({
        organization_id: orgB,
        product_id: productB,
        customer_name: "Зулаа",
        rating: 5,
        comment: "Org B review",
        status: "approved",
      })
      .select()
      .single();
    trackCleanup("reviews", reviewB!.id);

    // User from org A with reviews.read should NOT see org B's review
    const userA = await createTestUserWithPermissions(
      admin,
      orgA,
      orgAEntity.name,
      ["reviews.read"],
    );

    const { data: results, error } = await userA.client
      .from("reviews")
      .select("*")
      .eq("id", reviewB!.id);

    expect(error).toBeNull();
    expect(results).toEqual([]);
  });
});

describe("Public review RPCs", () => {
  const admin = createAdminClient();

  it("get_public_reviews returns only approved reviews", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    // One approved, one pending
    const { data: approved } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        product_id: productId,
        customer_name: "Бат",
        rating: 5,
        comment: "Батлагдсан",
        status: "approved",
      })
      .select()
      .single();
    trackCleanup("reviews", approved!.id);

    const { data: pending } = await admin
      .from("reviews")
      .insert({
        organization_id: orgId,
        product_id: productId,
        customer_name: "Дорж",
        rating: 3,
        comment: "Хүлээгдэж буй",
        status: "pending",
      })
      .select()
      .single();
    trackCleanup("reviews", pending!.id);

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_public_reviews", {
      p_slug: org.slug,
      p_product_id: productId,
    });

    expect(error).toBeNull();
    const reviews = data as Array<{ id: string; comment: string }>;
    expect(reviews.some((r) => r.id === approved!.id)).toBe(true);
    expect(reviews.some((r) => r.id === pending!.id)).toBe(false);
  });

  it("submit_product_review creates a pending review", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    // Product must be public for storefront submission
    await admin
      .from("products")
      .update({ is_public: true, published_at: new Date().toISOString() })
      .eq("id", productId);

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("submit_product_review", {
      p_slug: org.slug,
      p_product_id: productId,
      p_customer_name: "Шинэ хэрэглэгч",
      p_rating: 4,
      p_comment: "Шинэ сэтгэгдэл",
    });

    expect(error).toBeNull();
    const result = data as { success: boolean; review_id?: string };
    expect(result.success).toBe(true);
    expect(result.review_id).toBeTruthy();
    trackCleanup("reviews", result.review_id!);

    // The submitted review is pending until moderated
    const { data: created } = await admin
      .from("reviews")
      .select("status, comment")
      .eq("id", result.review_id!)
      .single();
    expect(created!.status).toBe("pending");
    expect(created!.comment).toBe("Шинэ сэтгэгдэл");
  });

  it("submit_product_review rejects invalid rating", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("submit_product_review", {
      p_slug: org.slug,
      p_product_id: productId,
      p_customer_name: "Бат",
      p_rating: 6,
      p_comment: "Invalid rating",
    });

    expect(error).toBeNull();
    const result = data as { success: boolean; error?: string };
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Үнэлгээ/);
  });

  it("submit_product_review rejects unknown org", async () => {
    const { productId } = await createTestProduct(
      admin,
      (await createTestOrg(admin)).orgId,
    );

    const anon = createAnonClient();
    const { data, error } = await anon.rpc("submit_product_review", {
      p_slug: "no-such-org",
      p_product_id: productId,
      p_customer_name: "Бат",
      p_rating: 5,
      p_comment: "Unknown org",
    });

    expect(error).toBeNull();
    const result = data as { success: boolean; error?: string };
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Байгууллага/);
  });
});
