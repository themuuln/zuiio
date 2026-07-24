"use client";

import dynamic from "next/dynamic";

/** Lazy-loaded chart components — recharts only loaded on client, saving ~1.5M+ on non-chart pages. */

export const FormTrends = dynamic(
  () => import("./form-trends").then((m) => ({ default: m.FormTrends })),
  { ssr: false },
);

export const SeasonArc = dynamic(
  () => import("./season-arc").then((m) => ({ default: m.SeasonArc })),
  { ssr: false },
);

export const ShootingProfile = dynamic(
  () =>
    import("./shooting-profile").then((m) => ({ default: m.ShootingProfile })),
  { ssr: false },
);

export const SkillRadar = dynamic(
  () => import("./skill-radar").then((m) => ({ default: m.SkillRadar })),
  { ssr: false },
);

export const HomeAwaySplits = dynamic(
  () =>
    import("./home-away-splits").then((m) => ({ default: m.HomeAwaySplits })),
  { ssr: false },
);

export const MonthlyProgression = dynamic(
  () =>
    import("./monthly-progression").then((m) => ({
      default: m.MonthlyProgression,
    })),
  { ssr: false },
);
