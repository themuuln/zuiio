import { createSerwistRoute } from "@serwist/turbopack";

// Serwist's Turbopack integration: the service worker is built at `next build`
// time and served as a static route (instead of a webpack plugin, which never
// ran under Turbopack). The worker source lives in worker/index.ts.
export const { GET, dynamic, dynamicParams, revalidate, generateStaticParams } =
  createSerwistRoute({
    swSrc: "worker/index.ts",
    useNativeEsbuild: true,
  });
