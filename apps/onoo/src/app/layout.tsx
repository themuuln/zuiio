// Onoo sports platform — main layout
import type { Metadata, Viewport } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Providers } from "@/lib/providers";
import { SiteFooter } from "./components/site-footer";
import { SiteNav } from "./components/site-nav";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  weight: ["700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Оноо — Спортын тоо баримт",
  description: "Сагсан бөмбөгийн лигийн тоглолтууд, шалгуур, статистик.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body
        className={`${oswald.variable} ${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Suspense>
          <Providers>
            <SiteNav />
            <div
              id="content"
              tabIndex={-1}
              className="flex-1 bg-[var(--surface-2)]"
            >
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-[var(--brand-sports)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--ink)] focus:shadow-lg focus:outline-none"
              >
                Үндсэн агууламж руу шилжих
              </a>
              {children}
            </div>
            <SiteFooter />
            <OfflineIndicator />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
