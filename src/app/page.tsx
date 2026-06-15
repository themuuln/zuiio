import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "@/lib/i18n/navigation";

export const metadata: Metadata = {
  title: "TOLOM - Auto Service Management",
  description:
    "TOLOM is the operating system for auto service businesses. Manage work orders, customers, inventory, and finances in one place.",
};

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
        locale = "en";
      }
    }
  }

  redirect({ href: "/", locale });
}
