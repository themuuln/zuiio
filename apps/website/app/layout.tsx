import type { Metadata } from "next";
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
			<body className="min-h-screen flex flex-col antialiased">{children}</body>
		</html>
	);
}
