import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { OfflineIndicator } from "@/components/offline-indicator";
import { SiteNav } from "./components/site-nav";
import { SiteFooter } from "./components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Suspense>
          <Providers>
            <SiteNav />
            <div className="flex-1">{children}</div>
            <SiteFooter />
        <OfflineIndicator />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
