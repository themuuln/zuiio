import { updateSession } from "@/lib/supabase/proxy";

export { updateSession as proxy };

export const config = {
  matcher: [
    // Skip Next.js internals, static files, API routes (self-auth), auth callback,
    // PWA assets, and image files. Proxy only checks session on page navigations.
    "/((?!_next/static|_next/image|api/|auth/callback|favicon.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
