import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadSeo() {
  return import("@/lib/storefront-seo");
}

describe("storefrontCanonical", () => {
  it("keeps the org slug on the primary host", async () => {
    const { storefrontCanonical } = await loadSeo();
    expect(storefrontCanonical("zer.zuiiotech.com", "bujin-beauty")).toBe(
      "https://zer.zuiiotech.com/bujin-beauty",
    );
    expect(
      storefrontCanonical("zer.zuiiotech.com", "bujin-beauty", "/products"),
    ).toBe("https://zer.zuiiotech.com/bujin-beauty/products");
  });

  it("drops the slug prefix on a custom domain", async () => {
    const { storefrontCanonical } = await loadSeo();
    expect(storefrontCanonical("bujin.mn", "bujin-beauty")).toBe(
      "https://bujin.mn/",
    );
    expect(storefrontCanonical("bujin.mn", "bujin-beauty", "/products")).toBe(
      "https://bujin.mn/products",
    );
    expect(
      storefrontCanonical("bujin.mn", "bujin-beauty", "/products/abc-123"),
    ).toBe("https://bujin.mn/products/abc-123");
  });

  it("handles org subdomains of the primary host", async () => {
    const { storefrontCanonical } = await loadSeo();
    expect(
      storefrontCanonical(
        "bujin-beauty.zer.zuiiotech.com",
        "bujin-beauty",
        "/blog",
      ),
    ).toBe("https://bujin-beauty.zer.zuiiotech.com/blog");
  });

  it("falls back to the site URL without a host header", async () => {
    const { storefrontCanonical } = await loadSeo();
    expect(storefrontCanonical(null, "bujin-beauty")).toBe(
      "https://zer.zuiiotech.com/bujin-beauty",
    );
  });

  it("ignores localhost and preview hosts", async () => {
    const { storefrontCanonical } = await loadSeo();
    expect(storefrontCanonical("localhost:3000", "shop")).toBe(
      "https://zer.zuiiotech.com/shop",
    );
    expect(storefrontCanonical("zer-git-fix-abc.vercel.app", "shop")).toBe(
      "https://zer.zuiiotech.com/shop",
    );
  });

  it("honors NEXT_PUBLIC_SITE_URL as the primary origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://store.example.mn");
    const { storefrontCanonical } = await loadSeo();
    expect(storefrontCanonical("store.example.mn", "shop")).toBe(
      "https://store.example.mn/shop",
    );
    expect(storefrontCanonical("shop.example.mn", "shop", "/blog")).toBe(
      "https://shop.example.mn/blog",
    );
  });
});

describe("absoluteImageUrl", () => {
  it("keeps absolute URLs untouched", async () => {
    const { absoluteImageUrl } = await loadSeo();
    expect(absoluteImageUrl("https://cdn.example.mn/og.png")).toBe(
      "https://cdn.example.mn/og.png",
    );
  });

  it("absolutizes relative and protocol-relative URLs", async () => {
    const { absoluteImageUrl } = await loadSeo();
    expect(absoluteImageUrl("/og.png")).toBe(
      "https://zer.zuiiotech.com/og.png",
    );
    expect(absoluteImageUrl("og.png")).toBe("https://zer.zuiiotech.com/og.png");
    expect(absoluteImageUrl("//cdn.example.mn/og.png")).toBe(
      "https://cdn.example.mn/og.png",
    );
  });

  it("returns null for empty input", async () => {
    const { absoluteImageUrl } = await loadSeo();
    expect(absoluteImageUrl(null)).toBeNull();
    expect(absoluteImageUrl("")).toBeNull();
  });
});

describe("storefrontSocialMetadata", () => {
  it("emits OG + twitter scaffolding with mn_MN locale", async () => {
    const { storefrontSocialMetadata } = await loadSeo();
    const metadata = storefrontSocialMetadata({
      title: "Тест",
      description: "Тайлбар",
      canonical: "https://bujin.mn/",
      siteName: "Bujin",
      images: ["/og.png"],
      publishedTime: "2026-08-01T00:00:00Z",
      type: "article",
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Тест",
      url: "https://bujin.mn/",
      siteName: "Bujin",
      locale: "mn_MN",
      type: "article",
      publishedTime: "2026-08-01T00:00:00Z",
      images: [
        { url: "https://zer.zuiiotech.com/og.png", width: 1200, height: 630 },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["https://zer.zuiiotech.com/og.png"],
    });
  });

  it("omits image blocks when no images are given", async () => {
    const { storefrontSocialMetadata } = await loadSeo();
    const metadata = storefrontSocialMetadata({
      title: "Тест",
      description: "Тайлбар",
      canonical: "https://zer.zuiiotech.com/shop",
    });
    expect(metadata.openGraph.images).toBeUndefined();
    expect(metadata.twitter.images).toBeUndefined();
  });
});
