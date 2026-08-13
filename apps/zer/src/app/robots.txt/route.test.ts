import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("robots.txt route", () => {
  it("points the sitemap at the primary origin by default", async () => {
    const res = await GET(
      new Request("https://zer.zuiiotech.com/robots.txt", {
        headers: { host: "zer.zuiiotech.com" },
      }),
    );
    expect(res.headers.get("content-type")).toContain("text/plain");
    const text = await res.text();
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Sitemap: https://zer.zuiiotech.com/sitemap.xml");
  });

  it("points the sitemap at the custom domain when served there", async () => {
    const res = await GET(
      new Request("https://bujin.mn/robots.txt", {
        headers: { host: "bujin.mn" },
      }),
    );
    const text = await res.text();
    expect(text).toContain("Sitemap: https://bujin.mn/sitemap.xml");
  });

  it("never points the sitemap at preview hosts", async () => {
    const res = await GET(
      new Request("https://zer-abc.vercel.app/robots.txt", {
        headers: { host: "zer-abc.vercel.app" },
      }),
    );
    const text = await res.text();
    expect(text).toContain("Sitemap: https://zer.zuiiotech.com/sitemap.xml");
  });
});
