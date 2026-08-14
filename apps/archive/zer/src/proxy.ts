import { updateSession } from "@/lib/supabase/proxy";

export { updateSession as proxy };

export const config = {
  matcher: [
    // Skip Next.js internals, static files, API routes (self-auth), auth callback,
    // PWA assets, image files, SEO routes (robots.txt/sitemap.xml must stay
    // reachable for crawlers on every host), and the Sentry tunnel (/monitoring
    // — the proxy would redirect its POST to /login?next=/monitoring, producing
    // a 405).
    "/((?!_next/static|_next/image|api/|auth/callback|monitoring|favicon.ico|manifest\\.json|sw\\.js|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
