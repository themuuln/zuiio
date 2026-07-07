import type { Metadata } from "next";
import { Inter, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
	variable: "--font-sans",
	subsets: ["latin", "cyrillic"],
});

const sourceSans = Source_Sans_3({
	variable: "--font-display",
	subsets: ["latin", "cyrillic"],
	weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: "Zill — Сарлагаа хялбар хуваа",
	description: "Ресторан, кафе, найзын цуглааны зарлагыг хялбар хуваалцах апп.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="mn"
			className={`${inter.variable} ${sourceSans.variable} h-full`}
			suppressHydrationWarning
		>
			<body className="flex min-h-full flex-col">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
