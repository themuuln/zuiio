"use client";

import { useEffect, useState } from "react";

interface ButtonItem {
	type: "postback" | "web_url";
	title: string;
	payload?: string;
	url?: string;
}
interface IceBreaker {
	question: string;
	payload: string;
}

export default function MenuPage() {
	const [orgId, setOrgId] = useState("");
	const [menu, setMenu] = useState<ButtonItem[]>([]);
	const [iceBreakers, setIceBreakers] = useState<IceBreaker[]>([]);
	const [status, setStatus] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const saved = window.localStorage.getItem("dashboard-org-id");
		if (saved) {
			setOrgId(saved);
			void load(saved);
		}
	}, []);
	async function load(org = orgId) {
		if (!org.trim()) return;
		setLoading(true);
		setStatus("");
		window.localStorage.setItem("dashboard-org-id", org.trim());
		const res = await fetch(
			`/api/dashboard/menu?orgId=${encodeURIComponent(org.trim())}`,
		);
		const data = await res.json();
		if (!res.ok) setStatus(data.error ?? "Ачаалж чадсангүй");
		else {
			setMenu(data.menu ?? []);
			setIceBreakers(data.iceBreakers ?? []);
		}
		setLoading(false);
	}
	async function save() {
		setLoading(true);
		setStatus("");
		const res = await fetch("/api/dashboard/menu", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orgId, menu, iceBreakers }),
		});
		const data = await res.json();
		setStatus(res.ok ? "Хадгалагдлаа" : (data.error ?? "Хадгалж чадсангүй"));
		setLoading(false);
	}
	return (
		<main
			style={{
				maxWidth: 900,
				margin: "0 auto",
				padding: 32,
				fontFamily: "system-ui",
			}}
		>
			<h1>Messenger цэс ба Ice Breakers</h1>
			<p>
				Бүх хэрэглэгчид харах Mongolian шошго, postback payload-аа тохируулна
				уу.
			</p>
			<div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
				<input
					aria-label="Organization ID"
					placeholder="Organization ID"
					value={orgId}
					onChange={(e) => setOrgId(e.target.value)}
				/>
				<button onClick={() => load()} disabled={loading}>
					Ачаалах
				</button>
			</div>
			<section>
				<h2>Persistent Menu ({menu.length}/5)</h2>
				{menu.map((item, i) => (
					<div
						key={i}
						style={{
							display: "flex",
							gap: 8,
							margin: "8px 0",
							flexWrap: "wrap",
						}}
					>
						<select
							aria-label="Товчийн төрөл"
							value={item.type}
							onChange={(e) =>
								setMenu(
									menu.map((x, j) =>
										j === i
											? { ...x, type: e.target.value as ButtonItem["type"] }
											: x,
									),
								)
							}
						>
							<option value="postback">Postback</option>
							<option value="web_url">Web URL</option>
						</select>
						<input
							aria-label="Товчны нэр"
							placeholder="Нэр"
							value={item.title}
							onChange={(e) =>
								setMenu(
									menu.map((x, j) =>
										j === i ? { ...x, title: e.target.value } : x,
									),
								)
							}
						/>
						<input
							aria-label="Payload эсвэл URL"
							placeholder={item.type === "web_url" ? "https://..." : "PAYLOAD"}
							value={
								item.type === "web_url"
									? (item.url ?? "")
									: (item.payload ?? "")
							}
							onChange={(e) =>
								setMenu(
									menu.map((x, j) =>
										j === i
											? {
													...x,
													[item.type === "web_url" ? "url" : "payload"]:
														e.target.value,
												}
											: x,
									),
								)
							}
						/>
						<button onClick={() => setMenu(menu.filter((_, j) => j !== i))}>
							Устгах
						</button>
					</div>
				))}
				<button
					disabled={menu.length >= 5}
					onClick={() =>
						setMenu([...menu, { type: "postback", title: "", payload: "" }])
					}
				>
					+ Товч нэмэх
				</button>
			</section>
			<section>
				<h2>Ice Breakers ({iceBreakers.length}/4)</h2>
				{iceBreakers.map((item, i) => (
					<div key={i} style={{ display: "flex", gap: 8, margin: "8px 0" }}>
						<input
							aria-label="Ice Breaker асуулт"
							placeholder="Асуулт"
							value={item.question}
							onChange={(e) =>
								setIceBreakers(
									iceBreakers.map((x, j) =>
										j === i ? { ...x, question: e.target.value } : x,
									),
								)
							}
						/>
						<input
							aria-label="Ice Breaker payload"
							placeholder="PAYLOAD"
							value={item.payload}
							onChange={(e) =>
								setIceBreakers(
									iceBreakers.map((x, j) =>
										j === i ? { ...x, payload: e.target.value } : x,
									),
								)
							}
						/>
						<button
							onClick={() =>
								setIceBreakers(iceBreakers.filter((_, j) => j !== i))
							}
						>
							Устгах
						</button>
					</div>
				))}
				<button
					disabled={iceBreakers.length >= 4}
					onClick={() =>
						setIceBreakers([...iceBreakers, { question: "", payload: "" }])
					}
				>
					+ Асуулт нэмэх
				</button>
			</section>
			<aside style={{ marginTop: 24, border: "1px solid #ddd", padding: 16 }}>
				<h2>Урьдчилан харах</h2>
				{menu.length ? (
					menu.map((x, i) => <div key={i}>▸ {x.title || "(хоосон)"}</div>)
				) : (
					<em>Цэс хоосон</em>
				)}
				{iceBreakers.length > 0 && (
					<>
						<h3>Ice Breakers</h3>
						{iceBreakers.map((x, i) => (
							<div key={i}>💬 {x.question || "(хоосон)"}</div>
						))}
					</>
				)}
			</aside>
			<div style={{ marginTop: 24 }}>
				<button onClick={save} disabled={loading || !orgId.trim()}>
					Хадгалах
				</button>
				{status && (
					<span role="status" style={{ marginLeft: 12 }}>
						{status}
					</span>
				)}
			</div>
		</main>
	);
}
