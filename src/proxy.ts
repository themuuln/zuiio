import { updateSession } from "@/lib/supabase/proxy";

export { updateSession as proxy };

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and _next/image
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
