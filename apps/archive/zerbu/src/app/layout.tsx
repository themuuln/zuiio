import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gerbul — Бид хоёрын орон зай | Монгол хосуудын апп",
  description: "Монгол хосуудад зориулсан хувийн дижитал орон зай. Өдөр бүрийн асуулт, тоглоом, хуанли, дурсамж — бүгд нэг дор. Үнэгүй эхлэх.",
  manifest: "/manifest.json",
  themeColor: "#C83E3A",
  openGraph: {
    title: "Gerbul — Бид хоёрын орон зай",
    description: "Монгол хосуудад зориулсан хувийн дижитал орон зай",
    type: "website",
    locale: "mn_MN",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
