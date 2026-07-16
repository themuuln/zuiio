import type { MetadataRoute } from "next";

const base = "https://zuiio.com";
const routes = [
	"",
	"/about",
	"/pricing",
	"/products",
	"/products/zer",
	"/products/tolom",
	"/blog",
	"/privacy",
	"/terms",
	"/data-deletion",
];

export default function sitemap(): MetadataRoute.Sitemap {
	return routes.flatMap((p) => [
		{
			url: `${base}${p}`,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: p === "" ? 1 : 0.7,
		},
		{
			url: `${base}/en${p}`,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: p === "" ? 1 : 0.7,
		},
	]);
}
