import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zuiiotech.com"),
  title: {
    default: "Zuiio — Монгол бизнесийн программ хангамж",
    template: "%s | Zuiio",
  },
  description:
    "Zuiio builds software for Mongolian businesses — business management (ERP) and auto repair shop tools that feel like they were made for you.",
  openGraph: {
    title: "Zuiio",
    description:
      "Business management and auto repair software — built for the way Mongolia works.",
    url: "https://zuiiotech.com",
    siteName: "Zuiio",
    locale: "mn_MN",
    type: "website",
  },
  alternates: {
    canonical: "/",
    languages: {
      mn: "/",
      en: "/en",
    },
  },
};
export const viewport = {
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      className={`${lora.variable} ${geist.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Zuiio",
              url: "https://zuiiotech.com",
              logo: "https://zuiiotech.com/icon.png",
              description:
                "Software for Mongolian businesses — ERP and auto repair management.",
              contactPoint: {
                "@type": "ContactPoint",
                email: "info@zuiiotech.com",
                contactType: "sales",
              },
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js');document.addEventListener('DOMContentLoaded',function(){var o=new IntersectionObserver(function(e){e.forEach(function(n){if(n.isIntersecting){n.target.classList.add('visible');o.unobserve(n.target)}})},{threshold:0.1});document.querySelectorAll('.reveal').forEach(function(n){o.observe(n)});setTimeout(function(){document.querySelectorAll('.reveal:not(.visible)').forEach(function(n){n.classList.add('visible')})},2000)})`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
