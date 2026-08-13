import { describe, expect, it, vi } from "vitest";
import {
  getPublicBlogPosts,
  getPublicBranches,
  getPublicPromotions,
  getPublicReviews,
} from "./public-catalog";

/**
 * Unit tests for the thin RPC wrappers used by the storefront agent tools:
 * argument mapping and error → empty-list fallback.
 */

const SLUG = "storefront-e2e-test";

function rpcClient(result: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn().mockResolvedValue(result),
  } as never;
}

describe("public-catalog wrappers", () => {
  it("getPublicPromotions passes the slug and maps the rows", async () => {
    const client = rpcClient({
      data: [
        { id: "p1", title: "Хямдрал", reward_label: "30%", type: "discount" },
      ],
      error: null,
    });

    const result = await getPublicPromotions(client, SLUG);

    expect(result).toEqual([
      { id: "p1", title: "Хямдрал", reward_label: "30%", type: "discount" },
    ]);
    expect(client.rpc).toHaveBeenCalledWith("get_public_promotions", {
      p_slug: SLUG,
    });
  });

  it("getPublicPromotions returns [] on error or null data", async () => {
    expect(
      await getPublicPromotions(
        rpcClient({ data: null, error: new Error("x") }),
        SLUG,
      ),
    ).toEqual([]);
    expect(
      await getPublicPromotions(rpcClient({ data: null, error: null }), SLUG),
    ).toEqual([]);
  });

  it("getPublicReviews maps approved reviews", async () => {
    const client = rpcClient({
      data: [{ id: "r1", customer_name: "Бат", rating: 5, comment: "Сайн" }],
      error: null,
    });

    const result = await getPublicReviews(client, SLUG, "prod-1");

    expect(result).toEqual([
      { id: "r1", customer_name: "Бат", rating: 5, comment: "Сайн" },
    ]);
    expect(client.rpc).toHaveBeenCalledWith("get_public_reviews", {
      p_slug: SLUG,
      p_product_id: "prod-1",
    });
  });

  it("getPublicBlogPosts passes the slug", async () => {
    const client = rpcClient({
      data: [{ id: "b1", title: "Мэдээ", slug: "news", excerpt: null }],
      error: null,
    });

    const result = await getPublicBlogPosts(client, SLUG);

    expect(result).toHaveLength(1);
    expect(client.rpc).toHaveBeenCalledWith("get_public_blog_posts", {
      p_slug: SLUG,
    });
  });

  it("getPublicBranches maps branch locations and falls back to []", async () => {
    const client = rpcClient({
      data: [
        { id: "br1", slug: "main", name: "Салбар", address: "УБ", phone: null },
      ],
      error: null,
    });

    expect(await getPublicBranches(client, SLUG)).toEqual([
      { id: "br1", slug: "main", name: "Салбар", address: "УБ", phone: null },
    ]);
    expect(client.rpc).toHaveBeenCalledWith("get_public_branches", {
      p_slug: SLUG,
    });

    expect(
      await getPublicBranches(
        rpcClient({ data: null, error: new Error("x") }),
        SLUG,
      ),
    ).toEqual([]);
  });
});
