"use client";

import { useCallback, useEffect, useState } from "react";
import { useFacebook } from "@/components/facebook";

type Channel = "telegram" | "facebook";
type Status = "loading" | "ready" | "error" | "connecting" | "connected";

/**
 * Link page — org channel connection UI.
 *
 * Usage:
 *   /link?orgId=xxx&userId=yyy&productType=zer&channel=telegram
 *   /link?orgId=xxx&productType=zer&channel=facebook
 *
 * Telegram: QR code → open Telegram → /start <token> → bot links account.
 * Facebook:  FB.login() popup → pick Page → server exchanges token → stored in org_channels.
 */
export default function LinkPage() {
	const params =
		typeof window !== "undefined"
			? new URLSearchParams(window.location.search)
			: null;

	const channel = (params?.get("channel") as Channel) ?? "telegram";
	const orgId = params?.get("orgId");
	const userId = params?.get("userId");
	const productType = params?.get("productType");

	// Telegram state
	const [tgState, setTgState] = useState<{
		status: Status;
		telegramUrl?: string;
		error?: string;
	}>({ status: "loading" });

	// Facebook state
	const { ready: fbReady, connectPage } = useFacebook();
	const [fbState, setFbState] = useState<{
		status: Status;
		pageName?: string;
		error?: string;
	}>({ status: "loading" });

	// ----- Telegram: generate link token on mount -----
	useEffect(() => {
		if (channel !== "telegram") return;

		if (!orgId || !userId || !productType) {
			setTgState({
				status: "error",
				error: "orgId, userId, and productType URL параметрүүд шаардлагатай.",
			});
			return;
		}

		fetch("/api/link/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orgId, userId, productType }),
		})
			.then((r) => r.json())
			.then((data: { error?: string; telegramUrl?: string }) => {
				if (data.error) {
					setTgState({ status: "error", error: data.error });
				} else {
					setTgState({ status: "ready", telegramUrl: data.telegramUrl });
				}
			})
			.catch((err: Error) => {
				setTgState({ status: "error", error: err.message });
			});
	}, [channel, orgId, userId, productType]);

	// ----- Facebook: connect -----
	const handleFacebookConnect = useCallback(async () => {
		if (!orgId) {
			setFbState({
				status: "error",
				error: "orgId URL параметр шаардлагатай.",
			});
			return;
		}

		setFbState({ status: "connecting" });
		try {
			await connectPage();
			setFbState({ status: "connected" });
		} catch (err) {
			setFbState({
				status: "error",
				error: err instanceof Error ? err.message : "Холболт амжилтгүй.",
			});
		}
	}, [orgId, connectPage]);

	// ----- Facebook: mark ready when SDK loaded -----
	useEffect(() => {
		if (channel !== "facebook") return;
		if (fbReady)
			setFbState((s) => (s.status === "loading" ? { status: "ready" } : s));
	}, [channel, fbReady]);

	// ----- Common -----
	if (!orgId || !productType) {
		return (
			<CenteredCard>
				<ErrorDisplay error="orgId and productType URL параметрүүд шаардлагатай." />
			</CenteredCard>
		);
	}

	return (
		<CenteredCard>
			{channel === "facebook" ? (
				<FacebookPanel state={fbState} onConnect={handleFacebookConnect} />
			) : (
				<TelegramPanel state={tgState} telegramUrl={tgState.telegramUrl} />
			)}
		</CenteredCard>
	);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CenteredCard({ children }: { children: React.ReactNode }) {
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
				}}
			>
				{children}
			</div>
		</main>
	);
}

// --- Telegram panel (existing QR flow) ---

function TelegramPanel({
	state,
	telegramUrl,
}: {
	state: { status: Status; error?: string };
	telegramUrl?: string;
}) {
	return (
		<>
			<h1 style={titleStyle}>🔗 Telegram-тэй холбох</h1>
			<p style={descStyle}>
				QR кодыг уншуулж Telegram боттой холбогдоно уу.
				<br />
				Камераараа QR код руу чиглүүлэхэд Telegram нээгдэнэ.
			</p>

			{state.status === "loading" && (
				<div style={placeholderStyle}>Токен үүсгэж байна...</div>
			)}

			{state.status === "ready" && telegramUrl && (
				<QrDisplay url={telegramUrl} />
			)}

			{state.status === "error" && <ErrorDisplay error={state.error!} />}

			<div style={{ ...descStyle, fontSize: "12px", color: "#999" }}>
				<p>Холболт 15 минут хүчинтэй.</p>
				<p>Хэрэв автоматаар нээгдэхгүй бол доорх товчийг дарна уу.</p>
			</div>

			{telegramUrl && (
				<a
					href={telegramUrl}
					target="_blank"
					rel="noopener noreferrer"
					style={buttonStyle("#2481cc")}
				>
					Telegram нээх
				</a>
			)}
		</>
	);
}

// --- Facebook panel (new) ---

function FacebookPanel({
	state,
	onConnect,
}: {
	state: { status: Status; pageName?: string; error?: string };
	onConnect: () => void;
}) {
	if (state.status === "connected") {
		return (
			<>
				<h1 style={titleStyle}>✅ Холбогдсон</h1>
				<p style={descStyle}>
					{state.pageName
						? `"${state.pageName}" хуудас амжилттай холбогдлоо.`
						: "Facebook хуудас амжилттай холбогдлоо."}
				</p>
				<p style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>
					Та энэ цонхыг хааж болно. Таны харилцагчид Messenger-ээр илгээсэн
					мессежүүдэд AI автоматаар хариулах болно.
				</p>
			</>
		);
	}

	return (
		<>
			<h1 style={titleStyle}>📘 Facebook хуудас холбох</h1>
			<p style={descStyle}>
				Таны Facebook Page-тэй холбогдсоноор харилцагчдын мессежид AI автоматаар
				хариулах боломжтой болно.
			</p>

			{state.status === "loading" && (
				<div style={placeholderStyle}>Facebook SDK ачаалж байна...</div>
			)}

			{state.status === "ready" && (
				<button
					type="button"
					onClick={onConnect}
					style={buttonStyle("#1877F2")}
				>
					Facebook хуудас холбох
				</button>
			)}

			{state.status === "connecting" && (
				<div style={placeholderStyle}>Холбогдож байна...</div>
			)}

			{state.status === "error" && (
				<>
					<ErrorDisplay error={state.error!} />
					<button
						type="button"
						onClick={onConnect}
						style={{ ...buttonStyle("#1877F2"), marginTop: "16px" }}
					>
						Дахин оролдох
					</button>
				</>
			)}

			<div
				style={{
					marginTop: "24px",
					fontSize: "12px",
					color: "#999",
					lineHeight: 1.5,
				}}
			>
				<p>Танд Admin эрхтэй Facebook хуудас хэрэгтэй.</p>
				<p>Таны мэдээлэл зөвхөн мессеж илгээх/хариулахад ашиглагдана.</p>
			</div>
		</>
	);
}

// --- Shared ---

function ErrorDisplay({ error }: { error: string }) {
	return (
		<div
			style={{
				color: "#e53e3e",
				fontSize: "14px",
				padding: "20px",
			}}
		>
			❌ {error}
		</div>
	);
}

function QrDisplay({ url }: { url: string }) {
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

	useEffect(() => {
		import("qrcode")
			.then((QRCode) => {
				QRCode.toDataURL(url, {
					width: 280,
					margin: 1,
					color: { dark: "#000", light: "#fff" },
				}).then(setQrDataUrl);
			})
			.catch(() => setQrDataUrl(null));
	}, [url]);

	if (!qrDataUrl) {
		return <div style={placeholderStyle}>QR код үүсгэж байна...</div>;
	}

	return (
		<div style={{ margin: "0 auto", width: "fit-content" }}>
			<img
				src={qrDataUrl}
				alt="Telegram QR code"
				style={{
					borderRadius: "12px",
					display: "block",
					maxWidth: "280px",
				}}
			/>
		</div>
	);
}

// --- Shared styles ---

const titleStyle: React.CSSProperties = {
	fontSize: "24px",
	fontWeight: 600,
	margin: "0 0 8px 0",
	color: "#111",
};

const descStyle: React.CSSProperties = {
	fontSize: "14px",
	color: "#666",
	margin: "0 0 24px 0",
	lineHeight: 1.5,
};

const placeholderStyle: React.CSSProperties = {
	width: "280px",
	height: "60px",
	margin: "0 auto",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	background: "#f9f9f9",
	borderRadius: "12px",
	color: "#999",
	fontSize: "14px",
};

function buttonStyle(bg: string): React.CSSProperties {
	return {
		display: "inline-block",
		padding: "12px 24px",
		background: bg,
		color: "white",
		textDecoration: "none",
		borderRadius: "8px",
		fontSize: "14px",
		fontWeight: 500,
		cursor: "pointer",
		border: "none",
	};
}
