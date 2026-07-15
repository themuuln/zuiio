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
            <div className="flex-1 bg-muted/20">{children}</div>
            <SiteFooter />
            <OfflineIndicator />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
