import type { Metadata } from "next";
import { FacebookProviderWrapper } from "@/components/facebook";

export const metadata: Metadata = {
	title: "Zuiio Agent Gateway",
	description: "Connect your channels and manage your AI agents.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				<FacebookProviderWrapper>{children}</FacebookProviderWrapper>
			</body>
		</html>
	);
}
