"use client";

import { useEffect, useState } from "react";
import { productDisplayName, productPageTitle } from "@/lib/product-branding";

interface FbPage {
	id: string;
	name: string;
	access_token: string;
}

type Status = "loading" | "ready" | "connecting" | "connected" | "error";

/**
 * Facebook page selection — reached after the verified OAuth callback.
 * orgId/productType come from the callback redirect (token-verified chain);
 * pages come from the fb_pages cookie set by the callback.
 */
export default function SelectPage() {
	const [pages, setPages] = useState<FbPage[] | null>(null);
	const [status, setStatus] = useState<Status>("loading");
	const [error, setError] = useState<string | null>(null);
	const [orgId, setOrgId] = useState<string | null>(null);
	const [productType, setProductType] = useState<string>("zer");

	const productName = productDisplayName(productType);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		setOrgId(params.get("orgId"));
		setProductType(params.get("productType") ?? "zer");
		document.title = productPageTitle(params.get("productType"));

		const loadPages = async () => {
			const res = await fetch("/api/facebook/select");
			const data = (await res.json()) as {
				pages?: FbPage[];
				error?: string;
			};
			if (!res.ok || !data.pages?.length) {
				throw new Error(
					data.error ??
						"OAuth session дууссан байна. Дахин холбохыг оролдоно уу.",
				);
			}
			setPages(data.pages);
			setStatus("ready");
		};

		void loadPages().catch((err: unknown) => {
			setStatus("error");
			setError(err instanceof Error ? err.message : "OAuth session хүчингүй.");
		});
	}, []);

	const connect = async (page: FbPage) => {
		if (!orgId) {
			setError("orgId олдсонгүй.");
			return;
		}
		setStatus("connecting");
		setError(null);
		try {
			const res = await fetch("/api/facebook/select", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					pageId: page.id,
					pageName: page.name,
					orgId,
					productType,
				}),
			});
			const data = (await res.json()) as {
				error?: string;
				instagramLinked?: boolean;
				returnUrl?: string | null;
			};
			if (!res.ok) throw new Error(data.error ?? "Холболт амжилтгүй.");
			setStatus("connected");
			// Return the user to the product app when the gateway is configured
			// with a server-side return URL for this product.
			if (typeof data.returnUrl === "string") {
				window.setTimeout(() => {
					window.location.href = data.returnUrl as string;
				}, 1200);
			}
		} catch (err) {
			setStatus("error");
			setError(err instanceof Error ? err.message : "Холболт амжилтгүй.");
		}
	};

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
				{status === "connected" && (
					<>
						<h1 style={titleStyle}>✅ Холбогдсон</h1>
						<p style={descStyle}>
							Facebook хуудас амжилттай холбогдлоо. Таны харилцагчдын мессежид
							{productName} AI автоматаар хариулах болно.
						</p>
					</>
				)}

				{status === "connecting" && (
					<>
						<h1 style={titleStyle}>⏳ Холбогдож байна...</h1>
						<p style={descStyle}>Webhook бүртгэж байна. Түр хүлээнэ үү.</p>
					</>
				)}

				{status === "ready" && pages && (
					<>
						<h1 style={titleStyle}>📘 Хуудас сонгох</h1>
						<p style={descStyle}>
							Аль Facebook хуудсаа {productName}-д холбох вэ?
						</p>
						<div
							style={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							{pages.map((p) => (
								<button
									key={p.id}
									type="button"
									onClick={() => connect(p)}
									style={buttonStyle("#1877F2")}
								>
									{p.name}
								</button>
							))}
						</div>
					</>
				)}

				{status === "error" && (
					<>
						<h1 style={titleStyle}>❌ Алдаа</h1>
						<p style={{ ...descStyle, color: "#e53e3e" }}>{error}</p>
					</>
				)}
			</div>
		</main>
	);
}

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

function buttonStyle(bg: string): React.CSSProperties {
	return {
		display: "block",
		width: "100%",
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
