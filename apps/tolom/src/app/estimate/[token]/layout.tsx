import type { Metadata } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { cookies } from "next/headers";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export const metadata: Metadata = {
  title: "Estimate | TOLOM",
  description: "View your estimate online.",
};

async function EstimateIntlProvider({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value ?? "mn") as "en" | "mn";
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export default function EstimateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <EstimateIntlProvider>{children}</EstimateIntlProvider>
    </Suspense>
  );
}
