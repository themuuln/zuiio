// Dev-only: react-grab lets you copy any UI element's component source context
// for AI agents by hovering and pressing Cmd/Ctrl+C
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import("react-grab");
}

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import ThemeProvider from "@/components/theme-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tolom.app";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "TOLOM",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#000000",
    "msapplication-TileImage": "/icon-512.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        jetbrainsMono.variable,
        "font-sans",
        inter.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
