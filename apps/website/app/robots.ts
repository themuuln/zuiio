import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Bytespider", disallow: "/" },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: "https://zuiio.com/sitemap.xml",
  };
}
