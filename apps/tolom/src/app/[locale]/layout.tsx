// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import { DrawerProvider } from "@/components/drawer-provider";
import { HtmlLang } from "@/components/html-lang";
import { TooltipProvider } from "@/components/ui/tooltip";
import { routing } from "@/lib/i18n/routing";
import "../globals.css";

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
  const t = await getTranslations({
    locale: locale as "en" | "mn",
    namespace: "home",
  });
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

import { Suspense } from "react";

async function LocaleLayoutInner({
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
    <DrawerProvider>
      <TooltipProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <HtmlLang />
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              duration: 3000,
            }}
            style={{ zIndex: 9999 }}
          />
        </NextIntlClientProvider>
      </TooltipProvider>
    </DrawerProvider>
  );
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <LocaleLayoutInner params={params}>{children}</LocaleLayoutInner>
    </Suspense>
  );
}
