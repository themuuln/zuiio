"use client";

import { useEffect, useState } from "react";

interface Trace {
	trace_id: string;
	organization_id: string | null;
	channel: string;
	channel_chat_id: string | null;
	channel_user_id: string | null;
	request_text: string | null;
	response_text: string | null;
	tool_calls: unknown[];
	timings: Record<string, unknown> | null;
	status: string;
	error: string | null;
	request_id: string | null;
	deployment_id: string | null;
	created_at: string;
}

const s = {
	page: {
		maxWidth: 1100,
		margin: "0 auto",
		padding: "24px 16px",
		fontFamily: "system-ui, -apple-system, sans-serif",
	} as const,
	row: {
		display: "flex",
		gap: 8,
		flexWrap: "wrap" as const,
		alignItems: "center",
		marginBottom: 16,
	},
	input: {
		padding: "6px 10px",
		border: "1px solid #ddd",
		borderRadius: 6,
		fontSize: 14,
	} as const,
	btn: {
		padding: "6px 14px",
		border: "1px solid #111",
		borderRadius: 6,
		background: "#111",
		color: "#fff",
		cursor: "pointer",
		fontSize: 14,
	} as const,
	card: {
		border: "1px solid #e5e7eb",
		borderRadius: 10,
		padding: 14,
		marginBottom: 12,
		background: "#fff",
	} as const,
	mono: {
		fontFamily: "ui-monospace, monospace",
		fontSize: 12,
		background: "#f6f8fa",
		padding: "8px 10px",
		borderRadius: 6,
		whiteSpace: "pre-wrap" as const,
		wordBreak: "break-word" as const,
	} as const,
	badge: (status: string) =>
		({
			display: "inline-block",
			padding: "2px 8px",
			borderRadius: 999,
			fontSize: 12,
			fontWeight: 600,
			background: status === "ok" ? "#dcfce7" : status === "error" ? "#fee2e2" : "#e5e7eb",
			color: status === "ok" ? "#166534" : status === "error" ? "#991b1b" : "#374151",
		}) as const,
};

export default function TracesPage() {
	const [orgId, setOrgId] = useState("");
	const [channel, setChannel] = useState("");
	const [traceId, setTraceId] = useState("");
	const [limit, setLimit] = useState("50");
	const [traces, setTraces] = useState<Trace[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function load() {
		setLoading(true);
		setError(null);
		try {
			const q = new URLSearchParams();
			if (orgId.trim()) q.set("orgId", orgId.trim());
			if (channel) q.set("channel", channel);
			if (traceId.trim()) q.set("traceId", traceId.trim());
			q.set("limit", limit);
			const res = await fetch(`/api/dashboard/traces?${q.toString()}`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
			setTraces(json.traces ?? []);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div style={s.page}>
			<h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Gateway Traces</h1>
			<p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
				Persistent trace log — every Messenger / Telegram / Webchat request. Vercel logs are ephemeral (1h, 768 chars); this table keeps 30d.
				TraceId is `x-vercel-id` or UUID, also in Vercel JSON logs `traceId`.
			</p>

			<div style={s.row}>
				<input style={s.input} placeholder="orgId (uuid)" value={orgId} onChange={(e) => setOrgId(e.target.value)} />
				<select style={s.input} value={channel} onChange={(e) => setChannel(e.target.value)}>
					<option value="">all channels</option>
					<option value="messenger">messenger</option>
					<option value="instagram">instagram</option>
					<option value="telegram">telegram</option>
					<option value="webchat">webchat</option>
					<option value="whatsapp">whatsapp</option>
				</select>
				<input style={s.input} placeholder="traceId" value={traceId} onChange={(e) => setTraceId(e.target.value)} />
				<select style={s.input} value={limit} onChange={(e) => setLimit(e.target.value)}>
					<option value="20">20</option>
					<option value="50">50</option>
					<option value="100">100</option>
				</select>
				<button type="button" style={s.btn} onClick={load} disabled={loading}>
					{loading ? "…" : "Refresh"}
				</button>
				<a href="/dashboard" style={{ fontSize: 13, color: "#2563eb" }}>
					← Dashboard
				</a>
			</div>

			{error && <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>Error: {error}</div>}

			<div style={{ color: "#6b7280", fontSize: 12, marginBottom: 12 }}>
				{traces.length} trace(s) — newest first. JSON logs: <code>vercel logs --since 1h --json | jq</code> · DB: <code>gateway_traces</code>
			</div>

			{traces.map((t) => (
				<div key={t.trace_id} style={s.card}>
					<div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
						<span style={s.badge(t.status)}>{t.status}</span>
						<span style={{ fontSize: 12, color: "#6b7280" }}>{new Date(t.created_at).toLocaleString()}</span>
						<span style={{ fontSize: 12, color: "#374151" }}>{t.channel}</span>
						<code style={{ fontSize: 11, background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{t.trace_id.slice(0, 12)}…</code>
						{t.deployment_id && <code style={{ fontSize: 11, color: "#6b7280" }}>{t.deployment_id.slice(0, 7)}</code>}
					</div>

					<div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
						org <code>{t.organization_id ?? "—"}</code> · chat <code>{t.channel_chat_id ?? "—"}</code> · user <code>{t.channel_user_id ?? "—"}</code> · req <code>{t.request_id?.slice(0, 8) ?? "—"}</code>
					</div>

					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
						<div>
							<div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Request</div>
							<div style={s.mono}>{t.request_text ?? "—"}</div>
						</div>
						<div>
							<div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Response</div>
							<div style={s.mono}>{t.response_text ?? "—"}</div>
						</div>
					</div>

					{t.tool_calls && Array.isArray(t.tool_calls) && t.tool_calls.length > 0 && (
						<div style={{ marginBottom: 8 }}>
							<div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Tool calls ({t.tool_calls.length})</div>
							<div style={s.mono}>{JSON.stringify(t.tool_calls, null, 2)}</div>
						</div>
					)}

					{t.timings && (
						<div style={{ marginBottom: 8 }}>
							<div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Timings</div>
							<div style={s.mono}>{JSON.stringify(t.timings, null, 2)}</div>
						</div>
					)}

					{t.error && (
						<div style={{ color: "#991b1b", fontSize: 12, marginTop: 6, whiteSpace: "pre-wrap", wordBreak: "break-word" as const }}>
							Error: {t.error}
						</div>
					)}

					<details style={{ marginTop: 8 }}>
						<summary style={{ fontSize: 12, cursor: "pointer", color: "#2563eb" }}>Raw</summary>
						<pre style={s.mono}>{JSON.stringify(t, null, 2)}</pre>
					</details>
				</div>
			))}

			{traces.length === 0 && !loading && <div style={{ color: "#6b7280", fontSize: 13 }}>No traces yet — send a test message to the bot.</div>}
		</div>
	);
}
