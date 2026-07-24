import type { MetadataRoute } from "next";
import { getLeaders, getRecentGames, getStandings } from "./lib/data";

const BASE_URL = "https://onoo.mn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/players`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/standings`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/leaders`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/games`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamic pages from data
  const [leaders, standings, recentGames] = await Promise.all([
    getLeaders().catch(() => []),
    getStandings().catch(() => []),
    getRecentGames(50).catch(() => []),
  ]);

  const playerPages: MetadataRoute.Sitemap = leaders.map((p) => ({
    url: `${BASE_URL}/players/${p.player_id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const teamPages: MetadataRoute.Sitemap = [
    ...new Set(standings.map((s) => s.team_slug)),
  ].map((slug) => ({
    url: `${BASE_URL}/teams/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const gamePages: MetadataRoute.Sitemap = recentGames.map((g) => ({
    url: `${BASE_URL}/games/${g.id}`,
    lastModified: now,
    changeFrequency: "never",
    priority: 0.6,
  }));

  return [...staticPages, ...playerPages, ...teamPages, ...gamePages];
}
