import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
	title: "ZatBot Flow Builder",
	description: "Lightweight chatbot flow creator",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				<ErrorBoundary>{children}</ErrorBoundary>
			</body>
		</html>
	);
}
