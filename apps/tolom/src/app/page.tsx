import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { redirect } from "@/lib/i18n/navigation";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export const metadata: Metadata = {
  title: "TOLOM - Auto Service Management",
  description:
    "TOLOM is the operating system for auto service businesses. Manage work orders, customers, inventory, and finances in one place.",
};

async function LocaleRedirect() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("NEXT_LOCALE")?.value;

  let locale = "mn";

  if (existing && ["mn", "en"].includes(existing)) {
    locale = existing;
  }

  redirect({ href: "/", locale });
}

export default function RootPage() {
  return (
    <Suspense>
      <LocaleRedirect />
    </Suspense>
  );
}
