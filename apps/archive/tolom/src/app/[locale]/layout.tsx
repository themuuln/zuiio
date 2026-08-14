// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
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

// Static metadata to avoid blocking prefetch for instant pages.
// Locale-aware metadata is set at the page level where needed.
export const metadata: Metadata = {
  title: { default: "TOLOM", template: "%s | TOLOM" },
  description: "Auto repair shop management system",
  metadataBase: new URL(baseUrl),
  manifest: "/manifest.json",
  openGraph: {
    siteName: "TOLOM",
    type: "website",
  },
};

import { Suspense } from "react";

/**
 * Calls connection() inside Suspense to explicitly mark this route as dynamic.
 * The layout awaits params to get the locale, which prevents static
 * prerendering, so connection() ensures prefetch doesn't block on this.
 */
async function DynamicBoundary() {
  await connection();
  return null;
}

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
    <>
      <Suspense fallback={null}>
        <DynamicBoundary />
      </Suspense>
      <Suspense fallback={null}>
        <LocaleLayoutInner params={params}>{children}</LocaleLayoutInner>
      </Suspense>
    </>
  );
}
