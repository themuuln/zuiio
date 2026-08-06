import { cookies, headers } from "next/headers";
import { redirect } from "@/lib/i18n/navigation";

export default async function RootPage() {
  let locale = "mn";

  try {
    const cookieStore = await cookies();
    const existing = cookieStore.get("NEXT_LOCALE")?.value;

    if (existing && ["mn", "en"].includes(existing)) {
      locale = existing;
    } else {
      const acceptLanguage = (await headers()).get("accept-language");
      if (acceptLanguage) {
        const idxEn = acceptLanguage.indexOf("en");
        const idxMn = acceptLanguage.indexOf("mn");
        if (idxEn >= 0 && (idxMn < 0 || idxEn < idxMn)) {
          locale = "mn";
        }
      }
    }
  } catch {
    // During prerendering cookies()/headers() can reject — fall back to the
    // default locale instead of crashing the root redirect.
    locale = "mn";
  }

  redirect({ href: "/", locale });
}
