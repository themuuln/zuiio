"use client";

import { useCallback, useEffect, useState } from "react";

type Channel = "telegram" | "facebook" | "whatsapp";
type Status = "ready" | "error" | "connecting" | "connected";

interface LinkClientProps {
	orgId: string;
	userId: string;
	productType: "tolom" | "zer" | "zatly";
	channel: Channel;
	telegramUrl: string;
	token: string;
}

/**
 * Client-side link panels. Identity comes from a verified server-side token
 * (see page.tsx) — this component never reads URL params itself.
 */
export default function LinkClient({
	channel,
	telegramUrl,
	token,
}: LinkClientProps) {
	const [fbState, setFbState] = useState<{
		status: Status;
		pageName?: string;
		error?: string;
	}>({ status: "ready" });

	// ----- Facebook: connect via token-verified OAuth start -----
	const handleFacebookConnect = useCallback(async () => {
		setFbState({ status: "connecting" });
		try {
			const res = await fetch("/api/facebook/start", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			});
			const data = (await res.json()) as {
				redirectUrl?: string;
				error?: string;
			};
			if (!res.ok || !data.redirectUrl) {
				throw new Error(data.error ?? "Холболт амжилтгүй.");
			}
			window.location.href = data.redirectUrl;
		} catch (err) {
			setFbState({
				status: "error",
				error: err instanceof Error ? err.message : "Холболт амжилтгүй.",
			});
		}
	}, [token]);

	return (
		<CenteredCard>
			{channel === "facebook" ? (
				<FacebookPanel state={fbState} onConnect={handleFacebookConnect} />
			) : channel === "whatsapp" ? (
				<WhatsAppPanel token={token} />
			) : (
				<TelegramPanel telegramUrl={telegramUrl} />
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

// --- Telegram panel (QR flow, token pre-verified server-side) ---

function TelegramPanel({ telegramUrl }: { telegramUrl: string }) {
	return (
		<>
			<h1 style={titleStyle}>🔗 Telegram-тэй холбох</h1>
			<p style={descStyle}>
				QR кодыг уншуулж Telegram боттой холбогдоно уу.
				<br />
				Камераараа QR код руу чиглүүлэхэд Telegram нээгдэнэ.
			</p>

			<QrDisplay url={telegramUrl} />

			<div style={{ ...descStyle, fontSize: "12px", color: "#999" }}>
				<p>Холболт 15 минут хүчинтэй.</p>
				<p>Хэрэв автоматаар нээгдэхгүй бол доорх товчийг дарна уу.</p>
			</div>

			<a
				href={telegramUrl}
				target="_blank"
				rel="noopener noreferrer"
				style={buttonStyle("#2481cc")}
			>
				Telegram нээх
			</a>
		</>
	);
}

// --- Facebook panel ---

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
					<ErrorDisplay error={state.error ?? "Алдаа гарлаа"} />
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

// --- WhatsApp panel ---

function WhatsAppPanel({ token }: { token: string }) {
	const [form, setForm] = useState({
		phoneNumberId: "",
		accessToken: "",
		phoneNumber: "",
	});
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<{
		webhookUrl: string;
		verifyToken: string;
	} | null>(null);

	const connect = async (e: React.FormEvent) => {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const res = await fetch("/api/whatsapp/connect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, ...form }),
			});
			const data = (await res.json()) as {
				error?: string;
				webhookUrl?: string;
				verifyToken?: string;
			};
			if (!res.ok || !data.webhookUrl) {
				throw new Error(data.error ?? "Холболт амжилтгүй.");
			}
			setResult({
				webhookUrl: data.webhookUrl,
				verifyToken: data.verifyToken ?? "",
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Холболт амжилтгүй.");
		} finally {
			setBusy(false);
		}
	};

	if (result) {
		return (
			<>
				<h1 style={titleStyle}>✅ Холбогдсон</h1>
				<p style={descStyle}>
					WhatsApp бүртгэгдлээ. Дараах webhook мэдээллийг WhatsApp Business
					Platform provider-тээ тохируулна уу:
				</p>
				<div
					style={{
						textAlign: "left",
						background: "#f9f9f9",
						borderRadius: "8px",
						padding: "12px",
						fontSize: "12px",
						wordBreak: "break-all",
					}}
				>
					<p style={{ margin: "0 0 8px" }}>
						<b>Webhook URL:</b>
						<br />
						{result.webhookUrl}
					</p>
					<p style={{ margin: "0" }}>
						<b>Verify token:</b>{" "}
						{result.verifyToken || "(WHATSAPP_VERIFY_TOKEN env)"}
					</p>
				</div>
			</>
		);
	}

	return (
		<>
			<h1 style={titleStyle}>💬 WhatsApp холбох</h1>
			<p style={descStyle}>
				WhatsApp Business Account-аа холбож харилцагчийн мессежид AI автоматаар
				хариулах боломжтой болно.
			</p>
			<form
				onSubmit={connect}
				style={{ display: "flex", flexDirection: "column", gap: "10px" }}
			>
				{[
					["phoneNumberId", "Phone Number ID"],
					["accessToken", "Access Token"],
					["phoneNumber", "Утасны дугаар (заавал биш)"],
				].map(([key, label]) => (
					<input
						key={key}
						type={key === "accessToken" ? "password" : "text"}
						placeholder={label}
						value={form[key as keyof typeof form]}
						onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
						style={inputStyle}
					/>
				))}
				{error && <ErrorDisplay error={error} />}
				<button type="submit" disabled={busy} style={buttonStyle("#25D366")}>
					{busy ? "Холбогдож байна..." : "WhatsApp холбох"}
				</button>
			</form>
			<div
				style={{
					marginTop: "16px",
					fontSize: "12px",
					color: "#999",
					lineHeight: 1.5,
				}}
			>
				<p>
					Meta Cloud API-ийн Phone Number ID болон Access Token шаардлагатай.
				</p>
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

const inputStyle: React.CSSProperties = {
	width: "100%",
	boxSizing: "border-box",
	padding: "12px",
	borderRadius: "8px",
	border: "1px solid #ddd",
	fontSize: "14px",
};
