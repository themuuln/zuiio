/**
 * Cloudflare Worker — Scheduled QPay Poll
 *
 * Runs every minute via Cloudflare Cron Triggers (free, Hobby-friendly).
 * Calls the Vercel qpay-poll endpoint with CRON_SECRET so QPay orders
 * are checked even though Vercel Hobby only allows one cron per day.
 *
 * Why Cloudflare here: Vercel Hobby rejects `* * * * *` (needs Pro).
 * Cloudflare Workers allow `* * * * *` on free, and the Worker holds
 * no DB secrets — it just forwards with the shared CRON_SECRET.
 */

interface ScheduledEnv {
	AGENT_GATEWAY_URL: string;
	CRON_SECRET?: string;
}

export async function handleScheduledQpay(env: ScheduledEnv): Promise<void> {
	const base = env.AGENT_GATEWAY_URL?.replace(/\/$/, "");
	if (!base) {
		console.error("scheduled-qpay: AGENT_GATEWAY_URL not set");
		return;
	}
	const url = `${base}/api/cron/qpay-poll`;
	const headers: Record<string, string> = {};
	if (env.CRON_SECRET) headers.authorization = `Bearer ${env.CRON_SECRET}`;

	try {
		const res = await fetch(url, { method: "GET", headers });
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			console.error(`scheduled-qpay: ${res.status} ${text.slice(0, 200)}`);
		} else {
			const json = await res.text().catch(() => "");
			console.log(`scheduled-qpay: ok ${json.slice(0, 200)}`);
		}
	} catch (err) {
		console.error("scheduled-qpay fetch failed", err);
	}
}

// Cloudflare Workers scheduled handler — triggers from wrangler `triggers.crons`
export default {
	async scheduled(_event: { cron: string; scheduledTime: number }, env: ScheduledEnv) {
		await handleScheduledQpay(env);
	},
	async fetch(request: Request, env: ScheduledEnv) {
		// Manual trigger for testing: GET /__scheduled/qpay-poll
		const url = new URL(request.url);
		if (url.pathname === "/__scheduled/qpay-poll") {
			await handleScheduledQpay(env);
			return new Response("scheduled qpay triggered", { status: 200 });
		}
		return new Response("scheduled-qpay worker — use cron trigger", {
			status: 200,
		});
	},
};
