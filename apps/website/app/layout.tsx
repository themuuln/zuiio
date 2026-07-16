import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-display",
	display: "swap",
});

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL("https://zuiio.com"),
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
		url: "https://zuiio.com",
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
			className={`${instrumentSerif.variable} ${geist.variable}`}
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
						url: "https://zuiio.com",
						logo: "https://zuiio.com/logo.png",
						description:
							"Software for Mongolian businesses — ERP and auto repair management.",
						contactPoint: {
							"@type": "ContactPoint",
							email: "sales@zuiio.com",
							contactType: "sales",
						},
					}),
				}}
			/>
			<script
				dangerouslySetInnerHTML={{
					__html: `document.addEventListener('DOMContentLoaded',function(){var o=new IntersectionObserver(function(e){e.forEach(function(n){if(n.isIntersecting){n.target.classList.add('visible');o.unobserve(n.target)}})},{threshold:0.15});document.querySelectorAll('.reveal').forEach(function(n){o.observe(n)})})`,
				}}
			/>
			{children}
		</body>
		</html>
	);
}
