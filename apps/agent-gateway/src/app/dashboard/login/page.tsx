"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardLoginPage() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const res = await fetch("/api/dashboard/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as {
					error?: string;
				};
				throw new Error(data.error ?? "Нэвтрэх амжилтгүй.");
			}
			router.push("/dashboard");
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Нэвтрэх амжилтгүй.");
		} finally {
			setBusy(false);
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
			<form
				onSubmit={submit}
				style={{
					background: "white",
					borderRadius: "16px",
					padding: "40px",
					boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
					textAlign: "center",
					maxWidth: "380px",
					width: "100%",
				}}
			>
				<h1 style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 8px" }}>
					🔐 Agent Gateway Dashboard
				</h1>
				<p style={{ fontSize: "14px", color: "#666", margin: "0 0 24px" }}>
					Нууц үгээ оруулна уу
				</p>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Password"
					style={{
						width: "100%",
						boxSizing: "border-box",
						padding: "12px",
						borderRadius: "8px",
						border: "1px solid #ddd",
						fontSize: "14px",
						marginBottom: "12px",
					}}
				/>
				{error && (
					<p
						style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "12px" }}
					>
						{error}
					</p>
				)}
				<button
					type="submit"
					disabled={busy}
					style={{
						width: "100%",
						padding: "12px",
						background: "#111",
						color: "white",
						borderRadius: "8px",
						fontSize: "14px",
						fontWeight: 500,
						cursor: "pointer",
						border: "none",
					}}
				>
					{busy ? "Нэвтэрч байна..." : "Нэвтрэх"}
				</button>
			</form>
		</main>
	);
}
