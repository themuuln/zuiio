/**
 * POST /api/flow/publish — Zatly flow publishing route.
 * CRON_SECRET is captured at module load, so every test re-imports the
 * module with vi.resetModules().
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCreateServiceClient = vi.fn();
vi.mock("@/lib/supabase", () => ({
	createServiceClient: (...a: unknown[]) => mockCreateServiceClient(...a),
}));

const ORG_ID = "org-flow-1";

function validBody(overrides: Record<string, unknown> = {}) {
	return {
		automationId: "auto-1",
		orgId: ORG_ID,
		productType: "zer",
		nodes: [
			{
				id: "start-1",
				type: "start",
				data: { label: "Start", trigger: "default" },
			},
			{
				id: "msg-1",
				type: "sendMessage",
				data: { label: "Hi", message: "Сайн уу" },
			},
		],
		edges: [{ id: "e1", source: "start-1", target: "msg-1" }],
		channel: "telegram",
		triggerKeywords: ["захиалга"],
		metadata: { name: "Test flow" },
		...overrides,
	};
}

function postReq(body: unknown, headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/flow/publish", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

const CHAIN_METHODS = [
	"select",
	"eq",
	"order",
	"limit",
	"single",
	"update",
	"or",
	"insert",
] as const;

function makeChain(results: Array<() => unknown>) {
	let callIndex = 0;
	const from = vi.fn(() => {
		const chain: Record<string, unknown> = {};
		for (const m of CHAIN_METHODS) {
			chain[m] = vi.fn().mockReturnValue(chain);
		}
		const result = results[callIndex];
		callIndex++;
		if (result) {
			(chain as unknown as { then: unknown }).then = (
				resolve: (v: unknown) => unknown,
			) => Promise.resolve().then(result).then(resolve);
		}
		return chain;
	});
	return { from, chain: () => from.mock.results[0]?.value };
}

describe("POST /api/flow/publish", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		delete process.env.CRON_SECRET;
	});

	it("rejects without bearer or x-api-key when CRON_SECRET is set", async () => {
		process.env.CRON_SECRET = "s3cret";
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(postReq(validBody()));
		expect(res.status).toBe(401);
	});

	it("accepts x-api-key auth", async () => {
		process.env.CRON_SECRET = "s3cret";
		const sb = makeChain([
			() => ({ data: [], error: null }), // version query
			() => ({ error: null }), // deactivate
			() => ({ data: { id: "fv-1" }, error: null }), // insert
		]);
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(postReq(validBody(), { "x-api-key": "s3cret" }));
		expect(res.status).toBe(200);
	});

	it("rejects invalid JSON", async () => {
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(postReq("{not-json"));
		expect(res.status).toBe(400);
		expect((await res.json()).error).toBe("Invalid JSON");
	});

	it("rejects missing required fields", async () => {
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(postReq({ orgId: ORG_ID }));
		expect(res.status).toBe(400);
		expect((await res.json()).error).toContain("Missing required fields");
	});

	it("rejects a flow with no start node", async () => {
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(
			postReq(
				validBody({
					nodes: [
						{
							id: "msg-1",
							type: "sendMessage",
							data: { label: "Hi", message: "x" },
						},
					],
				}),
			),
		);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("Invalid flow");
		expect(body.details).toEqual(
			expect.arrayContaining([
				expect.stringContaining("exactly one start node"),
			]),
		);
	});

	it("rejects a flow with an unknown node type", async () => {
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(
			postReq(
				validBody({
					nodes: [
						{
							id: "start-1",
							type: "start",
							data: { label: "S", trigger: "default" },
						},
						{ id: "x-1", type: "teleport", data: {} },
					],
				}),
			),
		);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.details[0]).toContain("invalid type");
	});

	it("rejects edges referencing unknown nodes", async () => {
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(
			postReq(
				validBody({
					edges: [{ id: "e1", source: "start-1", target: "ghost" }],
				}),
			),
		);
		expect(res.status).toBe(400);
		expect((await res.json()).details[0]).toContain("unknown target");
	});

	it("rejects a start node without an outgoing edge", async () => {
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(postReq(validBody({ edges: [] })));
		expect(res.status).toBe(400);
		expect((await res.json()).details).toEqual(
			expect.arrayContaining(["Start node must have an outgoing edge"]),
		);
	});

	it("rejects condition nodes missing true/false branches", async () => {
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(
			postReq(
				validBody({
					nodes: [
						{
							id: "start-1",
							type: "start",
							data: { label: "S", trigger: "default" },
						},
						{
							id: "cond-1",
							type: "condition",
							data: { field: "x", operator: "equals", value: "1", label: "C" },
						},
						{
							id: "msg-1",
							type: "sendMessage",
							data: { label: "Hi", message: "x" },
						},
					],
					edges: [
						{ id: "e1", source: "start-1", target: "cond-1" },
						{ id: "e2", source: "cond-1", target: "msg-1", label: "true" },
					],
				}),
			),
		);
		expect(res.status).toBe(400);
		expect((await res.json()).details[0]).toContain('"false"');
	});

	it("publishes a new version and deactivates previous ones", async () => {
		const sb = makeChain([
			() => ({ data: [], error: null }), // version query → version 1
			() => ({ error: null }), // deactivate previous
			() => ({ data: { id: "fv-1" }, error: null }), // insert
		]);
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(postReq(validBody()));

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.version).toBe(1);
		expect(body.flowVersionId).toBe("fv-1");

		// deactivation scoped by org + product_type (P1 cross-product fix)
		const deactivateChain = sb.from.mock.results[1]?.value as {
			update: ReturnType<typeof vi.fn>;
			eq: ReturnType<typeof vi.fn>;
		};
		expect(deactivateChain.update.mock.calls[0]?.[0]).toEqual({
			is_active: false,
		});
		expect(deactivateChain.eq.mock.calls).toEqual([
			["organization_id", ORG_ID],
			["product_type", "zer"],
			["is_active", true],
		]);

		// insert payload
		const insertChain = sb.from.mock.results[2]?.value as {
			insert: ReturnType<typeof vi.fn>;
		};
		const insertArgs = insertChain.insert.mock.calls[0] as unknown[];
		expect(insertArgs[0]).toMatchObject({
			organization_id: ORG_ID,
			product_type: "zer",
			channel: "telegram",
			trigger_keywords: ["захиалга"],
			is_active: true,
			version: 1,
		});
		// metadata carries the automation id and publish timestamp
		expect(insertArgs[0].metadata.automationId).toBe("auto-1");
		expect(typeof insertArgs[0].metadata.publishedAt).toBe("string");
	});

	it("increments the version from the latest row", async () => {
		const sb = makeChain([
			() => ({ data: [{ version: 3 }], error: null }),
			() => ({ error: null }),
			() => ({ data: { id: "fv-4" }, error: null }),
		]);
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(postReq(validBody()));
		const body = await res.json();
		expect(body.version).toBe(4);
		expect(body.flowVersionId).toBe("fv-4");
	});

	it("returns 500 when the insert fails", async () => {
		const sb = makeChain([
			() => ({ data: [], error: null }),
			() => ({ error: null }),
			() => ({ data: null, error: new Error("duplicate") }),
		]);
		mockCreateServiceClient.mockReturnValue(sb);
		const { POST } = await import("@/app/api/flow/publish/route");
		const res = await POST(postReq(validBody()));
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.details).toBe("duplicate");
	});
});
