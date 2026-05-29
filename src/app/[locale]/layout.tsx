import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import NuqsProvider from "@/components/nuqs-provider";
import QueryProvider from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { routing } from "@/lib/i18n/routing";
import "../globals.css";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tolom.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: { default: t("title"), template: "%s | TOLOM" },
    description: t("subtitle"),
    metadataBase: new URL(baseUrl),
    manifest: "/manifest.json",
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      url: "./",
      siteName: "TOLOM",
      locale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = await getMessages();

  return (
    <div className="flex min-h-dvh flex-col antialiased">
      <TooltipProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NuqsProvider>
            <QueryProvider>
              {children}
              <Toaster
                position="bottom-left"
                richColors
                closeButton
                toastOptions={{
                  duration: 4000,
                }}
              />
            </QueryProvider>
          </NuqsProvider>
        </NextIntlClientProvider>
      </TooltipProvider>
    </div>
  );
}
