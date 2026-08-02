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
	// New fields — optional-guarded for older API responses.
	responseTimeMs?: {
		p50: number;
		p95: number;
		p99: number;
		toolAverages: Array<{ name: string; avgMs: number }>;
	};
	conversationCount?: number;
}

interface HandoffItem {
	id: string;
	status: string;
	reason: string | null;
	customerQuery: string | null;
	createdAt: string;
}

interface ChannelItem {
	id: string;
	channel: string;
	pageName: string | null;
	productType: string;
	isActive: boolean;
	lastUserMessageAt: string | null;
	audience: string | null;
	createdAt: string;
}

interface ProfileForm {
	assistantName: string;
	businessSummary: string;
	tone: string;
	responseLanguage: string;
	contactDetails: string;
	responseRules: string;
	handoffMessage: string;
}

const EMPTY_FORM: ProfileForm = {
	assistantName: "",
	businessSummary: "",
	tone: "",
	responseLanguage: "",
	contactDetails: "",
	responseRules: "",
	handoffMessage: "",
};

const TONE_OPTIONS = [
	{ value: "professional", label: "Мэргэжлийн" },
	{ value: "friendly", label: "Найрсаг" },
	{ value: "formal", label: "Албан ёсны" },
	{ value: "casual", label: "Энгийн" },
] as const;

const CHANNEL_LABELS: Record<string, string> = {
	telegram: "Telegram",
	messenger: "Messenger",
	instagram: "Instagram",
	whatsapp: "WhatsApp",
};

// ─── Styles ───────────────────────────────────────────────────────────────

const s = {
	page: {
		maxWidth: 960,
		margin: "0 auto",
		padding: "24px 16px",
		fontFamily: "system-ui, sans-serif",
	} as React.CSSProperties,
	headerRow: {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 16,
		marginBottom: 8,
	} as React.CSSProperties,
	header: {
		fontSize: 24,
		fontWeight: 700,
		margin: 0,
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
	rtGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
		gap: 12,
		marginBottom: 16,
	} as React.CSSProperties,
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
		verticalAlign: "top",
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
		marginBottom: 16,
	} as React.CSSProperties,
	input: {
		padding: "8px 12px",
		border: "1px solid #d1d5db",
		borderRadius: 8,
		fontSize: 14,
		width: 220,
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
	buttonSmall: {
		padding: "5px 12px",
		fontSize: 12,
	} as React.CSSProperties,
	buttonDanger: {
		background: "#dc2626",
	} as React.CSSProperties,
	buttonGhost: {
		background: "#f3f4f6",
		color: "#374151",
		border: "1px solid #d1d5db",
	} as React.CSSProperties,
	buttonDisabled: {
		opacity: 0.5,
		cursor: "not-allowed",
	} as React.CSSProperties,
	form: {
		display: "flex",
		flexDirection: "column",
		gap: 14,
	} as React.CSSProperties,
	label: {
		display: "block",
		fontSize: 12,
		fontWeight: 600,
		color: "#6b7280",
		marginBottom: 4,
	} as React.CSSProperties,
	textarea: {
		padding: "8px 12px",
		border: "1px solid #d1d5db",
		borderRadius: 8,
		fontSize: 14,
		width: "100%",
		minHeight: 80,
		fontFamily: "inherit",
		resize: "vertical",
	} as React.CSSProperties,
	saveNote: {
		color: "#10b981",
		fontSize: 13,
		marginTop: 8,
	} as React.CSSProperties,
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
	const [orgId, setOrgId] = useState("");
	const [stats, setStats] = useState<UsageStats | null>(null);
	const [handoffs, setHandoffs] = useState<HandoffItem[]>([]);
	const [channels, setChannels] = useState<ChannelItem[]>([]);
	const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [resolvingId, setResolvingId] = useState<string | null>(null);
	const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
	const [savingProfile, setSavingProfile] = useState(false);
	const [profileSaved, setProfileSaved] = useState(false);

	async function loadData(quiet = false) {
		const org = orgId.trim();
		if (!org) return;
		if (!quiet) setLoading(true);
		setError(null);
		setProfileSaved(false);
		try {
			const [usageRes, handoffRes, channelRes, profileRes] = await Promise.all([
				fetch(`/api/dashboard/usage?orgId=${encodeURIComponent(org)}&days=7`),
				fetch(`/api/dashboard/handoffs?orgId=${encodeURIComponent(org)}`),
				fetch(`/api/dashboard/channels?orgId=${encodeURIComponent(org)}`),
				fetch(`/api/dashboard/profile?orgId=${encodeURIComponent(org)}`),
			]);

			const [usageData, handoffData, channelData, profileData] =
				await Promise.all([
					usageRes.json(),
					handoffRes.json(),
					channelRes.json(),
					profileRes.json(),
				]);

			if (!usageRes.ok || !handoffRes.ok || !channelRes.ok || !profileRes.ok) {
				throw new Error(
					(usageData as { error?: string })?.error ??
						(handoffData as { error?: string })?.error ??
						(channelData as { error?: string })?.error ??
						(profileData as { error?: string })?.error ??
						"API алдаа гарлаа",
				);
			}

			setStats(usageData as UsageStats);
			setHandoffs((handoffData as { handoffs: HandoffItem[] }).handoffs ?? []);
			setChannels((channelData as { channels: ChannelItem[] }).channels ?? []);
			// Quiet refreshes (after resolve/disconnect) keep in-progress form edits.
			if (quiet) return;
			const profile = (profileData as { profile: ProfileForm | null }).profile;
			setForm(
				profile
					? {
							assistantName: profile.assistantName ?? "",
							businessSummary: profile.businessSummary ?? "",
							tone: profile.tone ?? "",
							responseLanguage: profile.responseLanguage ?? "",
							contactDetails: profile.contactDetails ?? "",
							responseRules: profile.responseRules ?? "",
							handoffMessage: profile.handoffMessage ?? "",
						}
					: EMPTY_FORM,
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Алдаа гарлаа");
		} finally {
			if (!quiet) setLoading(false);
		}
	}

	function setField<K extends keyof ProfileForm>(key: K, value: string) {
		setForm((f) => ({ ...f, [key]: value }));
	}

	async function resolveHandoff(id: string) {
		setResolvingId(id);
		setError(null);
		try {
			const res = await fetch(`/api/dashboard/handoffs/${id}/resolve`, {
				method: "POST",
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			await loadData(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Шийдвэрлэхэд алдаа гарлаа",
			);
		} finally {
			setResolvingId(null);
		}
	}

	async function disconnectChannel(id: string) {
		setDisconnectingId(id);
		setError(null);
		try {
			const res = await fetch("/api/dashboard/channels", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId: orgId.trim(), id }),
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(data?.error ?? `HTTP ${res.status}`);
			}
			await loadData(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Сувгийг устгахад алдаа гарлаа",
			);
		} finally {
			setDisconnectingId(null);
		}
	}

	async function saveProfile() {
		if (!orgId.trim()) return;
		setSavingProfile(true);
		setError(null);
		setProfileSaved(false);
		try {
			const res = await fetch("/api/dashboard/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId: orgId.trim(), ...form }),
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(data?.error ?? `HTTP ${res.status}`);
			}
			setProfileSaved(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Профайл хадгалахад алдаа гарлаа",
			);
		} finally {
			setSavingProfile(false);
		}
	}

	async function logout() {
		try {
			await fetch("/api/dashboard/logout", { method: "POST" });
		} catch {
			// Still navigate — middleware will bounce back to login.
		}
		window.location.assign("/dashboard/login");
	}

	function formatTokens(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}

	function formatCost(n: number): string {
		if (n === 0) return "$0";
		return `$${n.toFixed(3)}`;
	}

	function formatDate(d: string): string {
		return new Date(d).toLocaleDateString("mn-MN", {
			month: "short",
			day: "numeric",
		});
	}

	function formatDateTime(d: string | null): string {
		if (!d) return "—";
		return new Date(d).toLocaleString("mn-MN");
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

	function channelLabel(channel: string): string {
		return CHANNEL_LABELS[channel] ?? channel;
	}

	function audienceLabel(audience: string | null): string {
		return audience === "internal" ? "Дотоод" : "Хэрэглэгч";
	}

	const maxTokens = Math.max(
		...(stats?.dailyBreakdown.map((d) => d.tokens) ?? [1]),
		1,
	);
	const rt = stats?.responseTimeMs;
	const hasResponseData =
		rt != null &&
		(rt.p50 > 0 || rt.p95 > 0 || rt.p99 > 0 || rt.toolAverages.length > 0);

	return (
		<div style={s.page}>
			<div style={s.headerRow}>
				<div>
					<h1 style={s.header}>📊 Agent Dashboard</h1>
					<p style={s.subtitle}>Байгуулгын AI ашиглалтын статистик</p>
				</div>
				<button
					type="button"
					style={{ ...s.button, ...s.buttonGhost }}
					onClick={logout}
				>
					Гарах
				</button>
			</div>

			{/* Org ID input */}
			<div style={{ marginBottom: 24, display: "flex", alignItems: "center" }}>
				<input
					style={s.input}
					type="text"
					placeholder="Organization ID"
					value={orgId}
					onChange={(e) => setOrgId(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && loadData()}
				/>
				<button
					type="button"
					style={s.button}
					onClick={() => loadData()}
					disabled={loading}
				>
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
							<div style={s.cardLabel}>Багажийн Дуудлага</div>
							<div style={s.cardValue}>{stats.totalToolCalls}</div>
							<div style={s.cardSub}>7 хоног</div>
						</div>
						<div style={s.card}>
							<div style={s.cardLabel}>Тооцоолсон Зардал</div>
							<div style={s.cardValue}>{formatCost(stats.estimatedCost)}</div>
							<div style={s.cardSub}>OpenCodeGo Flash ~$0.14/M</div>
						</div>
						<div style={s.card}>
							<div style={s.cardLabel}>Яриа</div>
							<div style={s.cardValue}>{stats.conversationCount ?? 0}</div>
							<div style={s.cardSub}>
								{stats.handoffResolvedCount}/{stats.handoffCount} шилжүүлэлт
								шийдвэрлэгдсэн
							</div>
						</div>
					</div>

					{/* Response time */}
					<div style={s.section}>
						<h2 style={s.sectionTitle}>Хариу Өгөх Хугацаа</h2>
						{!hasResponseData ? (
							<div style={s.empty}>Хариу өгөх хугацааны мэдээлэл байхгүй.</div>
						) : (
							<>
								<div style={s.rtGrid}>
									<div style={s.card}>
										<div style={s.cardLabel}>p50</div>
										<div style={s.cardValue}>
											{Math.round(rt?.p50 ?? 0)}
											<span style={s.cardSub}> мс</span>
										</div>
									</div>
									<div style={s.card}>
										<div style={s.cardLabel}>p95</div>
										<div style={s.cardValue}>
											{Math.round(rt?.p95 ?? 0)}
											<span style={s.cardSub}> мс</span>
										</div>
									</div>
									<div style={s.card}>
										<div style={s.cardLabel}>p99</div>
										<div style={s.cardValue}>
											{Math.round(rt?.p99 ?? 0)}
											<span style={s.cardSub}> мс</span>
										</div>
									</div>
								</div>
								{rt?.toolAverages && rt.toolAverages.length > 0 && (
									<table style={s.table}>
										<thead>
											<tr>
												<th style={s.th}>Багаж</th>
												<th style={{ ...s.th, textAlign: "right" }}>
													Дундаж (мс)
												</th>
											</tr>
										</thead>
										<tbody>
											{rt.toolAverages.map((t) => (
												<tr key={t.name}>
													<td style={s.td}>{t.name}</td>
													<td
														style={{
															...s.td,
															textAlign: "right",
															fontWeight: 600,
														}}
													>
														{Math.round(t.avgMs)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								)}
							</>
						)}
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

					{/* Handoffs */}
					<div style={s.section}>
						<h2 style={s.sectionTitle}>Хүнд Шилжүүлэлт</h2>
						{handoffs.length === 0 ? (
							<div style={s.empty}>Хүлээгдэж буй хүнд шилжүүлэлт байхгүй.</div>
						) : (
							<table style={s.table}>
								<thead>
									<tr>
										<th style={s.th}>Төлөв</th>
										<th style={s.th}>Шалтгаан</th>
										<th style={s.th}>Асуулт</th>
										<th style={s.th}>Огноо</th>
										<th style={{ ...s.th, textAlign: "right" }}>Үйлдэл</th>
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
												<td style={s.td}>{h.reason ?? "—"}</td>
												<td
													style={{
														...s.td,
														maxWidth: 280,
														overflow: "hidden",
														textOverflow: "ellipsis",
													}}
												>
													{h.customerQuery ?? "—"}
												</td>
												<td style={s.td}>{formatDateTime(h.createdAt)}</td>
												<td style={{ ...s.td, textAlign: "right" }}>
													<button
														type="button"
														style={{
															...s.button,
															...s.buttonSmall,
															...(resolvingId === h.id ? s.buttonDisabled : {}),
														}}
														onClick={() => resolveHandoff(h.id)}
														disabled={resolvingId === h.id}
													>
														{resolvingId === h.id
															? "Шийдвэрлэж..."
															: "Шийдвэрлэх"}
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}
					</div>

					{/* Channels */}
					<div style={s.section}>
						<h2 style={s.sectionTitle}>Холбогдсон Сувгууд</h2>
						{channels.length === 0 ? (
							<div style={s.empty}>Холбогдсон суваг байхгүй.</div>
						) : (
							<table style={s.table}>
								<thead>
									<tr>
										<th style={s.th}>Суваг</th>
										<th style={s.th}>Хуудас</th>
										<th style={s.th}>Бүтээгдэхүүн</th>
										<th style={s.th}>Аудитори</th>
										<th style={s.th}>Төлөв</th>
										<th style={s.th}>Сүүлийн мессеж</th>
										<th style={{ ...s.th, textAlign: "right" }}>Үйлдэл</th>
									</tr>
								</thead>
								<tbody>
									{channels.map((c) => (
										<tr key={c.id}>
											<td style={s.td}>{channelLabel(c.channel)}</td>
											<td style={s.td}>{c.pageName ?? "—"}</td>
											<td style={s.td}>{c.productType}</td>
											<td style={s.td}>{audienceLabel(c.audience)}</td>
											<td style={s.td}>
												{c.isActive ? (
													<span style={s.badge("#10b981")}>Идэвхтэй</span>
												) : (
													<span style={s.badge("#9ca3af")}>Идэвхгүй</span>
												)}
											</td>
											<td style={s.td}>
												{formatDateTime(c.lastUserMessageAt)}
											</td>
											<td style={{ ...s.td, textAlign: "right" }}>
												<button
													type="button"
													style={{
														...s.button,
														...s.buttonSmall,
														...s.buttonDanger,
														...(disconnectingId === c.id
															? s.buttonDisabled
															: {}),
													}}
													onClick={() => disconnectChannel(c.id)}
													disabled={disconnectingId === c.id}
												>
													{disconnectingId === c.id ? "Устгаж..." : "Устгах"}
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>

					{/* Profile editor */}
					<div style={s.section}>
						<h2 style={s.sectionTitle}>Агент Профайл (Дотоод)</h2>
						<div style={{ ...s.card, maxWidth: 560 }}>
							<div style={s.form}>
								<div>
									<label htmlFor="profile-assistantName" style={s.label}>
										Туслахын Нэр
									</label>
									<input
										id="profile-assistantName"
										style={s.input}
										type="text"
										value={form.assistantName}
										onChange={(e) => setField("assistantName", e.target.value)}
									/>
								</div>
								<div>
									<label htmlFor="profile-businessSummary" style={s.label}>
										Бизнесийн Тойм
									</label>
									<textarea
										id="profile-businessSummary"
										style={s.textarea}
										value={form.businessSummary}
										onChange={(e) =>
											setField("businessSummary", e.target.value)
										}
									/>
								</div>
								<div>
									<label htmlFor="profile-tone" style={s.label}>
										Аялга
									</label>
									<select
										id="profile-tone"
										style={s.input}
										value={form.tone}
										onChange={(e) => setField("tone", e.target.value)}
									>
										<option value="">Сонгох...</option>
										{TONE_OPTIONS.map((t) => (
											<option key={t.value} value={t.value}>
												{t.label}
											</option>
										))}
									</select>
								</div>
								<div>
									<label htmlFor="profile-responseLanguage" style={s.label}>
										Хариуны Хэл
									</label>
									<input
										id="profile-responseLanguage"
										style={s.input}
										type="text"
										value={form.responseLanguage}
										onChange={(e) =>
											setField("responseLanguage", e.target.value)
										}
									/>
								</div>
								<div>
									<label htmlFor="profile-contactDetails" style={s.label}>
										Холбоо Барих Мэдээлэл
									</label>
									<textarea
										id="profile-contactDetails"
										style={s.textarea}
										value={form.contactDetails}
										onChange={(e) => setField("contactDetails", e.target.value)}
									/>
								</div>
								<div>
									<label htmlFor="profile-responseRules" style={s.label}>
										Хариуны Дүрэм
									</label>
									<textarea
										id="profile-responseRules"
										style={s.textarea}
										value={form.responseRules}
										onChange={(e) => setField("responseRules", e.target.value)}
									/>
								</div>
								<div>
									<label htmlFor="profile-handoffMessage" style={s.label}>
										Шилжүүлэлтийн Мессеж
									</label>
									<textarea
										id="profile-handoffMessage"
										style={s.textarea}
										value={form.handoffMessage}
										onChange={(e) => setField("handoffMessage", e.target.value)}
									/>
								</div>
								<div>
									<button
										type="button"
										style={{
											...s.button,
											...(savingProfile ? s.buttonDisabled : {}),
										}}
										onClick={saveProfile}
										disabled={savingProfile}
									>
										{savingProfile ? "Хадгалж..." : "Хадгалах"}
									</button>
									{profileSaved && (
										<span style={s.saveNote}> Хадгалагдлаа ✓</span>
									)}
								</div>
							</div>
						</div>
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
