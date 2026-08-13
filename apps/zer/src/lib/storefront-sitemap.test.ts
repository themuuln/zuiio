import { describe, expect, it } from "vitest";
import { orgSiteEntries, sitemapXml } from "@/lib/storefront-sitemap";

const data = {
  products: [{ id: "prod-1" }],
  posts: [
    { slug: "hello", published_at: "2026-08-01T00:00:00Z" },
    { slug: "no-date" },
  ],
};

describe("orgSiteEntries", () => {
  it("roots entries at the slug path on the primary host", () => {
    const entries = orgSiteEntries(
      "https://zer.zuiiotech.com",
      "bujin-beauty",
      data,
    );
    expect(entries.map((e) => e.url)).toEqual([
      "https://zer.zuiiotech.com/bujin-beauty",
      "https://zer.zuiiotech.com/bujin-beauty/products",
      "https://zer.zuiiotech.com/bujin-beauty/blog",
      "https://zer.zuiiotech.com/bujin-beauty/products/prod-1",
      "https://zer.zuiiotech.com/bujin-beauty/blog/hello",
      "https://zer.zuiiotech.com/bujin-beauty/blog/no-date",
    ]);
  });

  it("roots entries at the domain root on a custom domain", () => {
    const entries = orgSiteEntries("https://bujin.mn", "", data);
    expect(entries.map((e) => e.url)).toEqual([
      "https://bujin.mn/",
      "https://bujin.mn/products",
      "https://bujin.mn/blog",
      "https://bujin.mn/products/prod-1",
      "https://bujin.mn/blog/hello",
      "https://bujin.mn/blog/no-date",
    ]);
  });

  it("uses real published_at as lastModified for blog posts only", () => {
    const entries = orgSiteEntries("https://bujin.mn", "", data);
    const hello = entries.find((e) => e.url.endsWith("/blog/hello"));
    const noDate = entries.find((e) => e.url.endsWith("/blog/no-date"));
    const product = entries.find((e) => e.url.includes("/products/"));
    expect(hello?.lastModified).toBe("2026-08-01T00:00:00Z");
    expect(noDate?.lastModified).toBeUndefined();
    expect(product?.lastModified).toBeUndefined();
  });
});

describe("sitemapXml", () => {
  it("serializes entries with lastmod and escapes XML", () => {
    const xml = sitemapXml([
      {
        url: "https://zer.zuiiotech.com/a?x=1&y=2",
        lastModified: "2026-08-01T00:00:00Z",
      },
    ]);
    expect(xml).toContain(
      "<url><loc>https://zer.zuiiotech.com/a?x=1&amp;y=2</loc><lastmod>2026-08-01T00:00:00.000Z</lastmod></url>",
    );
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain(
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    );
  });
});
