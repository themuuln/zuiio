import { cookies, headers } from "next/headers";
import { redirect } from "@/lib/i18n/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("NEXT_LOCALE")?.value;

  let locale = "mn";

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

  redirect({ href: "/", locale });
}
