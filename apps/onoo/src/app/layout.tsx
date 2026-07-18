import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Providers } from "@/lib/providers";
import { SiteFooter } from "./components/site-footer";
import { SiteNav } from "./components/site-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} flex min-h-screen flex-col font-sans antialiased`}
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
