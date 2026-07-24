"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────

interface UsageStats {
	orgId: string;
	period: { start: string; end: string };
	totalTokens: number;
	totalApiCalls: number;
	totalToolCalls: number;
	topTools: Array<{ name: string; count: number }>;
	handoffCount: number;
	handoffResolvedCount: number;
	dailyBreakdown: Array<{ date: string; tokens: number; calls: number }>;
	estimatedCost: number;
}

interface HandoffItem {
	id: string;
	status: string;
	reason: string;
	customerQuery: string;
	createdAt: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────

const s = {
	page: {
		maxWidth: 900,
		margin: "0 auto",
		padding: "24px 16px",
		fontFamily: "system-ui, sans-serif",
	} as React.CSSProperties,
	header: {
		fontSize: 24,
		fontWeight: 700,
		marginBottom: 8,
	} as React.CSSProperties,
	subtitle: {
		color: "#666",
		marginBottom: 24,
		fontSize: 14,
	} as React.CSSProperties,
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
		gap: 16,
		marginBottom: 32,
	} as React.CSSProperties,
	card: {
		background: "#fff",
		border: "1px solid #e5e7eb",
		borderRadius: 12,
		padding: 20,
	} as React.CSSProperties,
	cardLabel: {
		fontSize: 12,
		color: "#6b7280",
		textTransform: "uppercase" as const,
		letterSpacing: "0.05em",
		marginBottom: 4,
	} as React.CSSProperties,
	cardValue: {
		fontSize: 28,
		fontWeight: 700,
		marginBottom: 4,
	} as React.CSSProperties,
	cardSub: { fontSize: 13, color: "#9ca3af" } as React.CSSProperties,
	section: { marginBottom: 32 } as React.CSSProperties,
	sectionTitle: {
		fontSize: 16,
		fontWeight: 600,
		marginBottom: 12,
	} as React.CSSProperties,
	table: {
		width: "100%",
		borderCollapse: "collapse" as const,
		fontSize: 13,
	} as React.CSSProperties,
	th: {
		textAlign: "left" as const,
		padding: "8px 12px",
		borderBottom: "2px solid #e5e7eb",
		color: "#6b7280",
		fontWeight: 600,
		fontSize: 12,
		textTransform: "uppercase" as const,
	} as React.CSSProperties,
	td: {
		padding: "8px 12px",
		borderBottom: "1px solid #f3f4f6",
	} as React.CSSProperties,
	badge: (color: string) =>
		({
			display: "inline-block",
			padding: "2px 8px",
			borderRadius: 999,
			fontSize: 11,
			fontWeight: 600,
			background: `${color}15`,
			color,
		}) as React.CSSProperties,
	bar: (pct: number) =>
		({
			height: 6,
			borderRadius: 3,
			background: `linear-gradient(90deg, #2563eb ${pct}%, #e5e7eb ${pct}%)`,
			minWidth: 60,
		}) as React.CSSProperties,
	empty: {
		textAlign: "center" as const,
		padding: 40,
		color: "#9ca3af",
	} as React.CSSProperties,
	loading: {
		textAlign: "center" as const,
		padding: 60,
		color: "#9ca3af",
	} as React.CSSProperties,
	error: {
		background: "#fef2f2",
		border: "1px solid #fecaca",
		borderRadius: 8,
		padding: 16,
		color: "#991b1b",
		fontSize: 14,
	} as React.CSSProperties,
	input: {
		padding: "8px 12px",
		border: "1px solid #d1d5db",
		borderRadius: 8,
		fontSize: 14,
		width: 200,
		marginRight: 8,
	} as React.CSSProperties,
	button: {
		padding: "8px 16px",
		background: "#2563eb",
		color: "#fff",
		border: "none",
		borderRadius: 8,
		fontSize: 14,
		cursor: "pointer",
		fontWeight: 600,
	} as React.CSSProperties,
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
	const [orgId, setOrgId] = useState("");
	const [stats, setStats] = useState<UsageStats | null>(null);
	const [handoffs, setHandoffs] = useState<HandoffItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function fetchStats() {
		if (!orgId.trim()) return;
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(
				`/api/dashboard/usage?orgId=${encodeURIComponent(orgId)}&days=7`,
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as UsageStats;
			setStats(data);

			// Fetch handoffs
			const _handoffRes = await fetch(
				`/api/dashboard/usage?orgId=${encodeURIComponent(orgId)}&days=7`,
			);
			// For now, handoff data is embedded in usage stats
			setHandoffs([]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Алдаа гарлаа");
		} finally {
			setLoading(false);
		}
	}

	function formatTokens(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}

	function formatCost(n: number): string {
		if (n === 0) return "₮0";
		return `$${n.toFixed(3)}`;
	}

	function formatDate(d: string): string {
		return new Date(d).toLocaleDateString("mn-MN", {
			month: "short",
			day: "numeric",
		});
	}

	function handoffStatusLabel(status: string): {
		label: string;
		color: string;
	} {
		switch (status) {
			case "pending_human":
				return { label: "Хүлээгдэж байна", color: "#f59e0b" };
			case "human_active":
				return { label: "Шийдвэрлэж байна", color: "#3b82f6" };
			case "human_resolved":
				return { label: "Шийдвэрлэгдсэн", color: "#10b981" };
			default:
				return { label: status, color: "#6b7280" };
		}
	}

	const maxTokens = Math.max(
		...(stats?.dailyBreakdown.map((d) => d.tokens) ?? [1]),
		1,
	);

	return (
		<div style={s.page}>
			<h1 style={s.header}>📊 Agent Dashboard</h1>
			<p style={s.subtitle}>Байгуулгын AI ашиглалтын статистик</p>

			{/* Org ID input */}
			<div style={{ marginBottom: 24, display: "flex", alignItems: "center" }}>
				<input
					style={s.input}
					type="text"
					placeholder="Organization ID"
					value={orgId}
					onChange={(e) => setOrgId(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && fetchStats()}
				/>
				<button style={s.button} onClick={fetchStats} disabled={loading}>
					{loading ? "Ачаалж..." : "Харах"}
				</button>
			</div>

			{error && <div style={s.error}>{error}</div>}

			{loading && <div style={s.loading}>Ачаалж байна...</div>}

			{stats && !loading && (
				<>
					{/* KPI Cards */}
					<div style={s.grid}>
						<div style={s.card}>
							<div style={s.cardLabel}>Нийт Токен</div>
							<div style={s.cardValue}>{formatTokens(stats.totalTokens)}</div>
							<div style={s.cardSub}>7 хоног</div>
						</div>
						<div style={s.card}>
							<div style={s.cardLabel}>API Дуудлага</div>
							<div style={s.cardValue}>{stats.totalApiCalls}</div>
							<div style={s.cardSub}>
								{stats.totalToolCalls} багажийн дуудлага
							</div>
						</div>
						<div style={s.card}>
							<div style={s.cardLabel}>Тооцоолсон Зардал</div>
							<div style={s.cardValue}>{formatCost(stats.estimatedCost)}</div>
							<div style={s.cardSub}>OpenCodeGo Flash ~$0.14/M</div>
						</div>
						<div style={s.card}>
							<div style={s.cardLabel}>Хүнд Шилжүүлэлт</div>
							<div style={s.cardValue}>
								{stats.handoffResolvedCount}/{stats.handoffCount}
							</div>
							<div style={s.cardSub}>
								{stats.handoffCount > 0
									? `${Math.round((stats.handoffResolvedCount / stats.handoffCount) * 100)}% шийдвэрлэгдсэн`
									: "Шилжүүлэлт байхгүй"}
							</div>
						</div>
					</div>

					{/* Daily breakdown */}
					<div style={s.section}>
						<h2 style={s.sectionTitle}>Өдрийн Токен Хэрэглээ</h2>
						<table style={s.table}>
							<thead>
								<tr>
									<th style={s.th}>Өдөр</th>
									<th style={s.th}>Токен</th>
									<th style={{ ...s.th, textAlign: "right" }}>Дуудлага</th>
								</tr>
							</thead>
							<tbody>
								{stats.dailyBreakdown.map((day) => (
									<tr key={day.date}>
										<td style={s.td}>{formatDate(day.date)}</td>
										<td style={s.td}>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: 8,
												}}
											>
												<div style={s.bar((day.tokens / maxTokens) * 100)} />
												{formatTokens(day.tokens)}
											</div>
										</td>
										<td style={{ ...s.td, textAlign: "right" }}>{day.calls}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Top tools */}
					{stats.topTools.length > 0 && (
						<div style={s.section}>
							<h2 style={s.sectionTitle}>Хамгийн Их Ашиглагдсан Багажууд</h2>
							<table style={s.table}>
								<thead>
									<tr>
										<th style={s.th}>Багаж</th>
										<th style={{ ...s.th, textAlign: "right" }}>Дуудалт</th>
									</tr>
								</thead>
								<tbody>
									{stats.topTools.map((t) => {
										const maxCount = stats.topTools[0]?.count ?? 1;
										return (
											<tr key={t.name}>
												<td style={s.td}>
													<div
														style={{
															display: "flex",
															alignItems: "center",
															gap: 8,
														}}
													>
														<div style={s.bar((t.count / maxCount) * 100)} />
														{t.name}
													</div>
												</td>
												<td
													style={{
														...s.td,
														textAlign: "right",
														fontWeight: 600,
													}}
												>
													{t.count}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}

					{/* Pending handoffs */}
					<div style={s.section}>
						<h2 style={s.sectionTitle}>Хүнд Шилжүүлэлтийн Төлөв</h2>
						{stats.handoffCount === 0 ? (
							<div style={s.empty}>
								Сүүлийн 7 хоногт хүнд шилжүүлэлт гараагүй.
							</div>
						) : (
							<table style={s.table}>
								<thead>
									<tr>
										<th style={s.th}>Төлөв</th>
										<th style={s.th}>Шалтгаан</th>
										<th style={s.th}>Асуулт</th>
									</tr>
								</thead>
								<tbody>
									{handoffs.map((h) => {
										const status = handoffStatusLabel(h.status);
										return (
											<tr key={h.id}>
												<td style={s.td}>
													<span style={s.badge(status.color)}>
														{status.label}
													</span>
												</td>
												<td style={s.td}>{h.reason}</td>
												<td
													style={{
														...s.td,
														maxWidth: 300,
														overflow: "hidden",
														textOverflow: "ellipsis",
													}}
												>
													{h.customerQuery}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}
					</div>
				</>
			)}

			{!stats && !loading && !error && (
				<div style={s.empty}>
					Байгуулгын ID оруулж "Харах" товчийг дарна уу.
				</div>
			)}
		</div>
	);
}
