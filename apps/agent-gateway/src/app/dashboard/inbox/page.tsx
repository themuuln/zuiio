"use client";

import { useEffect, useState } from "react";

interface Conversation {
	id: string;
	channel: string;
	channel_chat_id: string;
	channel_user_id: string;
	updated_at: string;
	last_message: string | null;
	last_user_message_at: string | null;
	unread: boolean;
	assigned: number | null;
	takeover: boolean;
	handoff?: { id: string; status: string };
}

export default function InboxPage() {
	const [orgId, setOrgId] = useState("");
	const [items, setItems] = useState<Conversation[]>([]);
	const [error, setError] = useState("");
	useEffect(() => {
		const org = new URLSearchParams(window.location.search).get("orgId") ?? "";
		setOrgId(org);
		if (!org) return;
		fetch(`/api/dashboard/inbox?orgId=${encodeURIComponent(org)}`)
			.then(async (r) => {
				const body = await r.json();
				if (!r.ok) throw new Error(body.error ?? "Inbox алдаа");
				setItems(body.conversations ?? []);
			})
			.catch((e: unknown) =>
				setError(e instanceof Error ? e.message : "Inbox алдаа"),
			);
	}, []);
	async function act(
		id: string,
		action: "takeover" | "return-to-ai" | "resolve",
	) {
		await fetch(`/api/dashboard/handoffs/${id}/${action}`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ orgId }),
		});
		setItems((old) => old.filter((x) => x.handoff?.id !== id));
	}
	return (
		<main
			style={{
				maxWidth: 1000,
				margin: "0 auto",
				padding: 32,
				fontFamily: "system-ui",
			}}
		>
			<h1>Хүний inbox</h1>
			{error && <p role="alert">{error}</p>}
			{items.length === 0 && !error && <p>Яриа алга.</p>}
			<div>
				{items.map((item) => (
					<article
						key={item.id}
						style={{
							border: "1px solid #ddd",
							borderRadius: 8,
							padding: 16,
							marginBottom: 12,
						}}
					>
						<strong>
							{item.channel} · {item.channel_user_id}
						</strong>
						{item.unread && (
							<span style={{ marginLeft: 8, color: "#b42318" }}>Шинэ</span>
						)}
						<p>{item.last_message ?? "Мессеж алга"}</p>
						<small>{item.last_user_message_at ?? item.updated_at}</small>
						{item.handoff && (
							<div style={{ marginTop: 12 }}>
								<span>
									{item.takeover ? "Ажилтан ажиллаж байна" : "Хүн хүлээж байна"}
								</span>
								{!item.takeover && (
									<button onClick={() => act(item.handoff?.id, "takeover")}>
										Авах
									</button>
								)}
								{item.takeover && (
									<button onClick={() => act(item.handoff?.id, "return-to-ai")}>
										AI-д буцаах
									</button>
								)}
								<button onClick={() => act(item.handoff?.id, "resolve")}>
									Шийдвэрлэх
								</button>
							</div>
						)}
					</article>
				))}
			</div>
		</main>
	);
}
