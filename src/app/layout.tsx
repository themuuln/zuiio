import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import ThemeProvider from "@/components/theme-provider";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tolom.app";

const sfProDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/SFProDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SFProDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/SFProDisplay-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/SFProDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sf-pro",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="mn"
      className={`${sfProDisplay.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          src="//unpkg.com/react-grab/dist/index.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
