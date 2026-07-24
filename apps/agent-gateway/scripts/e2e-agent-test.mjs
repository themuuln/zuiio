#!/usr/bin/env node
/**
 * E2E Agent Test — Telegram Agent-Gateway
 *
 * 1. Inserts a test telegram_link for (chat_id=12345, user_id=67890) → Tolom org
 * 2. Sends 10 Mongolian-language test messages to the deployed webhook
 * 3. Waits for agent processing, then queries the Supabase audit log
 * 4. Cleans up the test link
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const envRaw = readFileSync(envPath, "utf8");

function envVar(key) {
	const line = envRaw.split("\n").find((l) => l.startsWith(`${key}=`));
	if (!line) throw new Error(`Missing env var: ${key}`);
	return line
		.split("=")
		.slice(1)
		.join("=")
		.replace(/^["']|["']$/g, "");
}

const WEBHOOK_SECRET = envVar("TELEGRAM_WEBHOOK_SECRET");
const TOLOM_KEY = envVar("TOLOM_SUPABASE_SERVICE_ROLE_KEY");
const TOLOM_URL = envVar("TOLOM_SUPABASE_URL");
const WEBHOOK_URL =
	"https://agent-gateway-delta.vercel.app/api/telegram/webhook";

const TEST_CHAT_ID = 12345;
const TEST_USER_ID = 67890;
const TOLOM_ORG_ID = "78afa4fe-22f9-41e9-8ebd-2c6c03d3dc80";

// ── Test messages (Mongolian, Tolom auto repair shop owner) ──────────────────
const TEST_MESSAGES = [
	{
		id: 1,
		text: "Сайн байна уу",
		expectedTool: null,
		description: "Greeting — no tools expected",
	},
	{
		id: 2,
		text: "Өнөөдөр хэдэн захиалга идэвхтэй байна?",
		expectedTool: ["getDailySummary", "getActiveWorkOrders"],
		description: "Active orders count",
	},
	{
		id: 3,
		text: "Бат-Эрдэнэ хэн бэ?",
		expectedTool: ["getCustomerHistory"],
		description: "Customer lookup",
	},
	{
		id: 4,
		text: "Toyota Camry-ийн засварын түүх харуулаач",
		expectedTool: ["getVehicleAnalytics", "queryData"],
		description: "Vehicle service history",
	},
	{
		id: 5,
		text: "Энэ сарын орлого хэд байна?",
		expectedTool: ["getFinancialSummary"],
		description: "Monthly revenue",
	},
	{
		id: 6,
		text: "Хүлээгдэж буй нэхэмжлэлүүдийг харуулаач",
		expectedTool: ["getInvoiceStatus"],
		description: "Pending invoices",
	},
	{
		id: 7,
		text: "Зардлын хураангуй харуулаач",
		expectedTool: ["getExpensesSummary"],
		description: "Expense summary",
	},
	{
		id: 8,
		text: "Тэнгэр компани хэн бэ?",
		expectedTool: ["getSuppliers"],
		description: "Supplier lookup",
	},
	{
		id: 9,
		text: "Сэлбэгийн хамгийн их борлогдсон жагсаалт харуулаач",
		expectedTool: ["getSparePartsSales"],
		description: "Top spare parts",
	},
	{
		id: 10,
		text: "Нийт ажлын захиалгын тоо хэд вэ?",
		expectedTool: ["queryData"],
		description: "Total work order count",
	},
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function headers(extra = {}) {
	return {
		apikey: TOLOM_KEY,
		Authorization: `Bearer ${TOLOM_KEY}`,
		"Content-Type": "application/json",
		...extra,
	};
}

function buildTelegramUpdate(updateId, text) {
	return {
		update_id: updateId,
		message: {
			message_id: Math.floor(Math.random() * 1_000_000),
			from: {
				id: TEST_USER_ID,
				is_bot: false,
				first_name: "Test",
				last_name: "Owner",
				username: "test_owner",
				language_code: "mn",
			},
			chat: {
				id: TEST_CHAT_ID,
				first_name: "Test",
				last_name: "Owner",
				username: "test_owner",
				type: "private",
			},
			date: Math.floor(Date.now() / 1000),
			text,
		},
	};
}

async function sendWebhook(updateId, text) {
	const body = buildTelegramUpdate(updateId, text);
	const start = Date.now();

	const res = await fetch(WEBHOOK_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-telegram-bot-api-secret-token": WEBHOOK_SECRET,
		},
		body: JSON.stringify(body),
	});

	const elapsed = Date.now() - start;
	let responseBody;
	try {
		responseBody = await res.text();
	} catch {
		responseBody = "<could not read body>";
	}

	return { status: res.status, elapsed, body: responseBody, updateId };
}

async function queryAuditLog() {
	const url = `${TOLOM_URL}/rest/v1/agent_audit_log?select=tool_name,created_at,duration_ms&order=created_at.desc&limit=50`;
	const res = await fetch(url, { headers: headers() });
	if (!res.ok)
		throw new Error(
			`Supabase query failed (${res.status}): ${await res.text()}`,
		);
	return res.json();
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

async function ensureTestLink() {
	// Upsert the test link so resolveOrgFromChatUser can find it
	const url = `${TOLOM_URL}/rest/v1/telegram_links`;
	const body = {
		organization_id: TOLOM_ORG_ID,
		user_id: "00000000-0000-0000-0000-000000000001",
		telegram_chat_id: TEST_CHAT_ID,
		telegram_user_id: TEST_USER_ID,
		telegram_username: "test_owner",
		first_name: "Test",
		last_name: "Owner",

		is_active: true,
		notification_preferences: { productType: "tolom" },
		updated_at: new Date().toISOString(),
	};

	const res = await fetch(url, {
		method: "POST",
		headers: headers({ Prefer: "resolution=merge-duplicates" }),
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to insert test link (${res.status}): ${text}`);
	}
	console.log(
		"  ✓ Test telegram_link created (chat_id=12345, user_id=67890)\n",
	);
}

async function cleanupTestLink() {
	const url = `${TOLOM_URL}/rest/v1/telegram_links?telegram_chat_id=eq.${TEST_CHAT_ID}&telegram_user_id=eq.${TEST_USER_ID}`;
	const res = await fetch(url, { method: "DELETE", headers: headers() });
	if (res.ok) {
		console.log("  ✓ Test telegram_link removed");
	} else {
		console.log(`  ⚠ Failed to remove test link: ${res.status}`);
	}
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log("═══════════════════════════════════════════════════════════════");
console.log("  E2E Agent Test — Telegram Agent-Gateway");
console.log(`  Target: ${WEBHOOK_URL}`);
console.log(`  Org: ${TOLOM_ORG_ID}`);
console.log(`  Chat: ${TEST_CHAT_ID} / User: ${TEST_USER_ID}`);
console.log(`  Messages: ${TEST_MESSAGES.length}`);
console.log(
	"═══════════════════════════════════════════════════════════════\n",
);

// Phase 0: Ensure test link exists
console.log("── Phase 0: Setup ───────────────────────────────────────────");
try {
	await ensureTestLink();
} catch (err) {
	console.error(`Setup failed: ${err.message}`);
	process.exit(1);
}

// Phase 1: Send all messages
console.log("── Phase 1: Sending Messages ────────────────────────────────");
const results = [];
for (const msg of TEST_MESSAGES) {
	const updateId = 900_000_000 + msg.id;
	console.log(`[${msg.id}/10] Sending: "${msg.text}"`);

	try {
		const res = await sendWebhook(updateId, msg.text);
		results.push({ ...msg, ...res, error: null });
		console.log(
			`       → HTTP ${res.status} (${res.elapsed}ms) | body: ${res.body.slice(0, 120)}`,
		);
	} catch (err) {
		results.push({
			...msg,
			status: 0,
			elapsed: 0,
			body: "",
			error: err.message,
		});
		console.log(`       → ERROR: ${err.message}`);
	}

	if (msg.id < TEST_MESSAGES.length) {
		console.log(`       Waiting 5s before next message...`);
		await sleep(5_000);
	}
}

console.log(
	"\n───────────────────────────────────────────────────────────────",
);
console.log("  Phase 1 Complete — All messages sent");
console.log(
	"───────────────────────────────────────────────────────────────\n",
);

// Phase 2: Wait for agents to finish processing, then query audit log
console.log("── Phase 2: Waiting for Agent Processing ────────────────────");
console.log("Waiting 45s for agents to process all messages...");
await sleep(45_000);

console.log(
	"\n───────────────────────────────────────────────────────────────",
);
console.log("  Phase 2: Querying Supabase Audit Log");
console.log(
	"───────────────────────────────────────────────────────────────\n",
);

let auditRows = [];
try {
	auditRows = await queryAuditLog();
	console.log(
		`Found ${auditRows.length} audit log entries (last 50 by created_at desc)\n`,
	);
} catch (err) {
	console.error(`Failed to query audit log: ${err.message}\n`);
}

// ── Report ───────────────────────────────────────────────────────────────────

console.log("═══════════════════════════════════════════════════════════════");
console.log("  REPORT");
console.log(
	"═══════════════════════════════════════════════════════════════\n",
);

// Webhook results
console.log("── Webhook Results ───────────────────────────────────────────");
let sendErrors = 0;
for (const r of results) {
	const status = r.error ? `ERROR: ${r.error}` : `HTTP ${r.status}`;
	console.log(
		`  ${String(r.id).padStart(2)} │ ${status.padEnd(20)} │ ${String(r.elapsed).padStart(5)}ms │ ${r.description}`,
	);
	if (r.error || r.status >= 400) sendErrors++;
}
console.log(
	`\n  Sent: ${results.length - sendErrors} OK, ${sendErrors} failed\n`,
);

// Audit log
console.log("── Audit Log (tool calls) ────────────────────────────────────");
if (auditRows.length === 0) {
	console.log("  No audit log entries found.\n");
} else {
	const toolCounts = {};
	for (const row of auditRows) {
		const tool = row.tool_name || "(no tool)";
		toolCounts[tool] = (toolCounts[tool] || 0) + 1;
	}

	console.log("  Tool call frequency:");
	for (const [tool, count] of Object.entries(toolCounts).sort(
		(a, b) => b[1] - a[1],
	)) {
		console.log(`    ${tool.padEnd(30)} × ${count}`);
	}

	console.log("\n  Recent entries (newest first):");
	for (const row of auditRows.slice(0, 20)) {
		const ts = row.created_at ? new Date(row.created_at).toISOString() : "?";
		const dur = row.duration_ms != null ? `${row.duration_ms}ms` : "?";
		console.log(`    ${ts}  ${dur.padStart(8)}  ${row.tool_name || "(none)"}`);
	}
}

// Expected vs actual
console.log("\n── Expected Tool Coverage ────────────────────────────────────");
const calledTools = new Set(auditRows.map((r) => r.tool_name).filter(Boolean));

for (const msg of TEST_MESSAGES) {
	const expected = msg.expectedTool;
	if (!expected) {
		console.log(
			`  ${String(msg.id).padStart(2)} │ ${msg.description.padEnd(35)} │ No tools expected ✓`,
		);
		continue;
	}
	const anyCalled = expected.some((t) => calledTools.has(t));
	const status = anyCalled ? "✓" : "✗ (none of expected tools found)";
	const called = expected.filter((t) => calledTools.has(t));
	console.log(
		`  ${String(msg.id).padStart(2)} │ ${msg.description.padEnd(35)} │ ${status}`,
	);
	if (called.length > 0) {
		console.log(`     │ Called: ${called.join(", ")}`);
	} else {
		console.log(`     │ Expected one of: ${expected.join(", ")}`);
	}
}

// Phase 3: Cleanup
console.log("\n── Phase 3: Cleanup ─────────────────────────────────────────");
await cleanupTestLink();

console.log(
	"\n═══════════════════════════════════════════════════════════════",
);
console.log("  DONE");
console.log("═══════════════════════════════════════════════════════════════");
