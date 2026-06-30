import { updateSession } from "@/lib/supabase/proxy";

export { updateSession as proxy };

export const config = {
  matcher: [
    // Skip Next.js internals, static files, PWA assets, and _next/image
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
