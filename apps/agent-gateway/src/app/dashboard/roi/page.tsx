"use client";

import { useEffect, useState } from "react";

interface RoiRow {
	ref: string;
	source: string;
	adId: string;
	referrals: number;
	conversions: number;
	rate: number;
	last7d: number[];
}

export default function RoiPage() {
	const [orgId, setOrgId] = useState("");
	const [rows, setRows] = useState<RoiRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function load() {
		if (!orgId.trim()) return;
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(
				`/api/dashboard/roi?orgId=${encodeURIComponent(orgId.trim())}`,
			);
			const body = (await response.json()) as {
				rows?: RoiRow[];
				error?: string;
			};
			if (!response.ok)
				throw new Error(body.error ?? "ROI мэдээлэл авахад алдаа гарлаа");
			setRows(body.rows ?? []);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "ROI мэдээлэл авахад алдаа гарлаа",
			);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		const saved = window.localStorage.getItem("ag_dashboard_org_id");
		if (saved) setOrgId(saved);
	}, []);

	return (
		<main
			style={{
				maxWidth: 1100,
				margin: "0 auto",
				padding: 32,
				fontFamily: "system-ui",
			}}
		>
			<h1>Харилцан ярианы ROI</h1>
			<p style={{ color: "#64748b" }}>
				Referral эх үүсвэр бүрийн хөрвөлтийг сүүлийн 7 хоногийн хандлагатай
				харна.
			</p>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					window.localStorage.setItem("ag_dashboard_org_id", orgId.trim());
					void load();
				}}
				style={{ display: "flex", gap: 8, margin: "24px 0" }}
			>
				<input
					aria-label="Байгууллагын ID"
					value={orgId}
					onChange={(event) => setOrgId(event.target.value)}
					placeholder="Байгууллагын ID"
					style={{
						flex: 1,
						maxWidth: 420,
						padding: "10px 12px",
						border: "1px solid #cbd5e1",
						borderRadius: 8,
					}}
				/>
				<button
					type="submit"
					disabled={loading}
					style={{
						padding: "10px 18px",
						border: 0,
						borderRadius: 8,
						background: "#2563eb",
						color: "white",
					}}
				>
					{loading ? "Уншиж байна…" : "Шинэчлэх"}
				</button>
			</form>
			{error && (
				<p role="alert" style={{ color: "#b91c1c" }}>
					{error}
				</p>
			)}
			<div style={{ overflowX: "auto" }}>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr>
							{[
								"Ref",
								"Source",
								"Ad ID",
								"Referral",
								"Хөрвөлт",
								"Rate",
								"Сүүлийн 7 хоног",
							].map((label) => (
								<th
									key={label}
									scope="col"
									style={{
										textAlign: "left",
										padding: 12,
										borderBottom: "2px solid #e2e8f0",
									}}
								>
									{label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={`${row.ref}-${row.source}-${row.adId}`}>
								<td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
									{row.ref}
								</td>
								<td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
									{row.source}
								</td>
								<td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
									{row.adId}
								</td>
								<td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
									{row.referrals}
								</td>
								<td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
									{row.conversions}
								</td>
								<td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
									{(row.rate * 100).toFixed(1)}%
								</td>
								<td
									style={{
										padding: 12,
										borderBottom: "1px solid #e2e8f0",
										letterSpacing: 2,
										color: "#2563eb",
									}}
								>
									{row.last7d.map((count, index) => (
										<span
											key={index}
											title={`${count}`}
											style={{
												display: "inline-block",
												width: 12,
												height: Math.max(4, count * 5),
												marginRight: 2,
												background: "currentColor",
												verticalAlign: "bottom",
												opacity: count ? 1 : 0.2,
											}}
										/>
									))}
								</td>
							</tr>
						))}
						{!loading && rows.length === 0 && (
							<tr>
								<td
									colSpan={7}
									style={{ padding: 32, textAlign: "center", color: "#64748b" }}
								>
									Одоогоор referral мэдээлэл алга.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</main>
	);
}
