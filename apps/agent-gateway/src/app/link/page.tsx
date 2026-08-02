import { verifyCompactToken } from "@/lib/tokens";
import LinkClient from "./link-client";

export const dynamic = "force-dynamic";

/**
 * Link page — org channel connection UI.
 *
 * Usage:
 *   /link?token=<compactToken>&channel=telegram
 *   /link?token=<compactToken>&channel=facebook
 *
 * Security: orgId/userId/productType are NEVER read from raw URL params.
 * The page requires a valid HMAC-signed compact token (15 min expiry),
 * minted server-side by Zer/Tolom settings pages via /api/link/generate.
 */
export default async function LinkPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string; channel?: string }>;
}) {
	const { token, channel } = await searchParams;

	if (!token) {
		return (
			<CenteredError>
				Холбоос буруу эсвэл хугацаа нь дууссан байна. Zer/Tolom-ийн тохиргооноос
				дахин оролдоно уу.
			</CenteredError>
		);
	}

	const decoded = verifyCompactToken(token);
	if (!decoded) {
		return (
			<CenteredError>
				Холбоос хүчингүй эсвэл хугацаа нь дууссан байна. Zer/Tolom-ийн
				тохиргооноос дахин оролдоно уу.
			</CenteredError>
		);
	}

	const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "zuiio_bot";
	const telegramUrl = `https://t.me/${botUsername}?start=${token}`;

	return (
		<LinkClient
			orgId={decoded.orgId}
			userId={decoded.userId}
			productType={decoded.productType}
			channel={
				(channel === "facebook"
					? "facebook"
					: channel === "whatsapp"
						? "whatsapp"
						: "telegram") as "telegram" | "facebook" | "whatsapp"
			}
			telegramUrl={telegramUrl}
			token={token}
		/>
	);
}

function CenteredError({ children }: { children: React.ReactNode }) {
	return (
		<main
			style={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
				background: "#f5f5f5",
				padding: "20px",
			}}
		>
			<div
				style={{
					background: "white",
					borderRadius: "16px",
					padding: "40px",
					boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
					textAlign: "center",
					maxWidth: "440px",
					width: "100%",
					color: "#e53e3e",
					fontSize: "14px",
				}}
			>
				❌ {children}
			</div>
		</main>
	);
}
